import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STUDY_DAY_MINUTES, currentStudyDay, parseStudyDayMinutes, studyScheduleForParticipant } from "../backend/lib/study-schedule.js";

test("falls back to the standard one-day schedule for invalid config", () => {
  assert.equal(parseStudyDayMinutes(undefined), DEFAULT_STUDY_DAY_MINUTES);
  assert.equal(parseStudyDayMinutes("0"), DEFAULT_STUDY_DAY_MINUTES);
  assert.equal(parseStudyDayMinutes("not-a-number"), DEFAULT_STUDY_DAY_MINUTES);
});

test("uses calendar-day behavior for the standard schedule", () => {
  const enrolledAt = new Date("2026-11-12T23:30:00.000Z");
  const now = new Date("2026-11-13T01:00:00.000Z");
  assert.equal(currentStudyDay(enrolledAt, { now, timeZone: "America/New_York", studyDayMinutes: 1440 }), 1);
});

test("advances the study day by elapsed quick-test blocks", () => {
  const enrolledAt = new Date("2026-11-12T13:00:00.000Z");
  const now = new Date("2026-11-12T15:05:00.000Z");
  assert.equal(currentStudyDay(enrolledAt, { now, studyDayMinutes: 60 }), 3);
});

test("builds a participant schedule from the environment", () => {
  const participant = { enrolledAt: new Date("2026-11-12T13:00:00.000Z"), timeZone: "America/New_York" };
  const schedule = studyScheduleForParticipant(participant, { now: new Date("2026-11-12T14:15:00.000Z"), env: { PUPPY_STUDY_DAY_MINUTES: "60" } });
  assert.equal(schedule.timeframe, "SHORT");
  assert.equal(schedule.studyDayMinutes, 60);
  assert.equal(schedule.currentStudyDay, 2);
});

test("short participants advance immediately while long participants keep calendar-day cadence", () => {
  const enrolledAt = new Date("2026-11-12T13:00:00.000Z");
  const now = new Date("2026-11-12T13:00:00.000Z");
  const shortSchedule = studyScheduleForParticipant({ enrolledAt, timeframe: "SHORT" }, { now, completedStudyDays: 0 });
  const shortNextDay = studyScheduleForParticipant({ enrolledAt, timeframe: "SHORT" }, { now, completedStudyDays: 1 });
  const shortComplete = studyScheduleForParticipant({ enrolledAt, timeframe: "SHORT" }, { now, completedStudyDays: 24 });
  const longSchedule = studyScheduleForParticipant({ enrolledAt, timeframe: "LONG" }, { now, env: { PUPPY_STUDY_DAY_MINUTES: "60" } });

  assert.equal(shortSchedule.timeframe, "SHORT");
  assert.equal(shortSchedule.studyDayMinutes, 1);
  assert.equal(shortSchedule.currentStudyDay, 1);
  assert.equal(shortNextDay.currentStudyDay, 2);
  assert.equal(shortComplete.currentStudyDay, 25);
  assert.equal(longSchedule.timeframe, "LONG");
  assert.equal(longSchedule.studyDayMinutes, DEFAULT_STUDY_DAY_MINUTES);
  assert.equal(longSchedule.currentStudyDay, 1);
  assert.equal(shortSchedule.currentStudyDate, "2026-11-12");
});
