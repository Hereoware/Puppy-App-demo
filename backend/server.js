import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { bearerSession, issueSession, requireAdmin, requireParticipant } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import { DEFAULT_STUDY_DAY_MINUTES, dateInZone, studyScheduleForParticipant } from "./lib/study-schedule.js";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(backendDirectory, ".env") });
const app = express();
const port = Number(process.env.PORT || 3001);
const projectRoot = path.dirname(backendDirectory);
const isProduction = process.env.NODE_ENV === "production";
const localTrialCaptureEnabled = process.env.NODE_ENV === "development" && process.env.PUPPY_LOCAL_TRIAL_CAPTURE === "true";
const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? "" : "puppy-local-admin");
const jwtSecret = process.env.JWT_SECRET || (isProduction ? "" : "puppy-local-dev-secret-only-do-not-deploy");
if (isProduction && (jwtSecret.length < 32 || adminPassword.length < 16 || adminPassword === "puppy-local-admin")) {
  console.error("Production requires JWT_SECRET (at least 32 characters) and ADMIN_PASSWORD (at least 16 characters), configured as hosting secrets.");
  process.exit(1);
}
console.log(`Local PostgreSQL trial capture: ${localTrialCaptureEnabled ? "enabled" : "disabled"}`);
if (isProduction) app.set("trust proxy", 1);

app.use(express.json({ limit: "2mb" }));

// Serve only the app's public files. Do not expose backend source, .env, or node_modules.
app.get("/", (_request, response) => response.sendFile(path.join(projectRoot, "index.html")));
app.get("/admin", (_request, response) => response.sendFile(path.join(projectRoot, "admin.html")));
for (const filename of ["app.js", "admin.js", "trial-order-parser.mjs", "styles.css", "firebase-config.js", "firebase-data.js", "manifest.webmanifest", "service-worker.js"]) {
  app.get(`/${filename}`, (_request, response) => response.sendFile(path.join(projectRoot, filename)));
}
app.use("/icons", express.static(path.join(projectRoot, "icons"), { dotfiles: "deny", index: false }));

app.use("/api", (_request, response, next) => {
  if (_request.path === "/health") return next();
  if (!isProduction && !localTrialCaptureEnabled) return response.status(403).json({ error: "Local trial capture is disabled." });
  next();
});

const participantSchema = z.object({
  participantId: z.string().min(1).max(40).optional(),
  puppyName: z.string().trim().min(1).max(24)
});
const recoverySchema = z.object({ recoveryCode: z.string().trim().min(8).max(80) });
const recoveryCodeUpdateSchema = z.object({ participantId: z.string().min(1).max(40), recoveryCode: z.string().trim().min(8).max(80).optional() });
const responseSchema = z.object({
  participantId: z.string().min(1).max(40),
  studyDay: z.number().int().min(1).max(24),
  studyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  moodPrediction: z.enum(["HAPPY", "SAD"]).optional(),
  actualMood: z.enum(["HAPPY", "SAD"]).optional(),
  predictedEScore: z.number().int().min(-1).max(10).optional(),
  interactions: z.object({ fed: z.boolean(), played: z.boolean(), foodDurationMs: z.number().int().min(0).max(60000).optional(), activityDurationMs: z.number().int().min(0).max(60000).optional() }),
  requestId: z.string().min(8).max(80)
}).refine((value) => value.predictedEScore !== undefined || value.moodPrediction !== undefined, {
  message: "A prediction is required."
});

const studyGroupSchema = z.enum(["TREATMENT", "CONTROL"]);
const importedTrialSchema = z.object({
  day: z.number().int().min(1).max(24),
  t: z.number().int().min(0).max(1),
  a: z.number().int().min(0).max(1),
  e: z.number().int().min(-1).max(10),
  tLabel: z.string().trim().min(1).max(80),
  aLabel: z.string().trim().min(1).max(80)
});
const trialOrderImportSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80).default("Uncategorized"),
  assignmentGroup: studyGroupSchema,
  versions: z.array(z.object({
    code: z.string().trim().min(1).max(40),
    trials: z.array(importedTrialSchema).length(24)
  })).min(1).max(500)
}).superRefine((value, context) => {
  const seen = new Set();
  value.versions.forEach((version, versionIndex) => {
    if (seen.has(version.code)) context.addIssue({ code: "custom", path: ["versions", versionIndex, "code"], message: `Duplicate version ${version.code}.` });
    seen.add(version.code);
    const days = new Set(version.trials.map((trial) => trial.day));
    if (days.size !== 24 || !Array.from({ length: 24 }, (_, index) => days.has(index + 1)).every(Boolean)) {
      context.addIssue({ code: "custom", path: ["versions", versionIndex, "trials"], message: `${version.code} must contain each day 1–24 exactly once.` });
    }
  });
});
const trialOrderMetadataSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  assignmentGroup: studyGroupSchema.optional()
});

