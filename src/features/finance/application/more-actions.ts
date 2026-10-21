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
  assetInputSchema,
  investmentOperationInputSchema,
  statementInputSchema,
  valuationInputSchema,
} from '../domain';
import {
  confirmImport,
  startPreview,
  undoImport,
  type ImportLine,
} from '../infra/imports';
import { addOperation, addValuation, createAsset, deleteAsset, setAssetArchived, updateAsset } from '../infra/investments';
import {
  createStatement,
  deleteAttachment,
  deleteAttachmentAndImported,
  markStatementReviewed,
  replaceAttachment,
} from '../infra/statements';

const FAILURE = 'Não foi possível concluir agora.';

export async function createStatementAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = statementInputSchema.safeParse({
    accountId: formData.get('accountId'),
    creditCardId: formData.get('creditCardId'),
    referenceMonth: formData.get('referenceMonth'),
    periodStart: formData.get('periodStart'),
    periodEnd: formData.get('periodEnd'),
    dueDate: formData.get('dueDate'),
    declaredTotal: formData.get('declaredTotal'),
  });
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  const file = formData.get('file');
  if (!(file instanceof File)) return errorState('Escolha um arquivo.');
  const created = await createStatement(userId, input.data, {
    name: file.name,
    type: file.type || 'application/octet-stream',
    bytes: new Uint8Array(await file.arrayBuffer()),
  });
  if (!created.ok) {
    console.error('finance statement upload failed');
    return errorState('Não foi possível anexar esse arquivo.');
  }
  refresh();
  redirect(`/app/finance/statements/${created.item.id}/import`);
}

export async function replaceAttachmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const file = formData.get('file');
  if (!(file instanceof File)) return errorState('Escolha um arquivo.');
  const replaced = await replaceAttachment(userId, id.data, {
    name: file.name,
    type: file.type || 'application/octet-stream',
    bytes: new Uint8Array(await file.arrayBuffer()),
  });
  if (!replaced) return errorState('Não foi possível anexar esse arquivo.');
  refresh();
  return SUCCESS_STATE;
}

export async function deleteAttachmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const found = await deleteAttachment(userId, id.data);
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function deleteImportedAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (formData.get('confirm') !== 'yes') {
    return errorState('Confirme para apagar o arquivo e os lançamentos importados.');
  }
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const found = await deleteAttachmentAndImported(userId, id.data);
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export type PreviewLine = Omit<ImportLine, 'amountMinor'> & { amountMinor: string };

export async function startPreviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { batchId?: string; lines?: PreviewLine[] }> {
  const userId = await requireUserId();
  const statementId = itemIdSchema.safeParse(formData.get('statementId'));
  if (!statementId.success) return errorState(ACTION_MESSAGES.notFound);
  const dateColumn = String(formData.get('dateColumn') ?? '');
  const mapping = dateColumn
    ? {
        dateColumn,
        descriptionColumn: String(formData.get('descriptionColumn') ?? ''),
        amountColumn: String(formData.get('amountColumn') ?? '') || undefined,
        debitColumn: String(formData.get('debitColumn') ?? '') || undefined,
        creditColumn: String(formData.get('creditColumn') ?? '') || undefined,
      }
    : null;
  const preview = await startPreview(userId, statementId.data, mapping);
  if (!preview.ok) {
    if (preview.reason === 'mapping_required') {
      return errorState('Confirme as colunas deste CSV.');
    }
    if (preview.reason === 'unsupported') {
      return errorState('O arquivo continua guardado. Esta versão não lê PDF nem imagem.');
    }
    if (preview.reason === 'too_large') {
      return errorState('Arquivo com linhas demais. Divida o arquivo e tente de novo.');
    }
    return errorState(FAILURE);
  }
  return {
    status: 'success',
    batchId: preview.batchId,
    lines: preview.lines.map((line) => ({
      ...line,
      amountMinor: line.amountMinor.toString(),
    })),
  };
}

