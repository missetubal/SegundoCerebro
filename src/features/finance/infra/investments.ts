import 'server-only';

import { and, asc, eq } from 'drizzle-orm';
import {
  db,
  investmentAssets,
  investmentTransactions,
  investmentValuations,
  ownedBy,
} from '@/shared/db';
import {
  applyOperations,
  averageCostMinor,
  roundHalfAwayFromZero,
  scaledToQuantity,
} from '../domain';
import type { AssetInput, InvestmentOperationInput, ValuationInput } from '../domain';
import type { FinanceResult } from './accounts';
import { ensureInstitution } from './accounts';

export type InvestmentAsset = typeof investmentAssets.$inferSelect;

export type AssetPosition = {
  id: string;
  name: string;
  ticker: string | null;
  assetClass: string;
  institutionId: string;
  currency: string;
  archivedAt: Date | null;
  quantity: string;
  averageCostMinor: bigint | null;
  currentValueMinor: bigint | null;
  valuationDate: string | null;
};

export async function listAssets(userId: string): Promise<{
  active: InvestmentAsset[];
  archived: InvestmentAsset[];
}> {
  const rows = await db
    .select()
    .from(investmentAssets)
    .where(eq(investmentAssets.userId, userId))
    .orderBy(investmentAssets.name);
  return {
    active: rows.filter((row) => row.archivedAt === null),
    archived: rows.filter((row) => row.archivedAt !== null),
  };
}

export async function getAsset(userId: string, id: string) {
  const [item] = await db
    .select()
    .from(investmentAssets)
    .where(ownedBy(investmentAssets, userId, id));
  return item ?? null;
}