const adminLoginAttempts = new Map();
const requestRateLimits = new Map();
function limitRequests(scope, maxRequests, windowMs) {
  return (request, response, next) => {
    const now = Date.now();
    const key = `${scope}:${request.ip || request.socket.remoteAddress || "unknown"}`;
    const previous = requestRateLimits.get(key);
    if (previous && previous.resetAt > now && previous.count >= maxRequests) {
      response.set("Retry-After", String(Math.ceil((previous.resetAt - now) / 1000)));
      return response.status(429).json({ error: "Too many requests. Try again later." });
    }
    const entry = previous && previous.resetAt > now ? previous : { count: 0, resetAt: now + windowMs };
    entry.count += 1;
    requestRateLimits.set(key, entry);
    if (requestRateLimits.size > 10000) {
      for (const [entryKey, value] of requestRateLimits) if (value.resetAt <= now) requestRateLimits.delete(entryKey);
    }
    return next();
  };
}
const limitEnrollment = limitRequests("enroll", 10, 60 * 60 * 1000);
const limitRecovery = limitRequests("recover", 10, 15 * 60 * 1000);
function limitAdminLogin(request, response, next) {
  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || "unknown";
  const previous = adminLoginAttempts.get(key);
  if (previous && previous.resetAt > now && previous.count >= 5) {
    response.set("Retry-After", String(Math.ceil((previous.resetAt - now) / 1000)));
    return response.status(429).json({ error: "Too many login attempts. Try again later." });
  }
  const entry = previous && previous.resetAt > now ? previous : { count: 0, resetAt: now + 15 * 60 * 1000 };
  entry.count += 1;
  adminLoginAttempts.set(key, entry);
  return next();
}
function passwordMatches(candidate) {
  const provided = Buffer.from(String(candidate || ""));
  const expected = Buffer.from(adminPassword);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
function recoveryDigest(code) {
  return createHash("sha256").update(String(code).replace(/[^a-z0-9]/gi, "").toUpperCase()).digest("hex");
}
function newRecoveryCode() {
  return randomBytes(16).toString("hex").toUpperCase().match(/.{1,4}/g).join("-");
}

app.post("/api/admin/login", limitAdminLogin, (request, response) => {
  if (!passwordMatches(request.body?.password)) return response.status(401).json({ error: "The researcher password is incorrect." });
  const key = request.ip || request.socket.remoteAddress || "unknown";
  adminLoginAttempts.delete(key);
  response.json({ token: issueSession("admin", "researcher") });
});

app.get("/api/admin/trial-orders", requireAdmin, async (_request, response) => {
  const sets = await prisma.trialOrderSet.findMany({
    include: { versions: { include: { _count: { select: { assigned: true } } }, orderBy: { code: "asc" } } },
    orderBy: { createdAt: "desc" }
  });
  response.json(sets.map((set) => ({
    id: set.id,
    name: set.name,
    category: normalizeCategoryLabel(set.category),
    assignmentGroup: set.assignmentGroup,
    active: set.active,
    createdAt: set.createdAt,
    versions: set.versions.map((version) => ({ code: version.code, assignedCount: version._count.assigned, days: version.trials.length }))
  })));
});

app.post("/api/admin/trial-orders", requireAdmin, async (request, response) => {
  const parsed = trialOrderImportSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message || "The trial-order file is invalid." });
  const payload = parsed.data;
  const created = await prisma.$transaction(async (tx) => {
    await tx.trialOrderSet.updateMany({ where: { active: true, assignmentGroup: payload.assignmentGroup }, data: { active: false } });
    return tx.trialOrderSet.create({
      data: {
        name: payload.name,
        category: normalizeCategoryLabel(payload.category),
        assignmentGroup: payload.assignmentGroup,
        active: true,
        versions: {
          create: payload.versions.map((version) => ({
            code: version.code,
            trials: version.trials.sort((left, right) => left.day - right.day)
          }))
        }
      },
      include: { _count: { select: { versions: true } } }
    });
  });
  response.status(201).json({ id: created.id, name: created.name, versionCount: created._count.versions, active: created.active, assignmentGroup: created.assignmentGroup });
});

