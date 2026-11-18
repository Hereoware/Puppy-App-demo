import { saveDailyResponse } from "./daily-response-store.js";

export async function saveScheduledResponse(prisma, data, schedule) {
  if (data.studyDay !== schedule.currentStudyDay) {
    return { error: "A response can only be submitted for the current study day.", status: 409 };
  }

  const date = new Date(`${data.studyDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== data.studyDate) {
    return { error: "Invalid study date.", status: 400 };
  }
  if (data.studyDate !== schedule.currentStudyDate) {
    return { error: "The response date must be today in the study time zone.", status: 409 };
  }

  return { result: await saveDailyResponse(prisma, { ...data, studyDate: date }) };
}
