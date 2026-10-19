'use server';

import { redirect } from 'next/navigation';
import { requireUserId } from '@/features/auth/server';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/shared/lib';
import { firstIssueMessage } from '@/shared/lib/validation';
import {
  commitMedicationDayForUser,
  formDataToMedicationDay,
  medicationDayPutSchema,
  prepareMedicationDayForUser,
} from '@/features/medications/server';
import { formDataToCheckInInput, formText } from './form-data';
import { removeCheckIn, saveCheckIn } from './service';

export async function saveCheckInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const entryDate = formText(formData, 'entryDate');
  const medication = medicationDayPutSchema.safeParse(
    formDataToMedicationDay(formData),
  );
  if (!medication.success) {
    return errorState(firstIssueMessage(medication.error, 'Revise os campos.'));
  }
  try {
    if (medication.data.logs.length > 0) {
      const ready = await prepareMedicationDayForUser(
        userId,
        entryDate,
        medication.data,
      );
      if (!ready.ok) return errorState(ready.message);
    }
    const saved = await saveCheckIn(
      userId,
      entryDate,
      formDataToCheckInInput(formData),
    );
    if (!saved.ok) return errorState(saved.message);
    if (medication.data.logs.length > 0) {
      const committed = await commitMedicationDayForUser(
        userId,
        entryDate,
        medication.data,
      );
      if (!committed.ok) return errorState(committed.message);
    }
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
