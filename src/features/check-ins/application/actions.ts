'use server';

import { redirect } from 'next/navigation';
import { requireUserId } from '@/features/auth/server';
import {
  ACTION_MESSAGES,
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
  try {
    const saved = await saveCheckIn(
      userId,
      formText(formData, 'entryDate'),
      formDataToCheckInInput(formData),
    );
    if (!saved.ok) return errorState(saved.message);
    return SUCCESS_STATE;
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
}

export async function deleteCheckInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const entryDate = formText(formData, 'id');
  try {
    const removed = await removeCheckIn(userId, entryDate);
    if (!removed.ok) return errorState(removed.message);
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  redirect(`/app/check-in?date=${entryDate}`);
}