app.patch("/api/admin/trial-orders/:id", requireAdmin, async (request, response) => {
  const parsed = trialOrderMetadataSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid trial-order details." });
  const existing = await prisma.trialOrderSet.findUnique({ where: { id: request.params.id }, select: { id: true } });
  if (!existing) return response.status(404).json({ error: "Trial-order set was not found." });
  const set = await prisma.trialOrderSet.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      category: normalizeCategoryLabel(parsed.data.category),
      ...(parsed.data.assignmentGroup ? { assignmentGroup: parsed.data.assignmentGroup } : {})
    }
  });
  response.json({ id: set.id, name: set.name, category: normalizeCategoryLabel(set.category), assignmentGroup: set.assignmentGroup, active: set.active });
});

app.post("/api/admin/trial-orders/:id/activate", requireAdmin, async (request, response) => {
  const existing = await prisma.trialOrderSet.findUnique({ where: { id: request.params.id }, include: { _count: { select: { versions: true } } } });
  if (!existing) return response.status(404).json({ error: "Trial-order set was not found." });
  if (!existing._count.versions) return response.status(409).json({ error: "This set has no versions to assign." });
  await prisma.$transaction(async (tx) => {
    await tx.trialOrderSet.updateMany({ where: { active: true, assignmentGroup: existing.assignmentGroup }, data: { active: false } });
    await tx.trialOrderSet.update({ where: { id: existing.id }, data: { active: true } });
  });
  response.json({ id: existing.id, assignmentGroup: existing.assignmentGroup, active: true });
});

app.delete("/api/admin/trial-orders/:id", requireAdmin, async (request, response) => {
  const existing = await prisma.trialOrderSet.findUnique({
    where: { id: request.params.id },
    include: { versions: { select: { _count: { select: { assigned: true } } } } }
  });
  if (!existing) return response.status(404).json({ error: "Trial-order set was not found." });
  if (existing.active) return response.status(409).json({ error: "Activate another trial-order set before deleting the active set." });
  const assignedCount = existing.versions.reduce((sum, version) => sum + version._count.assigned, 0);
  if (assignedCount > 0) return response.status(409).json({ error: `Cannot delete this set because ${assignedCount} participant(s) are assigned to it.` });
  await prisma.trialOrderSet.delete({ where: { id: existing.id } });
  response.status(204).end();
});

