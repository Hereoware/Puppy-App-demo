ALTER TABLE "DailyResponse"
ADD COLUMN "foodAffectsE" BOOLEAN,
ADD COLUMN "foodEScore" INTEGER,
ADD COLUMN "foodComparisonLabel" VARCHAR(80),
ADD COLUMN "activityAffectsE" BOOLEAN,
ADD COLUMN "activityEScore" INTEGER,
ADD COLUMN "activityComparisonLabel" VARCHAR(80);

ALTER TABLE "DailyResponse"
ADD CONSTRAINT "DailyResponse_predictedEScore_range_check"
CHECK ("predictedEScore" BETWEEN 0 AND 12) NOT VALID,
ADD CONSTRAINT "DailyResponse_actualEScore_range_check"
CHECK ("actualEScore" BETWEEN 0 AND 12) NOT VALID,
ADD CONSTRAINT "DailyResponse_foodEScore_range_check"
CHECK ("foodEScore" BETWEEN 0 AND 12) NOT VALID,
ADD CONSTRAINT "DailyResponse_activityEScore_range_check"
CHECK ("activityEScore" BETWEEN 0 AND 12) NOT VALID;
