CREATE TYPE "StudyGroup" AS ENUM ('TREATMENT', 'CONTROL');

ALTER TABLE "Participant"
ADD COLUMN "assignedGroup" "StudyGroup";

ALTER TABLE "TrialOrderSet"
ADD COLUMN "assignmentGroup" "StudyGroup" NOT NULL DEFAULT 'TREATMENT';

CREATE INDEX "Participant_assignedGroup_idx"
ON "Participant"("assignedGroup");

CREATE INDEX "TrialOrderSet_assignmentGroup_active_idx"
ON "TrialOrderSet"("assignmentGroup", "active");