function normalizeCategoryLabel(category) {
  return category === "未分类" ? "Uncategorized" : category;
}
function pickRandomVersion(versions) {
  return versions[randomInt(versions.length)];
}
async function activeTrialSetsByGroup(client = prisma) {
  const activeSets = await client.trialOrderSet.findMany({ where: { active: true }, include: { versions: true }, orderBy: { createdAt: "desc" } });
  const byGroup = new Map();
  for (const set of activeSets) {
    if (!set.versions.length || byGroup.has(set.assignmentGroup)) continue;
    byGroup.set(set.assignmentGroup, set);
  }
  return byGroup;
}
async function chooseBalancedAssignment(client = prisma) {
  const activeSets = await activeTrialSetsByGroup(client);
  const treatmentSet = activeSets.get("TREATMENT");
  const controlSet = activeSets.get("CONTROL");
  if (!treatmentSet && !controlSet) return null;
  if (!treatmentSet) {
    const version = pickRandomVersion(controlSet.versions);
    return { assignedGroup: "CONTROL", assignedVersionId: version.id, assignedVersionCode: version.code };
  }
  if (!controlSet) {
    const version = pickRandomVersion(treatmentSet.versions);
    return { assignedGroup: "TREATMENT", assignedVersionId: version.id, assignedVersionCode: version.code };
  }
  const counts = await client.participant.groupBy({
    by: ["assignedGroup"],
    _count: { _all: true },
    where: { assignedGroup: { in: ["TREATMENT", "CONTROL"] } }
  });
  const treatmentCount = counts.find((item) => item.assignedGroup === "TREATMENT")?._count._all || 0;
  const controlCount = counts.find((item) => item.assignedGroup === "CONTROL")?._count._all || 0;
  const assignedGroup = treatmentCount === controlCount
    ? (randomInt(2) === 0 ? "TREATMENT" : "CONTROL")
    : treatmentCount < controlCount ? "TREATMENT" : "CONTROL";
  const set = activeSets.get(assignedGroup);
  const version = pickRandomVersion(set.versions);
  return { assignedGroup, assignedVersionId: version.id, assignedVersionCode: version.code };
}
async function hydrateParticipantAssignment(participant, client = prisma) {
  if (!participant) return null;
  if (participant.assignedVersionId && participant.assignedGroup) return participant;
  if (participant.assignedVersionId) {
    const assignedVersion = await client.trialOrderVersion.findUnique({
      where: { id: participant.assignedVersionId },
      select: { set: { select: { assignmentGroup: true } } }
    });
    const inferredGroup = assignedVersion?.set?.assignmentGroup || null;
    if (inferredGroup && participant.assignedGroup !== inferredGroup) {
      return client.participant.update({ where: { id: participant.id }, data: { assignedGroup: inferredGroup } });
    }
    return participant;
  }
  const assignment = await chooseBalancedAssignment(client);
  if (!assignment) return null;
  return client.participant.update({
    where: { id: participant.id },
    data: { assignedVersionId: assignment.assignedVersionId, assignedGroup: assignment.assignedGroup }
  });
}
async function readParticipantAssignment(participant) {
  if (!participant?.assignedVersionId) return { assignedVersion: null, assignedGroup: participant?.assignedGroup || null };
  const assignedVersion = await prisma.trialOrderVersion.findUnique({
    where: { id: participant.assignedVersionId },
    select: { code: true, set: { select: { assignmentGroup: true } } }
  });
  const assignedGroup = participant.assignedGroup || assignedVersion?.set?.assignmentGroup || null;
  if (assignedGroup && participant.assignedGroup !== assignedGroup) {
    await prisma.participant.update({ where: { id: participant.id }, data: { assignedGroup } });
  }
  return { assignedVersion: assignedVersion?.code || null, assignedGroup };
}

app.post("/api/participants", limitEnrollment, async (request, response) => {
  const parsed = participantSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Enter a puppy name between 1 and 24 characters." });
  const requestedId = parsed.data.participantId;
  const session = bearerSession(request);
  if (requestedId && !session && !localTrialCaptureEnabled) return response.status(401).json({ error: "Restore this participant with its recovery code." });
  if (requestedId && session && session.role !== "participant") return response.status(403).json({ error: "A participant session is required to resume this account." });
  if (requestedId && session && session.sub !== requestedId) return response.status(403).json({ error: "This participant session cannot access that record." });

  let participant;
  if (requestedId && session) {
    participant = await prisma.participant.findUnique({ where: { id: requestedId } });
    if (!participant) return response.status(404).json({ error: "Participant was not found." });
    participant = await prisma.participant.update({ where: { id: requestedId }, data: { puppyName: parsed.data.puppyName } });
  } else if (requestedId) {
    participant = await prisma.participant.findUnique({ where: { id: requestedId } });
    if (participant) participant = await prisma.participant.update({ where: { id: requestedId }, data: { puppyName: parsed.data.puppyName } });
    else {
      const assignment = await chooseBalancedAssignment();
      if (!assignment) return response.status(409).json({ error: "No active treatment/control trial order is available. Import one from the researcher page first." });
      participant = await prisma.participant.create({
        data: {
          id: requestedId,
          puppyName: parsed.data.puppyName,
          assignedGroup: assignment.assignedGroup,
          assignedVersionId: assignment.assignedVersionId
        }
      });
    }
  } else {
    const assignment = await chooseBalancedAssignment();
    if (!assignment) return response.status(409).json({ error: "No active treatment/control trial order is available. Import one from the researcher page first." });
    participant = await prisma.participant.create({
      data: {
        puppyName: parsed.data.puppyName,
        assignedGroup: assignment.assignedGroup,
        assignedVersionId: assignment.assignedVersionId
      }
    });
  }

  participant = await hydrateParticipantAssignment(participant);
  if (!participant?.assignedVersionId) return response.status(409).json({ error: "No active treatment/control trial order is available. Import one from the researcher page first." });
  let recoveryCode = null;
  if (!participant.recoveryCodeDigest) {
    recoveryCode = newRecoveryCode();
    participant = await prisma.participant.update({ where: { id: participant.id }, data: { recoveryCodeDigest: recoveryDigest(recoveryCode) } });
  }
  const assignment = await readParticipantAssignment(participant);
  const schedule = studyScheduleForParticipant(participant);
  response.status(201).json({
    participantId: participant.id,
    puppyName: participant.puppyName,
    assignedGroup: assignment.assignedGroup,
    assignedVersion: assignment.assignedVersion,
    enrolledDate: dateInZone(participant.enrolledAt, participant.timeZone),
    enrolledAt: participant.enrolledAt.toISOString(),
    studyDayMinutes: schedule.studyDayMinutes,
    token: issueSession("participant", participant.id),
    recoveryCode
  });
});

