export const SURVEY_DAYS = Object.freeze([8, 16, 24]);

export function isSurveyDay(day) {
  return SURVEY_DAYS.includes(day);
}

export function nextScreenAfterPrediction(day) {
  return isSurveyDay(day) ? "survey" : "feedback";
}

export function surveyFollowupVisible(answer) {
  return answer === true;
}

export function isCompleteSurvey(day, survey) {
  if (!isSurveyDay(day)) return survey == null;
  if (!survey) return false;

  return ["food", "activity"].every((kind) => {
    const affects = survey[`${kind}AffectsE`];
    const score = survey[`${kind}EScore`];
    const comparisonLabel = survey[`${kind}ComparisonLabel`];
    if (typeof affects !== "boolean") return false;
    if (!affects) return score == null && comparisonLabel == null;
    return Number.isInteger(score) && score >= 0 && score <= 12
      && typeof comparisonLabel === "string" && comparisonLabel.trim().length > 0;
  });
}

export function trialChoiceOptions(trials, valueField, labelField) {
  if (!Array.isArray(trials)) return [];
  const options = [0, 1].map((value) => {
    const labels = new Set(trials
      .filter((trial) => trial?.[valueField] === value)
      .map((trial) => trial?.[labelField])
      .filter((label) => typeof label === "string" && label.trim()));
    return labels.size === 1 ? { value, label: labels.values().next().value } : null;
  }).filter(Boolean);
  return options.length === 2 && options[0].label !== options[1].label ? options : [];
}
