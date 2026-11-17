import assert from "node:assert/strict";
import test from "node:test";
import { responseSchema } from "../backend/lib/response-schema.js";
import { saveDailyResponse } from "../backend/lib/daily-response-store.js";
import { isCompleteSurvey, isSurveyDay, nextScreenAfterPrediction, surveyFollowupVisible, trialChoiceOptions } from "../study-days.mjs";
import { importedTrialSchema } from "../backend/lib/response-schema.js";

const response = (studyDay, survey) => ({
  participantId: "participant-1",
  studyDay,
  studyDate: "2026-11-15",
  predictedEScore: 0,
  interactions: { fed: true, played: true },
  ...(survey === undefined ? {} : { survey }),
  requestId: "request-123456"
});

test("only days 8, 16, and 24 trigger the questionnaire", () => {
  for (const day of [8, 16, 24]) assert.equal(isSurveyDay(day), true);
  for (const day of [1, 7, 9, 15, 17, 23]) assert.equal(isSurveyDay(day), false);
  for (const day of [8, 16, 24]) assert.equal(nextScreenAfterPrediction(day), "survey");
  for (const day of [1, 7, 9, 15, 17, 23]) assert.equal(nextScreenAfterPrediction(day), "feedback");
});

test("no-effect answers hide follow-ups and need no score or comparison", () => {
  assert.equal(surveyFollowupVisible(false), false);
  assert.equal(surveyFollowupVisible(true), true);
  const survey = { foodAffectsE: false, activityAffectsE: false };
  assert.equal(isCompleteSurvey(8, survey), true);
  assert.equal(responseSchema.safeParse(response(8, survey)).success, true);
  assert.equal(isCompleteSurvey(7, undefined), true);
  assert.equal(isCompleteSurvey(8, undefined), false);
});

test("milestone survey requires complete follow-ups and integer E values in 0–12", () => {
  const missing = responseSchema.safeParse(response(16));
  assert.equal(missing.success, false);
  assert.match(missing.error.issues[0].message, /questionnaire is required/);
  const yesWithoutFollowups = response(16, { foodAffectsE: true, activityAffectsE: false });
  assert.equal(responseSchema.safeParse(yesWithoutFollowups).success, false);
  const noWithExtraScore = responseSchema.safeParse(response(8, {
    foodAffectsE: false, foodEScore: 5, activityAffectsE: false
  }));
  assert.equal(noWithExtraScore.success, false);
  const boundaryAnswers = {
    foodAffectsE: true,
    foodEScore: 0,
    foodComparisonLabel: "Carrots",
    activityAffectsE: true,
    activityEScore: 12,
    activityComparisonLabel: "Fetch"
  };
  assert.equal(responseSchema.safeParse(response(24, boundaryAnswers)).success, true);
  for (const score of [0, 12]) {
    assert.equal(responseSchema.safeParse({ ...response(7), predictedEScore: score }).success, true);
    assert.equal(importedTrialSchema.safeParse({ day: 1, t: 0, a: 1, e: score, tLabel: "Food", aLabel: "Activity" }).success, true);
  }
  for (const score of [-1, 13]) {
    assert.equal(responseSchema.safeParse({ ...response(7), predictedEScore: score }).success, false);
    assert.equal(importedTrialSchema.safeParse({ day: 1, t: 0, a: 1, e: score, tLabel: "Food", aLabel: "Activity" }).success, false);
  }
  for (const invalidScore of [-1, 13, 1.5]) {
    const invalid = { ...boundaryAnswers, foodEScore: invalidScore };
    const result = responseSchema.safeParse(response(8, invalid));
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, /0 to 12/);
  }
});

test("non-milestone responses cannot submit a questionnaire", () => {
  const result = responseSchema.safeParse(response(7, { foodAffectsE: false, activityAffectsE: false }));
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /only available on study days 8, 16, and 24/);
});

test("choice labels are derived from the assigned version trials", () => {
  const trials = [
    { t: 0, tLabel: "Sardines", a: 0, aLabel: "Fetch" },
    { t: 1, tLabel: "Carrots", a: 1, aLabel: "Tug" }
  ];
  assert.deepEqual(trialChoiceOptions(trials, "t", "tLabel"), [
    { value: 0, label: "Sardines" },
    { value: 1, label: "Carrots" }
  ]);
  assert.deepEqual(trialChoiceOptions(trials, "a", "aLabel"), [
    { value: 0, label: "Fetch" },
    { value: 1, label: "Tug" }
  ]);
});

test("daily response persistence saves survey answers once and rejects a second request for that day", async () => {
  const stored = [];
  const mockPrisma = {
    dailyResponse: {
      async findUnique({ where }) {
        if (where.participantId_requestId) {
          return stored.find((row) => row.participantId === where.participantId_requestId.participantId
            && row.requestId === where.participantId_requestId.requestId) || null;
        }
        return stored.find((row) => row.participantId === where.participantId_studyDay.participantId
          && row.studyDay === where.participantId_studyDay.studyDay) || null;
      },
      async create({ data }) { stored.push(data); }
    }
  };
  const data = {
    participantId: "participant-1",
    studyDay: 8,
    requestId: "request-123456",
    foodAffectsE: false,
    foodEScore: null,
    foodComparisonLabel: null,
    activityAffectsE: true,
    activityEScore: 12,
    activityComparisonLabel: "Fetch"
  };

  assert.deepEqual(await saveDailyResponse(mockPrisma, data), { alreadySaved: false });
  assert.deepEqual(await saveDailyResponse(mockPrisma, data), { alreadySaved: true });
  assert.deepEqual(await saveDailyResponse(mockPrisma, { ...data, requestId: "request-654321" }), { conflict: true });
  assert.equal(stored.length, 1);
  assert.deepEqual(stored[0], data);
});

test("concurrent duplicate submissions are handled idempotently", async () => {
  const stored = [];
  let releaseCreate;
  const createGate = new Promise((resolve) => { releaseCreate = resolve; });
  let createsStarted = 0;
  const mockPrisma = {
    dailyResponse: {
      async findUnique({ where }) {
        await Promise.resolve();
        if (where.participantId_requestId) {
          return stored.find((row) => row.participantId === where.participantId_requestId.participantId
            && row.requestId === where.participantId_requestId.requestId) || null;
        }
        return stored.find((row) => row.participantId === where.participantId_studyDay.participantId
          && row.studyDay === where.participantId_studyDay.studyDay) || null;
      },
      async create({ data }) {
        createsStarted += 1;
        if (createsStarted === 2) releaseCreate();
        await createGate;
        if (stored.length) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
        stored.push(data);
      }
    }
  };
  const data = { participantId: "participant-1", studyDay: 16, requestId: "request-concurrent" };
  const results = await Promise.all([
    saveDailyResponse(mockPrisma, data),
    saveDailyResponse(mockPrisma, data)
  ]);
  assert.equal(results.filter((result) => result.alreadySaved).length, 1);
  assert.equal(results.filter((result) => result.alreadySaved === false).length, 1);
  assert.equal(stored.length, 1);
});
