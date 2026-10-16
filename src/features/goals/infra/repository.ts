import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { getArea } from '@/features/areas/server';
import { db, ownedBy, deleteOwned } from '@/shared/db';
import { goals, horizons, nextSteps } from '@/shared/db';
import type { GoalInput, GoalStatus, NextStepInput } from '../domain';

export type Goal = typeof goals.$inferSelect;
export type NextStep = typeof nextSteps.$inferSelect;

export type GoalWriteResult =
  | { ok: true; item: Goal }
  | {
      ok: false;
      reason: 'not_found' | 'invalid_area' | 'invalid_horizon';
    };

export type NextStepWriteResult =
  | { ok: true; item: NextStep }
  | { ok: false; reason: 'not_found' };

async function getOwnedHorizon(userId: string, id: string) {
  const [horizon] = await db
    .select()
    .from(horizons)
    .where(and(eq(horizons.userId, userId), eq(horizons.id, id)));
  return horizon ?? null;
}

async function assertGoalLinks(
  userId: string,
  primaryAreaId: string,
  horizonId: string,
): Promise<'invalid_area' | 'invalid_horizon' | null> {
  const area = await getArea(userId, primaryAreaId);
  if (!area || area.archivedAt !== null) return 'invalid_area';
  const horizon = await getOwnedHorizon(userId, horizonId);
  if (!horizon) return 'invalid_horizon';
  return null;
}

export async function listGoals(userId: string): Promise<{
  active: Goal[];
  completed: Goal[];
  archived: Goal[];
}> {
  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(asc(goals.createdAt), asc(goals.id));

  return {
    active: rows.filter((goal) => goal.status === 'active'),
    completed: rows.filter((goal) => goal.status === 'completed'),
    archived: rows.filter((goal) => goal.status === 'archived'),
  };
}

export async function getGoal(
  userId: string,
  id: string,
): Promise<Goal | null> {
  const [goal] = await db.select().from(goals).where(ownedBy(goals, userId, id));
  return goal ?? null;
}

export async function createGoal(
  userId: string,
  input: GoalInput,
): Promise<GoalWriteResult> {
  const linkError = await assertGoalLinks(
    userId,
    input.primaryAreaId,
    input.horizonId,
  );
  if (linkError) return { ok: false, reason: linkError };

  const [item] = await db
    .insert(goals)
    .values({
      userId,
      title: input.title,
      primaryAreaId: input.primaryAreaId,
      horizonId: input.horizonId,
      status: input.status,
      startDate: input.startDate,
      targetDate: input.targetDate,
    })
    .returning();

  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function updateGoal(
  userId: string,
  id: string,
  input: GoalInput,
): Promise<GoalWriteResult> {
  const linkError = await assertGoalLinks(
    userId,
    input.primaryAreaId,
    input.horizonId,
  );
  if (linkError) return { ok: false, reason: linkError };

  const [item] = await db
    .update(goals)
    .set({
      title: input.title,
      primaryAreaId: input.primaryAreaId,
      horizonId: input.horizonId,
      status: input.status,
      startDate: input.startDate,
      targetDate: input.targetDate,
      updatedAt: sql`now()`,
    })
    .where(ownedBy(goals, userId, id))
    .returning();

  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function setGoalStatus(
  userId: string,
  id: string,
  status: GoalStatus,
): Promise<boolean> {
  const [item] = await db
    .update(goals)
    .set({ status, updatedAt: sql`now()` })
    .where(ownedBy(goals, userId, id))
    .returning({ id: goals.id });
  return Boolean(item);
}

export function deleteGoal(userId: string, id: string): Promise<boolean> {
  return deleteOwned(goals, userId, id);
}

export async function listNextSteps(
  userId: string,
  goalId: string,
): Promise<NextStep[]> {
  return db
    .select()
    .from(nextSteps)
    .where(and(eq(nextSteps.userId, userId), eq(nextSteps.goalId, goalId)))
    .orderBy(asc(nextSteps.createdAt), asc(nextSteps.id));
}

export async function createNextStep(
  userId: string,
  goalId: string,
  input: NextStepInput,
): Promise<NextStepWriteResult> {
  const goal = await getGoal(userId, goalId);
  if (!goal) return { ok: false, reason: 'not_found' };

  const [item] = await db
    .insert(nextSteps)
    .values({
      userId,
      goalId,
      title: input.title,
      status: 'open',
    })
    .returning();

  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function completeNextStep(
  userId: string,
  id: string,
): Promise<boolean> {
  const [item] = await db
    .update(nextSteps)
    .set({ status: 'done', updatedAt: sql`now()` })
    .where(ownedBy(nextSteps, userId, id))
    .returning({ id: nextSteps.id });
  return Boolean(item);
}

export function deleteNextStep(userId: string, id: string): Promise<boolean> {
  return deleteOwned(nextSteps, userId, id);
}
