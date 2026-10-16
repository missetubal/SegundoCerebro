'use server';

import { redirect } from 'next/navigation';
import { requireUserId } from '@/features/auth/server';
import { ACTION_MESSAGES, type ActionState, errorState } from '@/shared/lib';
import { runItemAction, runMoveAction, saveItem } from '@/shared/lib/item-action';
import { firstIssueMessage, itemIdSchema } from '@/shared/lib/validation';
import { pillarInputSchema } from '../domain';
import {
  archivePillar,
  createPillar,
  deletePillar,
  movePillar,
  type Pillar,
  type PillarWriteResult,
  unarchivePillar,
  updatePillar,
} from '../infra';

const DUPLICATE_NAME_MESSAGE =
  'Já existe uma área com esse nome. Se ela estiver arquivada, você pode desarquivá-la.';

function parsePillarInput(formData: FormData) {
  return pillarInputSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  });
}

function savePillar(
  write: () => Promise<PillarWriteResult>,
): Promise<ActionState> {
  return saveItem(write, DUPLICATE_NAME_MESSAGE, (pillar: Pillar) =>
    redirect(`/app/pillars/${pillar.id}`),
  );
}

export async function createPillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = parsePillarInput(formData);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return savePillar(() => createPillar(userId, input.data));
}

export async function updatePillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const input = parsePillarInput(formData);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return savePillar(() => updatePillar(userId, id.data, input.data));
}

export async function movePillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runMoveAction(userId, formData, movePillar);
}

export async function archivePillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, archivePillar);
}

export async function unarchivePillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, unarchivePillar);
}

export async function deletePillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const state = await runItemAction(userId, formData, deletePillar);
  if (state.status === 'error') return state;
  redirect('/app/pillars');
}