export async function confirmImportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const batchId = itemIdSchema.safeParse(formData.get('batchId'));
  if (!batchId.success) return errorState(ACTION_MESSAGES.notFound);
  let lines: ImportLine[];
  try {
    lines = JSON.parse(String(formData.get('lines') ?? '[]'), (_key, value) => {
      if (value && typeof value === 'object' && typeof value.amountMinor === 'string') {
        return { ...value, amountMinor: BigInt(value.amountMinor) };
      }
      return value;
    });
  } catch (error) {
    console.error('finance import confirm failed');
    void error;
    return errorState(FAILURE);
  }
  if (!Array.isArray(lines)) return errorState(FAILURE);
  const saved = await confirmImport(userId, batchId.data, lines);
  if (!saved.ok) return errorState('Não foi possível salvar a importação.');
  refresh();
  return SUCCESS_STATE;
}

export async function markStatementReviewedAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const found = await markStatementReviewed(userId, id.data);
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function undoImportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const batchId = itemIdSchema.safeParse(formData.get('batchId'));
  if (!batchId.success) return errorState(ACTION_MESSAGES.notFound);
  const undone = await undoImport(userId, batchId.data);
  if (!undone.ok) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function createAssetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = assetInputSchema.safeParse({
    name: formData.get('name'),
    ticker: formData.get('ticker'),
    assetClass: formData.get('assetClass'),
    institutionId: formData.get('institutionId'),
    newInstitutionName: formData.get('newInstitutionName'),
    currency: formData.get('currency'),
  });
  if (!input.success) return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  const created = await createAsset(userId, input.data);
  if (!created.ok) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  redirect(`/app/finance/investments/${created.item.id}`);
}

export async function addOperationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const assetId = itemIdSchema.safeParse(formData.get('assetId'));
  if (!assetId.success) return errorState(ACTION_MESSAGES.notFound);
  const input = investmentOperationInputSchema.safeParse({
    operationType: formData.get('operationType'),
    operationDate: formData.get('operationDate'),
    quantity: formData.get('quantity'),
    unitPrice: formData.get('unitPrice'),
    fees: formData.get('fees'),
    notes: formData.get('notes'),
  });
  if (!input.success) return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  const created = await addOperation(userId, assetId.data, input.data);
  if (!created.ok) return errorState('A quantidade passa da posição atual.');
  refresh();
  return SUCCESS_STATE;
}

export async function addValuationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const assetId = itemIdSchema.safeParse(formData.get('assetId'));
  if (!assetId.success) return errorState(ACTION_MESSAGES.notFound);
  const input = valuationInputSchema.safeParse({
    valuationDate: formData.get('valuationDate'),
    unitValue: formData.get('unitValue'),
    totalValue: formData.get('totalValue'),
  });
  if (!input.success) return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  const created = await addValuation(userId, assetId.data, input.data);
  if (!created.ok) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function updateAssetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const input = assetInputSchema.safeParse({
    name: formData.get('name'),
    ticker: formData.get('ticker'),
    assetClass: formData.get('assetClass'),
    institutionId: formData.get('institutionId'),
    newInstitutionName: formData.get('newInstitutionName'),
    currency: formData.get('currency'),
  });
  if (!input.success) return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  const updated = await updateAsset(userId, id.data, input.data);
  if (!updated.ok) {
    return errorState(
      updated.reason === 'currency_locked'
        ? 'A moeda não muda depois da primeira operação.'
        : ACTION_MESSAGES.notFound,
    );
  }
  refresh();
  return SUCCESS_STATE;
}

export async function archiveAssetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const found = await setAssetArchived(userId, id.data, formData.get('archived') !== 'false');
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function deleteAssetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const removed = await deleteAsset(userId, id.data);
  if (!removed.ok) {
    return errorState(
      removed.reason === 'has_children'
        ? 'Este ativo tem operações ou valores. Arquive em vez de excluir.'
        : ACTION_MESSAGES.notFound,
    );
  }
  refresh();
  redirect('/app/finance/investments');
}