export async function createAsset(
  userId: string,
  input: AssetInput,
): Promise<FinanceResult<InvestmentAsset>> {
  const institutionId = await ensureInstitution(
    userId,
    input.institutionId,
    input.newInstitutionName,
    'broker',
  );
  if (!institutionId) return { ok: false, reason: 'not_found' };
  const [item] = await db
    .insert(investmentAssets)
    .values({
      userId,
      institutionId,
      name: input.name,
      ticker: input.ticker,
      assetClass: input.assetClass,
      currency: input.currency,
    })
    .returning();
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function updateAsset(
  userId: string,
  id: string,
  input: AssetInput,
): Promise<FinanceResult<InvestmentAsset>> {
  const asset = await getAsset(userId, id);
  if (!asset) return { ok: false, reason: 'not_found' };
  if (input.currency !== asset.currency.trim() && (await operationsOf(userId, id)).length > 0) {
    return { ok: false, reason: 'currency_locked' };
  }
  const institutionId = await ensureInstitution(
    userId,
    input.institutionId,
    input.newInstitutionName,
    'broker',
  );
  if (!institutionId) return { ok: false, reason: 'not_found' };
  const [item] = await db
    .update(investmentAssets)
    .set({
      institutionId,
      name: input.name,
      ticker: input.ticker,
      assetClass: input.assetClass,
      currency: input.currency,
      updatedAt: new Date(),
    })
    .where(ownedBy(investmentAssets, userId, id))
    .returning();
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function setAssetArchived(
  userId: string,
  id: string,
  archived: boolean,
): Promise<boolean> {
  const rows = await db
    .update(investmentAssets)
    .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(ownedBy(investmentAssets, userId, id))
    .returning({ id: investmentAssets.id });
  return Boolean(rows[0]);
}

export async function deleteAsset(
  userId: string,
  id: string,
): Promise<FinanceResult<{ id: string }>> {
  if (!(await getAsset(userId, id))) return { ok: false, reason: 'not_found' };
  const operations = await operationsOf(userId, id);
  const [valuation] = await db
    .select({ id: investmentValuations.id })
    .from(investmentValuations)
    .where(
      and(eq(investmentValuations.userId, userId), eq(investmentValuations.assetId, id)),
    )
    .limit(1);
  if (operations.length > 0 || valuation) return { ok: false, reason: 'has_children' };
  const rows = await db
    .delete(investmentAssets)
    .where(ownedBy(investmentAssets, userId, id))
    .returning({ id: investmentAssets.id });
  return rows[0] ? { ok: true, item: rows[0] } : { ok: false, reason: 'not_found' };
}

export async function addOperation(
  userId: string,
  assetId: string,
  input: InvestmentOperationInput,
): Promise<FinanceResult<{ id: string }>> {
  const asset = await getAsset(userId, assetId);
  if (!asset || asset.archivedAt) return { ok: false, reason: 'not_found' };
  const existing = await operationsOf(userId, assetId);
  const preview = applyOperations([
    ...existing,
    {
      operationType: input.operationType,
      operationDate: input.operationDate,
      createdAt: new Date().toISOString(),
      quantity: input.quantity,
      unitPriceMinor: input.unitPrice,
      feesMinor: input.fees,
    },
  ]);
  if (!preview.ok) return { ok: false, reason: 'not_found' };
  const [item] = await db
    .insert(investmentTransactions)
    .values({
      userId,
      assetId,
      operationType: input.operationType,
      operationDate: input.operationDate,
      quantity: input.quantity,
      unitPriceMinor: input.unitPrice,
      feesMinor: input.fees,
      currency: asset.currency.trim(),
      notes: input.notes,
    })
    .returning({ id: investmentTransactions.id });
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function addValuation(
  userId: string,
  assetId: string,
  input: ValuationInput,
): Promise<FinanceResult<{ id: string }>> {
  const asset = await getAsset(userId, assetId);
  if (!asset || asset.archivedAt) return { ok: false, reason: 'not_found' };
  const [item] = await db
    .insert(investmentValuations)
    .values({
      userId,
      assetId,
      valuationDate: input.valuationDate,
      unitValueMinor: input.unitValue,
      totalValueMinor: input.totalValue,
      source: 'manual',
    })
    .returning({ id: investmentValuations.id });
  return item ? { ok: true, item } : { ok: false, reason: 'not_found' };
}

export async function listAssetActivity(userId: string, assetId: string) {
  if (!(await getAsset(userId, assetId))) return null;
  const operations = await db
    .select()
    .from(investmentTransactions)
    .where(
      and(
        eq(investmentTransactions.userId, userId),
        eq(investmentTransactions.assetId, assetId),
      ),
    )
    .orderBy(asc(investmentTransactions.operationDate), asc(investmentTransactions.createdAt));
  const valuations = await db
    .select()
    .from(investmentValuations)
    .where(
      and(eq(investmentValuations.userId, userId), eq(investmentValuations.assetId, assetId)),
    )
    .orderBy(asc(investmentValuations.valuationDate), asc(investmentValuations.createdAt));
  return { operations, valuations };
}

export async function portfolio(userId: string, today: string): Promise<{
  assets: AssetPosition[];
  totals: Array<{ currency: string; valueMinor: bigint; omitted: number }>;
}> {
  const assets = await db
    .select()
    .from(investmentAssets)
    .where(eq(investmentAssets.userId, userId));
  const operations = await db
    .select()
    .from(investmentTransactions)
    .where(eq(investmentTransactions.userId, userId))
    .orderBy(asc(investmentTransactions.operationDate), asc(investmentTransactions.createdAt));
  const valuations = await db
    .select()
    .from(investmentValuations)
    .where(eq(investmentValuations.userId, userId))
    .orderBy(asc(investmentValuations.valuationDate), asc(investmentValuations.createdAt));
  const positions = assets.map((asset) => {
    const applied = applyOperations(
      operations
        .filter((row) => row.assetId === asset.id)
        .map((row) => ({
          operationType: row.operationType as 'buy',
          operationDate: row.operationDate,
          createdAt: row.createdAt.toISOString(),
          quantity: row.quantity,
          unitPriceMinor: row.unitPriceMinor,
          feesMinor: row.feesMinor,
        })),
    );
    const position = applied.ok
      ? applied.position
      : { quantityScaled: 0n, costMinor: 0n };
    const current = [...valuations]
      .reverse()
      .find(
        (row) => row.assetId === asset.id && row.valuationDate <= today,
      );
    const quantityScaled = position.quantityScaled;
    let currentValueMinor: bigint | null = null;
    if (current?.totalValueMinor != null) currentValueMinor = current.totalValueMinor;
    if (current?.unitValueMinor != null) {
      currentValueMinor = roundHalfAwayFromZero(
        current.unitValueMinor * quantityScaled,
        100_000_000n,
      );
    }
    return {
      id: asset.id,
      name: asset.name,
      ticker: asset.ticker,
      assetClass: asset.assetClass,
      institutionId: asset.institutionId,
      currency: asset.currency.trim(),
      archivedAt: asset.archivedAt,
      quantity: scaledToQuantity(quantityScaled),
      averageCostMinor: averageCostMinor(position),
      currentValueMinor,
      valuationDate: current?.valuationDate ?? null,
    };
  });
  const currencies = [...new Set(positions.map((item) => item.currency))];
  const totals = currencies.map((currency) => {
    const group = positions.filter(
      (item) => item.currency === currency && item.archivedAt === null,
    );
    const valued = group.filter((item) => item.currentValueMinor !== null);
    return {
      currency,
      valueMinor: valued.reduce((sum, item) => sum + (item.currentValueMinor ?? 0n), 0n),
      omitted: group.length - valued.length,
    };
  });
  return { assets: positions, totals };
}

async function operationsOf(userId: string, assetId: string) {
  const rows = await db
    .select()
    .from(investmentTransactions)
    .where(
      and(
        eq(investmentTransactions.userId, userId),
        eq(investmentTransactions.assetId, assetId),
      ),
    );
  return rows.map((row) => ({
    operationType: row.operationType as 'buy',
    operationDate: row.operationDate,
    createdAt: row.createdAt.toISOString(),
    quantity: row.quantity,
    unitPriceMinor: row.unitPriceMinor,
    feesMinor: row.feesMinor,
  }));
}
