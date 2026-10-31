import dotenv from "dotenv";
import express from "express";
import path from "node:path";
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

app.use(express.json({ limit: "32kb" }));

// Serve only the app's public files. Do not expose backend source, .env, or node_modules.
app.get("/", (_request, response) => response.sendFile(path.join(projectRoot, "index.html")));
for (const filename of ["app.js", "styles.css", "firebase-config.js", "firebase-data.js", "manifest.webmanifest", "service-worker.js"]) {
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
  moodPrediction: z.enum(["HAPPY", "SAD"]),
  actualMood: z.enum(["HAPPY", "SAD"]),
  interactions: z.object({ fed: z.boolean(), played: z.boolean() }),
  requestId: z.string().min(8).max(80)
});

app.post("/api/participants", async (request, response) => {
  const parsed = participantSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "Enter a puppy name between 1 and 24 characters." });
  const participant = parsed.data.participantId
    ? await prisma.participant.upsert({
        where: { id: parsed.data.participantId },
        create: { id: parsed.data.participantId, puppyName: parsed.data.puppyName },
        update: { puppyName: parsed.data.puppyName }
      })
    : await prisma.participant.create({ data: { puppyName: parsed.data.puppyName } });
  response.status(201).json({ participantId: participant.id, puppyName: participant.puppyName });
});

app.post("/api/responses", async (request, response) => {
  const parsed = responseSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: "The trial response is incomplete or invalid." });
  const data = parsed.data;
  const participant = await prisma.participant.findUnique({ where: { id: data.participantId } });
  if (!participant || participant.status !== "ACTIVE") return response.status(404).json({ error: "Participant was not found." });

  const previousRequest = await prisma.dailyResponse.findUnique({ where: { participantId_requestId: { participantId: data.participantId, requestId: data.requestId } } });
  if (previousRequest) return response.json({ saved: true, alreadySaved: true });
  const previousDay = await prisma.dailyResponse.findUnique({ where: { participantId_studyDay: { participantId: data.participantId, studyDay: data.studyDay } } });
  if (previousDay) return response.status(409).json({ error: "A response already exists for this study day." });

  const date = new Date(`${data.studyDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.studyDate) return response.status(400).json({ error: "Invalid study date." });
  try {
    await prisma.dailyResponse.create({
      data: {
        participantId: data.participantId,
        studyDay: data.studyDay,
        studyDate: date,
        moodPrediction: data.moodPrediction,
        actualMood: data.actualMood,
        fed: data.interactions.fed,
        played: data.interactions.played,
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
