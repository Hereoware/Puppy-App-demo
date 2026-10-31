-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'TERMINATED');

-- CreateEnum
CREATE TYPE "MoodPrediction" AS ENUM ('HAPPY', 'SAD');

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "puppyName" VARCHAR(24) NOT NULL,
    "enrolledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
    "status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "recoveryCodeDigest" TEXT,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyResponse" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "studyDay" INTEGER NOT NULL,
    "studyDate" DATE NOT NULL,
    "moodPrediction" "MoodPrediction" NOT NULL,
    "fed" BOOLEAN NOT NULL,
    "played" BOOLEAN NOT NULL,
    "requestId" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_recoveryCodeDigest_key" ON "Participant"("recoveryCodeDigest");

-- CreateIndex
CREATE INDEX "DailyResponse_studyDate_idx" ON "DailyResponse"("studyDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyResponse_participantId_studyDay_key" ON "DailyResponse"("participantId", "studyDay");

-- CreateIndex
CREATE UNIQUE INDEX "DailyResponse_participantId_requestId_key" ON "DailyResponse"("participantId", "requestId");

-- AddForeignKey
ALTER TABLE "DailyResponse" ADD CONSTRAINT "DailyResponse_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
