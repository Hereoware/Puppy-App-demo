const DEFAULT_TIME_ZONE = "America/New_York";
export const DEFAULT_STUDY_DAY_MINUTES = 1440;

export function dateInZone(date, timeZone = DEFAULT_TIME_ZONE) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function parseStudyDayMinutes(value) {
  const minutes = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(minutes) && minutes > 0 ? minutes : DEFAULT_STUDY_DAY_MINUTES;
}

export function calendarDayNumber(enrolledAt, today, timeZone = DEFAULT_TIME_ZONE) {
  const enrolled = dateInZone(enrolledAt, timeZone);
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${enrolled}T00:00:00Z`)) / 86400000) + 1;
}

export function currentStudyDay(enrolledAt, { now = new Date(), timeZone = DEFAULT_TIME_ZONE, studyDayMinutes = DEFAULT_STUDY_DAY_MINUTES } = {}) {
  const minutes = parseStudyDayMinutes(studyDayMinutes);
  if (minutes === DEFAULT_STUDY_DAY_MINUTES) return calendarDayNumber(enrolledAt, dateInZone(now, timeZone), timeZone);
  return Math.max(1, Math.floor((now.getTime() - new Date(enrolledAt).getTime()) / (minutes * 60000)) + 1);
}

export function studyScheduleForParticipant(participant, { now = new Date(), env = process.env } = {}) {
  const timeZone = participant.timeZone || DEFAULT_TIME_ZONE;
  const studyDayMinutes = parseStudyDayMinutes(env.PUPPY_STUDY_DAY_MINUTES);
  return {
    studyDayMinutes,
    currentStudyDay: currentStudyDay(participant.enrolledAt, { now, timeZone, studyDayMinutes }),
    currentStudyDate: dateInZone(now, timeZone)
  };
}
