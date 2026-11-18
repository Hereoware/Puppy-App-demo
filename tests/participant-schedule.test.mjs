import assert from "node:assert/strict";
import test from "node:test";
import { saveScheduledResponse } from "../backend/lib/scheduled-response-store.js";
import { reconcileParticipantSchedule, scheduledResponseFields } from "../participant-schedule.mjs";

function mockPrisma() {
  const rows = [];
  return {
    rows,
    dailyResponse: {
      async findUnique({ where }) {
        if (where.participantId_requestId) {
          const { participantId, requestId } = where.participantId_requestId;
          return rows.find((row) => row.participantId === participantId && row.requestId === requestId) || null;
        }
        const { participantId, studyDay } = where.participantId_studyDay;
        return rows.find((row) => row.participantId === participantId && row.studyDay === studyDay) || null;
      },
      async create({ data }) {
        if (rows.some((row) => row.participantId === data.participantId
          && (row.studyDay === data.studyDay || row.requestId === data.requestId))) {
          throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
        }
        rows.push(data);
      }
    }
  };
}

const response = (studyDay, studyDate, requestId = `request-${studyDay}`) => ({
  participantId: "participant-1",
  studyDay,
  studyDate,
  requestId
});

test("restored Long state drops an unfinished prior-day trial and never marks it complete", () => {
  const restored = {
    timeframe: "LONG",
    currentStudyDay: 4,
    currentStudyDate: "2026-11-17",
    screen: "complete",
    completedToday: false,
    requestId: "old-request",
    currentTrial: { day: 4, studyDate: "2026-11-17" },
    interactions: { fed: true, played: false },
    predictedEScore: 7
  };
  const { state, stale } = reconcileParticipantSchedule(restored, {
    timeframe: "LONG",
    currentStudyDay: 5,
    currentStudyDate: "2026-11-18",
    studyDayMinutes: 1440,
    completedToday: false
  });

  assert.equal(stale, true);
  assert.equal(state.currentStudyDay, 5);
  assert.equal(state.currentStudyDate, "2026-11-18");
  assert.equal(state.currentTrial, null);
  assert.equal(state.completedToday, false);
  assert.equal(state.requestId, null);
  assert.deepEqual(state.interactions, { fed: false, played: false });
  assert.equal(state.screen, "home");
  assert.deepEqual(scheduledResponseFields(state), { studyDay: 5, studyDate: "2026-11-18" });
});

test("Short state keeps the current study day but replaces an old trial date after midnight", () => {
  const restored = {
    timeframe: "SHORT",
    currentStudyDay: 3,
    currentStudyDate: "2026-11-17",
    currentTrial: { day: 3, studyDate: "2026-11-17" },
    interactions: { fed: true, played: true },
    requestId: "request-3"
  };
  const { state, stale } = reconcileParticipantSchedule(restored, {
    timeframe: "SHORT",
    currentStudyDay: 3,
    currentStudyDate: "2026-11-18",
    studyDayMinutes: 1,
    completedToday: false
  });

  assert.equal(stale, false);
  assert.deepEqual(scheduledResponseFields(state), { studyDay: 3, studyDate: "2026-11-18" });
  assert.deepEqual(state.currentTrial, { day: 3, studyDate: "2026-11-18" });
  assert.deepEqual(state.interactions, { fed: true, played: true });
  assert.equal(state.requestId, "request-3");
});

test("Long backend saves only the current study day and preserves idempotency", async () => {
  const prisma = mockPrisma();
  const schedule = { timeframe: "LONG", currentStudyDay: 5, currentStudyDate: "2026-11-18" };

  const staleDay = await saveScheduledResponse(prisma, response(4, "2026-11-17"), schedule);
  assert.equal(staleDay.status, 409);
  assert.match(staleDay.error, /current study day/);
  assert.equal(prisma.rows.length, 0);

  const data = response(5, "2026-11-18");
  const saved = await saveScheduledResponse(prisma, data, schedule);
  assert.deepEqual(saved.result, { alreadySaved: false });
  const duplicate = await saveScheduledResponse(prisma, data, schedule);
  assert.deepEqual(duplicate.result, { alreadySaved: true });
  const duplicateDay = await saveScheduledResponse(prisma, response(5, "2026-11-18", "request-retry"), schedule);
  assert.deepEqual(duplicateDay.result, { conflict: true });
  assert.equal(prisma.rows.length, 1);
});

test("Short backend rejects a stale date but saves the current server date and study day", async () => {
  const prisma = mockPrisma();
  const schedule = { timeframe: "SHORT", currentStudyDay: 3, currentStudyDate: "2026-11-18" };

  const staleDate = await saveScheduledResponse(prisma, response(3, "2026-11-17"), schedule);
  assert.equal(staleDate.status, 409);
  assert.match(staleDate.error, /study time zone/);
  assert.equal(prisma.rows.length, 0);

  const saved = await saveScheduledResponse(prisma, response(3, "2026-11-18"), schedule);
  assert.deepEqual(saved.result, { alreadySaved: false });
  assert.equal(prisma.rows[0].studyDate.toISOString(), "2026-11-18T00:00:00.000Z");
});