app.post("/api/participants/recover", limitRecovery, async (request, response) => {
  const parsed = recoverySchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Enter a valid recovery code." });
  const participant = await prisma.participant.findUnique({ where: { recoveryCodeDigest: recoveryDigest(parsed.data.recoveryCode) } });
  if (!participant || participant.status !== "ACTIVE") return response.status(404).json({ error: "Recovery code not recognized." });
  const recoveryCode = newRecoveryCode();
  const rotated = await prisma.participant.updateMany({ where: { id: participant.id, recoveryCodeDigest: recoveryDigest(parsed.data.recoveryCode) }, data: { recoveryCodeDigest: recoveryDigest(recoveryCode) } });
  if (rotated.count !== 1) return response.status(404).json({ error: "Recovery code not recognized." });
  const schedule = studyScheduleForParticipant(participant);
  const today = schedule.currentStudyDate;
  const currentDay = schedule.currentStudyDay;
  const savedToday = currentDay <= 24 ? await prisma.dailyResponse.findUnique({ where: { participantId_studyDay: { participantId: participant.id, studyDay: currentDay } }, select: { studyDate: true } }) : null;
  const assignment = await readParticipantAssignment(participant);
  response.json({ participantId: participant.id, puppyName: participant.puppyName, assignedGroup: assignment.assignedGroup, assignedVersion: assignment.assignedVersion, enrolledDate: dateInZone(participant.enrolledAt, participant.timeZone), enrolledAt: participant.enrolledAt.toISOString(), studyDayMinutes: schedule.studyDayMinutes, token: issueSession("participant", participant.id), recoveryCode, completedToday: Boolean(savedToday), completedDate: savedToday ? today : null, completedStudyDay: savedToday ? currentDay : null });
});

app.post("/api/participants/recovery-code", async (request, response) => {
  const parsed = recoveryCodeUpdateSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Enter a recovery code between 8 and 80 characters." });
  const { participantId } = parsed.data;
  if (!requireParticipant(request, response, participantId)) return;
  const recoveryCode = parsed.data.recoveryCode?.trim() || newRecoveryCode();
  await prisma.participant.update({ where: { id: participantId }, data: { recoveryCodeDigest: recoveryDigest(recoveryCode) } });
  response.json({ recoveryCode });
});

app.get("/api/participants/:participantId/trials/:studyDay", async (request, response) => {
  if (!requireParticipant(request, response, request.params.participantId)) return;
  const day = Number(request.params.studyDay);
  if (!Number.isInteger(day) || day < 1 || day > 24) return response.status(400).json({ error: "Invalid study day." });
  const participant = await prisma.participant.findUnique({
    where: { id: request.params.participantId },
    include: { assignedVersion: true }
  });
  if (!participant || participant.status !== "ACTIVE") return response.status(404).json({ error: "Participant was not found." });
  const schedule = studyScheduleForParticipant(participant);
  const currentDay = schedule.currentStudyDay;
  if (day !== currentDay) return response.status(409).json({ error: "Only the current study day is available." });
  const existing = await prisma.dailyResponse.findUnique({ where: { participantId_studyDay: { participantId: participant.id, studyDay: day } } });
  if (existing) return response.status(409).json({ error: "Today’s trial is already complete." });
  const trial = Array.isArray(participant.assignedVersion?.trials)
    ? participant.assignedVersion.trials.find((item) => item.day === day)
    : null;
  if (!trial) return response.status(409).json({ error: "No assigned trial is available for this day." });
  response.json({ assignedVersion: participant.assignedVersion.code, studyDate: schedule.currentStudyDate, studyDayMinutes: schedule.studyDayMinutes, ...trial });
});

