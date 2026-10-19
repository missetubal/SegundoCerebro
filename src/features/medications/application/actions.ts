'use server';

import { redirect } from 'next/navigation';
import { requireUserId } from '@/features/auth/server';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
} from '@/shared/lib';
import { runItemAction } from '@/shared/lib/item-action';
import { itemIdSchema } from '@/shared/lib/validation';
import {
  archiveMedication,
  deleteMedication,
  unarchiveMedication,
} from '../infra';
import { formDataToMedicationWrite } from './form-data';
import {
  createMedicationForUser,
  updateMedicationForUser,
} from './service';

export async function createMedicationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  let result: Awaited<ReturnType<typeof createMedicationForUser>>;
  try {
    result = await createMedicationForUser(
      userId,
      formDataToMedicationWrite(formData),
    );
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  if (!result.ok) return errorState(result.message);
  redirect('/app/medications');
}

export async function updateMedicationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  let result: Awaited<ReturnType<typeof updateMedicationForUser>>;
  try {
    result = await updateMedicationForUser(
      userId,
      id.data,
      formDataToMedicationWrite(formData),
    );
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  if (!result.ok) return errorState(result.message);
  redirect('/app/medications');
}

export async function archiveMedicationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, archiveMedication);
}

export async function unarchiveMedicationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, unarchiveMedication);
}

export async function deleteMedicationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  try {
    const removed = await deleteMedication(userId, id.data);
    if (!removed) return errorState(ACTION_MESSAGES.notFound);
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  redirect('/app/medications');
}
