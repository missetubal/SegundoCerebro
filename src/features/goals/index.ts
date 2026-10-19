/** Client-safe public API. Server: `@/features/goals/server` */
export {
  ActiveGoalsCard,
  GoalForm,
  NextStepForm,
  NextStepsCard,
  type ActiveGoalItem,
  type GoalFormOption,
  type HorizonOption,
  type NextStepCardItem,
} from './presentation';
export {
  GOAL_STATUSES,
  GOAL_TITLE_MAX,
  NEXT_STEP_STATUSES,
  NEXT_STEP_TITLE_MAX,
  goalInputSchema,
  nextStepInputSchema,
  parseGoalStatus,
  type GoalInput,
  type GoalStatus,
  type NextStepInput,
  type NextStepStatus,
} from './domain';
