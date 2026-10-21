import 'server-only';

import { eq } from 'drizzle-orm';
import {
  creditCards,
  db,
  financialAccounts,
  financialInstitutions,
  importBatches,
  investmentAssets,
  investmentTransactions,
  investmentValuations,
  statementAttachments,
  statements,
  transactionCategories,
  transactions,
} from '@/shared/db';

function minor(value: bigint | null): string | null {
  return value === null ? null : value.toString();
}

export async function exportFinance(userId: string) {
  const [
    institutions,
    accounts,
    cards,
    statementRows,
    attachments,
    batches,
    categories,
    rows,
    assets,
    operations,
    valuations,
  ] = await Promise.all([
    db
      .select({
        id: financialInstitutions.id,
        name: financialInstitutions.name,
        type: financialInstitutions.type,
      })
      .from(financialInstitutions)
      .where(eq(financialInstitutions.userId, userId)),
    db
      .select({
        id: financialAccounts.id,
        name: financialAccounts.name,
        institutionId: financialAccounts.institutionId,
        accountType: financialAccounts.accountType,
        currency: financialAccounts.currency,
        openingBalanceMinor: financialAccounts.openingBalanceMinor,
        archivedAt: financialAccounts.archivedAt,
      })
      .from(financialAccounts)
      .where(eq(financialAccounts.userId, userId)),
    db
      .select({
        id: creditCards.id,
        nickname: creditCards.nickname,
        institutionId: creditCards.institutionId,
        brand: creditCards.brand,
        last4: creditCards.last4,
        closingDay: creditCards.closingDay,
        dueDay: creditCards.dueDay,
        creditLimitMinor: creditCards.creditLimitMinor,
        currency: creditCards.currency,
        archivedAt: creditCards.archivedAt,
      })
      .from(creditCards)
      .where(eq(creditCards.userId, userId)),
    db
      .select({
        id: statements.id,
        accountId: statements.accountId,
        creditCardId: statements.creditCardId,
        referenceMonth: statements.referenceMonth,
        periodStart: statements.periodStart,
        periodEnd: statements.periodEnd,
        dueDate: statements.dueDate,
        declaredTotalMinor: statements.declaredTotalMinor,
        currency: statements.currency,
        status: statements.status,
      })
      .from(statements)
      .where(eq(statements.userId, userId)),
    db
      .select({
        statementId: statementAttachments.statementId,
        fileName: statementAttachments.fileName,
        mimeType: statementAttachments.mimeType,
        sizeBytes: statementAttachments.sizeBytes,
      })
      .from(statementAttachments)
      .where(eq(statementAttachments.userId, userId)),
    db
      .select({
        id: importBatches.id,
        statementId: importBatches.statementId,
        sourceFormat: importBatches.sourceFormat,
        status: importBatches.status,
        rowCount: importBatches.rowCount,
        importedCount: importBatches.importedCount,
      })
      .from(importBatches)
      .where(eq(importBatches.userId, userId)),
    db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        parentId: transactionCategories.parentId,
        archivedAt: transactionCategories.archivedAt,
      })
      .from(transactionCategories)
      .where(eq(transactionCategories.userId, userId)),
    db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        creditCardId: transactions.creditCardId,
        statementId: transactions.statementId,
        importBatchId: transactions.importBatchId,
        transactionDate: transactions.transactionDate,
        description: transactions.description,
        amountMinor: transactions.amountMinor,
        currency: transactions.currency,
        direction: transactions.direction,
        type: transactions.type,
        categoryId: transactions.categoryId,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId)),
    db
      .select({
        id: investmentAssets.id,
        name: investmentAssets.name,
        ticker: investmentAssets.ticker,
        assetClass: investmentAssets.assetClass,
        institutionId: investmentAssets.institutionId,
        currency: investmentAssets.currency,
        archivedAt: investmentAssets.archivedAt,
      })
      .from(investmentAssets)
      .where(eq(investmentAssets.userId, userId)),
    db.select().from(investmentTransactions).where(eq(investmentTransactions.userId, userId)),
    db.select().from(investmentValuations).where(eq(investmentValuations.userId, userId)),
  ]);

  const files = new Map(attachments.map((file) => [file.statementId, file]));
  return {
    version: 1 as const,
    institutions,
    accounts: accounts.map((account) => ({
      ...account,
      currency: account.currency.trim(),
      openingBalanceMinor: minor(account.openingBalanceMinor),
    })),
    cards: cards.map((card) => ({
      ...card,
      currency: card.currency.trim(),
      creditLimitMinor: minor(card.creditLimitMinor),
    })),
    statements: statementRows.map((statement) => ({
      ...statement,
      currency: statement.currency.trim(),
      declaredTotalMinor: minor(statement.declaredTotalMinor),
      fileName: files.get(statement.id)?.fileName ?? null,
      mimeType: files.get(statement.id)?.mimeType ?? null,
      sizeBytes: files.get(statement.id)?.sizeBytes ?? null,
    })),
    importBatches: batches,
    categories,
    transactions: rows.map((row) => ({
      ...row,
      currency: row.currency.trim(),
      amountMinor: row.amountMinor.toString(),
    })),
    assets: assets.map((asset) => ({ ...asset, currency: asset.currency.trim() })),
    investmentTransactions: operations.map((row) => ({
      ...row,
      currency: row.currency.trim(),
      unitPriceMinor: row.unitPriceMinor.toString(),
      feesMinor: row.feesMinor.toString(),
    })),
    investmentValuations: valuations.map((row) => ({
      ...row,
      unitValueMinor: minor(row.unitValueMinor),
      totalValueMinor: minor(row.totalValueMinor),
    })),
  };
}
