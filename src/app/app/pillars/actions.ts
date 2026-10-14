'use server';

import { redirect } from 'next/navigation';
import {
  archivePillar,
  createPillar,
  deletePillar,
  movePillar,
  type PillarWriteResult,
  unarchivePillar,
  updatePillar,
} from '@/db/pillars';
import { ACTION_MESSAGES, type ActionState, errorState } from '@/lib/action-state';
import { runItemAction } from '@/lib/item-action';
import { requireUserId } from '@/lib/session';
import {
  firstIssueMessage,
  itemIdSchema,
  moveDirectionSchema,
} from '@/lib/validation/form';
import { pillarInputSchema } from '@/lib/validation/pillar';

const DUPLICATE_NAME_MESSAGE =
  'Já existe um pilar com esse nome. Se ele estiver arquivado, você pode desarquivá-lo.';

function parsePillarInput(formData: FormData) {
  return pillarInputSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  });
}

async function savePillar(
  write: () => Promise<PillarWriteResult>,
): Promise<ActionState> {
  let result: PillarWriteResult;
  try {
    result = await write();
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  if (!result.ok) {
    return errorState(
      result.reason === 'duplicate_name'
        ? DUPLICATE_NAME_MESSAGE
        : ACTION_MESSAGES.notFound,
    );
  }
  redirect(`/app/pillars/${result.pillar.id}`);
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
  const direction = moveDirectionSchema.safeParse(formData.get('direction'));
  return runItemAction(formData, (userId, id) =>
    direction.success
      ? movePillar(userId, id, direction.data)
      : Promise.resolve(false),
  );
}

export async function archivePillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runItemAction(formData, archivePillar);
}

export async function unarchivePillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runItemAction(formData, unarchivePillar);
}

export async function deletePillarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const state = await runItemAction(formData, deletePillar);
  if (state.status === 'error') return state;
  redirect('/app/pillars');
}
