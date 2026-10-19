'use server';

import { redirect } from 'next/navigation';
import { requireUserId } from '@/features/auth/server';
import {
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/shared/lib';
import { formDataToCheckInInput, formText } from './form-data';
import { removeCheckIn, saveCheckIn } from './service';

export async function saveCheckInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const saved = await saveCheckIn(
    userId,
    formText(formData, 'entryDate'),
    formDataToCheckInInput(formData),
  );
  if (!saved.ok) return errorState(saved.message);
  return SUCCESS_STATE;
}

export async function deleteCheckInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const entryDate = formText(formData, 'id');
  const removed = await removeCheckIn(userId, entryDate);
  if (!removed.ok) return errorState(removed.message);
  redirect(`/app/check-in?date=${entryDate}`);
}
