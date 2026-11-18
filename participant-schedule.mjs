export function reconcileParticipantSchedule(state, schedule) {
  const timeframe = schedule.timeframe || state.timeframe || "LONG";
  const previousDay = Number(state.currentStudyDay || state.currentTrial?.day);
  const dayChanged = Number.isInteger(previousDay) && previousDay !== schedule.currentStudyDay;
  const trialDayChanged = Boolean(state.currentTrial && state.currentTrial.day !== schedule.currentStudyDay);
  const longTrialDateChanged = timeframe === "LONG" && state.currentTrial
    && state.currentTrial.studyDate !== schedule.currentStudyDate;
  const stale = dayChanged || trialDayChanged || Boolean(longTrialDateChanged);
  const next = {
    ...state,
    timeframe,
    currentStudyDay: schedule.currentStudyDay,
    currentStudyDate: schedule.currentStudyDate,
    studyDayMinutes: schedule.studyDayMinutes,
    completedToday: Boolean(schedule.completedToday),
    completedDate: schedule.completedToday
      ? (timeframe === "SHORT" ? `block-${schedule.currentStudyDay}` : `date-${schedule.currentStudyDate}`)
      : null,
    completedStudyDay: schedule.completedToday ? schedule.currentStudyDay : null
  };

  if (stale) {
    Object.assign(next, {
      screen: "home",
      prediction: null,
      predictedEScore: null,
      actualMood: null,
      actualEScore: null,
      surveyAnswers: null,
      currentTrial: null,
      requestId: null,
      interactions: { fed: false, played: false }
    });
  } else if (next.currentTrial?.day === schedule.currentStudyDay) {
    next.currentTrial = { ...next.currentTrial, studyDate: schedule.currentStudyDate };
  }

  return { state: next, stale };
}

export function scheduledResponseFields(state) {
  return { studyDay: state.currentStudyDay, studyDate: state.currentStudyDate };
}
