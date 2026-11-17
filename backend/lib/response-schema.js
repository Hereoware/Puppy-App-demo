import { z } from "zod";
import { isSurveyDay } from "../../study-days.mjs";

const scoreSchema = (name) => z.number()
  .int({ message: `${name} must be an integer from 0 to 12.` })
  .min(0, { message: `${name} must be an integer from 0 to 12.` })
  .max(12, { message: `${name} must be an integer from 0 to 12.` });

const surveySchema = z.object({
  foodAffectsE: z.boolean().optional(),
  foodEScore: scoreSchema("Food E score").optional(),
  foodComparisonLabel: z.string().trim().min(1).max(80).optional(),
  activityAffectsE: z.boolean().optional(),
  activityEScore: scoreSchema("Activity E score").optional(),
  activityComparisonLabel: z.string().trim().min(1).max(80).optional()
});

export const responseSchema = z.object({
  participantId: z.string().min(1).max(40),
  studyDay: z.number().int().min(1).max(24),
  studyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  moodPrediction: z.enum(["HAPPY", "SAD"]).optional(),
  actualMood: z.enum(["HAPPY", "SAD"]).optional(),
  predictedEScore: scoreSchema("Predicted E score").optional(),
  interactions: z.object({
    fed: z.boolean(),
    played: z.boolean(),
    foodDurationMs: z.number().int().min(0).max(60000).optional(),
    activityDurationMs: z.number().int().min(0).max(60000).optional()
  }),
  survey: surveySchema.optional(),
  requestId: z.string().min(8).max(80)
}).superRefine((value, context) => {
  if (value.predictedEScore === undefined && value.moodPrediction === undefined) {
    context.addIssue({ code: "custom", message: "A prediction is required." });
  }

  if (!isSurveyDay(value.studyDay)) {
    if (value.survey !== undefined) {
      context.addIssue({ code: "custom", path: ["survey"], message: "The questionnaire is only available on study days 8, 16, and 24." });
    }
    return;
  }
  if (!value.survey) {
    context.addIssue({ code: "custom", path: ["survey"], message: "The day 8, 16, or 24 questionnaire is required before completing the day." });
    return;
  }

  for (const [kind, label] of [["food", "Food"], ["activity", "Activity"]]) {
    const affects = value.survey[`${kind}AffectsE`];
    const score = value.survey[`${kind}EScore`];
    const comparison = value.survey[`${kind}ComparisonLabel`];
    if (typeof affects !== "boolean") {
      context.addIssue({ code: "custom", path: ["survey", `${kind}AffectsE`], message: `${label}: answer whether it affects E.` });
    } else if (affects && (score === undefined || !comparison)) {
      context.addIssue({ code: "custom", path: ["survey", kind], message: `${label}: when you answer yes, provide an E score from 0 to 12 and choose a comparison option.` });
    } else if (!affects && (score !== undefined || comparison !== undefined)) {
      context.addIssue({ code: "custom", path: ["survey", kind], message: `${label}: E score and comparison must be omitted when you answer no effect.` });
    }
  }
});

export const importedTrialSchema = z.object({
  day: z.number().int().min(1).max(24),
  t: z.number().int().min(0).max(1),
  a: z.number().int().min(0).max(1),
  e: scoreSchema("E"),
  tLabel: z.string().trim().min(1).max(80),
  aLabel: z.string().trim().min(1).max(80)
});
