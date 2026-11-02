ALTER TABLE "Participant"
ADD COLUMN "assignedVersionId" TEXT;

CREATE INDEX "Participant_assignedVersionId_idx"
ON "Participant"("assignedVersionId");

ALTER TABLE "DailyResponse"
ALTER COLUMN "moodPrediction" DROP NOT NULL,
ALTER COLUMN "actualMood" DROP NOT NULL,
ADD COLUMN "predictedEScore" INTEGER,
ADD COLUMN "actualEScore" INTEGER,
ADD COLUMN "tValue" INTEGER,
ADD COLUMN "aValue" INTEGER,
ADD COLUMN "tLabel" VARCHAR(80),
ADD COLUMN "aLabel" VARCHAR(80),
ADD COLUMN "foodDurationMs" INTEGER,
ADD COLUMN "activityDurationMs" INTEGER;

CREATE TABLE "TrialOrderSet" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrialOrderSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrialOrderVersion" (
  "id" TEXT NOT NULL,
  "setId" TEXT NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "trials" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrialOrderVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrialOrderVersion_setId_code_key"
ON "TrialOrderVersion"("setId", "code");
CREATE INDEX "TrialOrderVersion_setId_idx"
ON "TrialOrderVersion"("setId");

ALTER TABLE "TrialOrderVersion"
ADD CONSTRAINT "TrialOrderVersion_setId_fkey"
FOREIGN KEY ("setId") REFERENCES "TrialOrderSet"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Participant"
ADD CONSTRAINT "Participant_assignedVersionId_fkey"
FOREIGN KEY ("assignedVersionId") REFERENCES "TrialOrderVersion"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
