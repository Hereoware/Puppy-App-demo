/*
  Warnings:

  - Added the required column `actualMood` to the `DailyResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DailyResponse" ADD COLUMN     "actualMood" "MoodPrediction" NOT NULL;
