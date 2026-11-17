CREATE TYPE "StudyTimeframe" AS ENUM ('SHORT', 'LONG');

ALTER TABLE "Participant"
ADD COLUMN "timeframe" "StudyTimeframe" NOT NULL DEFAULT 'LONG';

CREATE INDEX "Participant_timeframe_assignedGroup_idx"
ON "Participant"("timeframe", "assignedGroup");
