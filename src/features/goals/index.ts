/** Client-safe public API. Server: `@/features/goals/server` */
export { GoalForm, NextStepForm, type GoalFormOption } from './presentation';
export {
  GOAL_STATUSES,
  GOAL_TITLE_MAX,
  NEXT_STEP_STATUSES,
  NEXT_STEP_TITLE_MAX,
  goalInputSchema,
  nextStepInputSchema,
  type GoalInput,
  type GoalStatus,
  type NextStepInput,
  type NextStepStatus,
} from './domain';
