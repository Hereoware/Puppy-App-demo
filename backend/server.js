import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { randomInt } from "node:crypto";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(backendDirectory, ".env") });
const app = express();
const port = Number(process.env.PORT || 3001);
const projectRoot = path.dirname(backendDirectory);
const localTrialCaptureEnabled = process.env.NODE_ENV === "development" && process.env.PUPPY_LOCAL_TRIAL_CAPTURE === "true";
console.log(`Local PostgreSQL trial capture: ${localTrialCaptureEnabled ? "enabled" : "disabled"}`);

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
  if (!localTrialCaptureEnabled) return response.status(403).json({ error: "Local trial capture is disabled." });
  next();
});

const participantSchema = z.object({
  participantId: z.string().min(1).max(40).optional(),
  puppyName: z.string().trim().min(1).max(24)
});
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

function dateInZone(date, timeZone = "America/New_York") {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function calendarDayNumber(enrolledAt, today) {
  const enrolled = dateInZone(enrolledAt);
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${enrolled}T00:00:00Z`)) / 86400000) + 1;
}

app.get("/api/admin/trial-orders", async (_request, response) => {
  const sets = await prisma.trialOrderSet.findMany({
    include: { versions: { include: { _count: { select: { assigned: true } } }, orderBy: { code: "asc" } } },
    orderBy: { createdAt: "desc" }
  });
  response.json(sets.map((set) => ({
    id: set.id,
    name: set.name,
    active: set.active,
    createdAt: set.createdAt,
    versions: set.versions.map((version) => ({ code: version.code, assignedCount: version._count.assigned, days: version.trials.length }))
  })));
});

app.post("/api/admin/trial-orders", async (request, response) => {
  const parsed = trialOrderImportSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message || "The trial-order file is invalid." });
  const payload = parsed.data;
  const created = await prisma.$transaction(async (tx) => {
    await tx.trialOrderSet.updateMany({ where: { active: true }, data: { active: false } });
    return tx.trialOrderSet.create({
      data: {
        name: payload.name,
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
  response.status(201).json({ id: created.id, name: created.name, versionCount: created._count.versions, active: created.active });
});

app.post("/api/participants", async (request, response) => {
  const parsed = participantSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Enter a puppy name between 1 and 24 characters." });
  let participant;
  let assignedVersion;
  if (parsed.data.participantId) {
    participant = await prisma.participant.findUnique({ where: { id: parsed.data.participantId } });
    if (participant) participant = await prisma.participant.update({ where: { id: participant.id }, data: { puppyName: parsed.data.puppyName } });
    else {
      const activeSet = await prisma.trialOrderSet.findFirst({ where: { active: true }, include: { versions: true }, orderBy: { createdAt: "desc" } });
      if (!activeSet?.versions.length) return response.status(409).json({ error: "No trial order is active. Import one from the local admin page first." });
      assignedVersion = activeSet.versions[randomInt(activeSet.versions.length)];
      participant = await prisma.participant.create({ data: { id: parsed.data.participantId, puppyName: parsed.data.puppyName, assignedVersionId: assignedVersion.id } });
    }
    if (!participant.assignedVersionId) {
      const activeSet = await prisma.trialOrderSet.findFirst({ where: { active: true }, include: { versions: true }, orderBy: { createdAt: "desc" } });
      if (!activeSet?.versions.length) return response.status(409).json({ error: "No trial order is active. Import one from the local admin page first." });
      assignedVersion = activeSet.versions[randomInt(activeSet.versions.length)];
      participant = await prisma.participant.update({ where: { id: participant.id }, data: { assignedVersionId: assignedVersion.id } });
    }
    assignedVersion = participant.assignedVersionId
      ? await prisma.trialOrderVersion.findUnique({ where: { id: participant.assignedVersionId }, select: { code: true } })
      : null;
  } else {
    const activeSet = await prisma.trialOrderSet.findFirst({ where: { active: true }, include: { versions: true }, orderBy: { createdAt: "desc" } });
    if (!activeSet?.versions.length) return response.status(409).json({ error: "No trial order is active. Import one from the local admin page first." });
    assignedVersion = activeSet.versions[randomInt(activeSet.versions.length)];
    participant = await prisma.participant.create({ data: { puppyName: parsed.data.puppyName, assignedVersionId: assignedVersion.id } });
  }
  response.status(201).json({ participantId: participant.id, puppyName: participant.puppyName, assignedVersion: assignedVersion?.code || null, enrolledDate: dateInZone(participant.enrolledAt, participant.timeZone) });
});

app.get("/api/participants/:participantId/trials/:studyDay", async (request, response) => {
  const day = Number(request.params.studyDay);
  if (!Number.isInteger(day) || day < 1 || day > 24) return response.status(400).json({ error: "Invalid study day." });
  const participant = await prisma.participant.findUnique({
    where: { id: request.params.participantId },
    include: { assignedVersion: true }
  });
  if (!participant || participant.status !== "ACTIVE") return response.status(404).json({ error: "Participant was not found." });
  const currentDay = calendarDayNumber(participant.enrolledAt, dateInZone(new Date(), participant.timeZone));
  if (day !== currentDay) return response.status(409).json({ error: "Only the current study day is available." });
  const existing = await prisma.dailyResponse.findUnique({ where: { participantId_studyDay: { participantId: participant.id, studyDay: day } } });
  if (existing) return response.status(409).json({ error: "Today’s trial is already complete." });
  const trial = Array.isArray(participant.assignedVersion?.trials)
    ? participant.assignedVersion.trials.find((item) => item.day === day)
    : null;
  if (!trial) return response.status(409).json({ error: "No assigned trial is available for this day." });
  response.json({ assignedVersion: participant.assignedVersion.code, studyDate: dateInZone(new Date(), participant.timeZone), ...trial });
});

app.post("/api/responses", async (request, response) => {
  const parsed = responseSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "The trial response is incomplete or invalid." });
  const data = parsed.data;
  const participant = await prisma.participant.findUnique({ where: { id: data.participantId } });
  if (!participant || participant.status !== "ACTIVE") return response.status(404).json({ error: "Participant was not found." });

  const currentDay = calendarDayNumber(participant.enrolledAt, dateInZone(new Date(), participant.timeZone));
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
  if (assignedTrial && data.studyDate !== dateInZone(new Date(), participant.timeZone)) {
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
  response.status(201).json({ saved: true, alreadySaved: false });
});

app.get("/api/health", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ ok: true, database: "connected" });
});

app.get("/api/responses", async (_request, response) => {
  const responses = await prisma.dailyResponse.findMany({
    include: { participant: { select: { puppyName: true } } },
    orderBy: [{ studyDate: "desc" }, { createdAt: "desc" }]
  });
  response.json(responses);
});

app.get("/api/participants", async (_request, response) => {
  const participants = await prisma.participant.findMany({
    select: { id: true, puppyName: true, enrolledAt: true, status: true, _count: { select: { responses: true } } },
    orderBy: { enrolledAt: "desc" }
  });
  response.json(participants);
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