app.post("/api/responses", async (request, response) => {
  const parsed = responseSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "The trial response is incomplete or invalid." });
  const data = parsed.data;
  if (!requireParticipant(request, response, data.participantId)) return;
  const participant = await prisma.participant.findUnique({ where: { id: data.participantId } });
  if (!participant || participant.status !== "ACTIVE") return response.status(404).json({ error: "Participant was not found." });

  const schedule = studyScheduleForParticipant(participant);
  const currentDay = schedule.currentStudyDay;
  if (data.studyDay !== currentDay) return response.status(409).json({ error: "A response can only be submitted for the current study day." });

  const previousRequest = await prisma.dailyResponse.findUnique({ where: { participantId_requestId: { participantId: data.participantId, requestId: data.requestId } } });
  if (previousRequest) return response.json({ saved: true, alreadySaved: true });
  const previousDay = await prisma.dailyResponse.findUnique({ where: { participantId_studyDay: { participantId: data.participantId, studyDay: data.studyDay } } });
  if (previousDay) return response.status(409).json({ error: "A response already exists for this study day." });

  const date = new Date(`${data.studyDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.studyDate) return response.status(400).json({ error: "Invalid study date." });
  const assignedVersion = participant.assignedVersionId
    ? await prisma.trialOrderVersion.findUnique({ where: { id: participant.assignedVersionId } })
    : null;
  const assignedTrial = Array.isArray(assignedVersion?.trials) ? assignedVersion.trials.find((trial) => trial.day === data.studyDay) : null;
  if (assignedTrial && data.studyDate !== schedule.currentStudyDate) {
    return response.status(409).json({ error: "The response date must be today in the study time zone." });
  }
  try {
    await prisma.dailyResponse.create({
      data: {
        participantId: data.participantId,
        studyDay: data.studyDay,
        studyDate: date,
        moodPrediction: data.moodPrediction,
        actualMood: data.actualMood,
        predictedEScore: data.predictedEScore,
        actualEScore: assignedTrial?.e,
        tValue: assignedTrial?.t,
        aValue: assignedTrial?.a,
        tLabel: assignedTrial?.tLabel,
        aLabel: assignedTrial?.aLabel,
        fed: data.interactions.fed,
        played: data.interactions.played,
        foodDurationMs: data.interactions.foodDurationMs,
        activityDurationMs: data.interactions.activityDurationMs,
        requestId: data.requestId
      }
    });
  } catch (error) {
    if (error.code === "P2002") return response.status(409).json({ error: "A response already exists for this study day." });
    throw error;
  }

  const shouldAutoAdvance = schedule.studyDayMinutes < DEFAULT_STUDY_DAY_MINUTES && currentDay < 24;
  if (shouldAutoAdvance) {
    const now = new Date();
    const advancedEnrollment = new Date(now.getTime() - currentDay * schedule.studyDayMinutes * 60000);
    await prisma.participant.update({ where: { id: participant.id }, data: { enrolledAt: advancedEnrollment } });
    return response.status(201).json({ saved: true, alreadySaved: false, autoAdvanced: true, nextStudyDay: currentDay + 1, enrolledAt: advancedEnrollment.toISOString() });
  }

  response.status(201).json({ saved: true, alreadySaved: false, autoAdvanced: false });
});

app.get("/api/health", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ ok: true, database: "connected" });
});

app.get("/api/responses", requireAdmin, async (_request, response) => {
  const responses = await prisma.dailyResponse.findMany({
    include: {
      participant: {
        select: {
          puppyName: true,
          assignedGroup: true,
          assignedVersion: { select: { code: true, set: { select: { assignmentGroup: true } } } }
        }
      }
    },
    orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }]
  });
  response.json(responses);
});

app.get("/api/participants", requireAdmin, async (_request, response) => {
  const participants = await prisma.participant.findMany({
    select: {
      id: true,
      puppyName: true,
      enrolledAt: true,
      status: true,
      assignedGroup: true,
      assignedVersion: { select: { code: true, set: { select: { assignmentGroup: true } } } },
      _count: { select: { responses: true } }
    },
    orderBy: { enrolledAt: "desc" }
  });
  response.json(participants.map(({ _count, ...participant }) => ({
    ...participant,
    assignedGroup: participant.assignedGroup || participant.assignedVersion?.set?.assignmentGroup || null,
    responseCount: _count.responses
  })));
});

app.use((error, _request, response, _next) => {
  console.error("Unhandled API error", error);
  response.status(500).json({ error: "Internal server error" });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Puppy Study API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);





