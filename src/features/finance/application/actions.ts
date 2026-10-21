'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUserId } from '@/features/auth/server';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/shared/lib';
import { firstIssueMessage, itemIdSchema } from '@/shared/lib/validation';
import {
  accountInputSchema,
  cardInputSchema,
  categoryInputSchema,
  institutionInputSchema,
  transactionInputSchema,
} from '../domain';
import {
  createAccount,
  createCard,
  createInstitution,
  deleteAccount,
  setAccountArchived,
  setCardArchived,
  updateAccount,
  updateCard,
} from '../infra/accounts';
import {
  assignCategory,
  createCategory,
  createTransaction,
  deleteCategory,
  deleteTransaction,
  setCategoryArchived,
  updateCategory,
  updateTransaction,
} from '../infra/ledger';

const SECRET_KEYS = ['pan', 'cardnumber', 'cvv', 'cvc', 'password', 'pin'];

const FAILURE_MESSAGES = {
  not_found: ACTION_MESSAGES.notFound,
  duplicate_name: 'Já existe um item com esse nome.',
  has_children: 'Ainda há lançamentos ligados. Você pode arquivar.',
  currency_locked: 'A moeda permanece a mesma porque já há lançamentos.',
  archived: 'Esse item está arquivado.',
} as const;

function rejectSecrets(formData: FormData): ActionState | null {
  for (const key of formData.keys()) {
    if (SECRET_KEYS.includes(key.toLowerCase())) {
      return errorState('Não guarde número completo, CVV ou senha.');
    }
  }
  return null;
}

function formObject(formData: FormData) {
  const values: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('$') || key.toLowerCase() === 'userid') continue;
    values[key] = value;
  }
  return values;
}

async function finish(
  result: { ok: boolean; reason?: keyof typeof FAILURE_MESSAGES },
  href?: string,
): Promise<ActionState> {
  if (!result.ok) {
    return errorState(
      FAILURE_MESSAGES[result.reason ?? 'not_found'] ?? ACTION_MESSAGES.notFound,
    );
  }
  refresh();
  if (href) redirect(href);
  return SUCCESS_STATE;
}

export async function createInstitutionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = institutionInputSchema.safeParse(formObject(formData));
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(await createInstitution(userId, input.data), '/app/finance/accounts');
}

export async function createAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const blocked = rejectSecrets(formData);
  if (blocked) return blocked;
  const userId = await requireUserId();
  const input = accountInputSchema.safeParse(formObject(formData));
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(await createAccount(userId, input.data), '/app/finance/accounts');
}

export async function updateAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const blocked = rejectSecrets(formData);
  if (blocked) return blocked;
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const input = accountInputSchema.safeParse(formObject(formData));
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(
    await updateAccount(userId, id.data, input.data),
    '/app/finance/accounts',
  );
}

export async function archiveAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const archived = formData.get('archived') !== 'false';
  const found = await setAccountArchived(userId, id.data, archived);
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function deleteAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  return finish(await deleteAccount(userId, id.data));
}

export async function createCardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const blocked = rejectSecrets(formData);
  if (blocked) return blocked;
  const userId = await requireUserId();
  const input = cardInputSchema.safeParse(formObject(formData));
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(await createCard(userId, input.data), '/app/finance/accounts#cartoes');
}

export async function updateCardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const blocked = rejectSecrets(formData);
  if (blocked) return blocked;
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const input = cardInputSchema.safeParse(formObject(formData));
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(await updateCard(userId, id.data, input.data), '/app/finance/accounts#cartoes');
}

export async function archiveCardAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const found = await setCardArchived(userId, id.data, formData.get('archived') !== 'false');
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = categoryInputSchema.safeParse(formObject(formData));
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(await createCategory(userId, input.data));
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const values = formObject(formData);
  delete values.id;
  const input = categoryInputSchema.safeParse(values);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(await updateCategory(userId, id.data, input.data));
}

export async function archiveCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const found = await setCategoryArchived(
    userId,
    id.data,
    formData.get('archived') !== 'false',
  );
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function deleteCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  return finish(await deleteCategory(userId, id.data));
}

export async function createTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = transactionInputSchema.safeParse(formObject(formData));
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(
    await createTransaction(userId, input.data),
    '/app/finance/transactions',
  );
}

export async function updateTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const values = formObject(formData);
  delete values.id;
  const input = transactionInputSchema.safeParse(values);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return finish(
    await updateTransaction(userId, id.data, input.data),
    '/app/finance/transactions',
  );
}

export async function deleteTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const found = await deleteTransaction(userId, id.data);
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function deleteTransactionAndRedirectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const found = await deleteTransaction(userId, id.data);
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  redirect('/app/finance/transactions');
}

export async function assignCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const categoryId = itemIdSchema.safeParse(formData.get('categoryId'));
  const ids = formData.getAll('id').map(String);
  if (!categoryId.success) return errorState('Escolha uma categoria.');
  return finish(await assignCategory(userId, ids, categoryId.data));
}
