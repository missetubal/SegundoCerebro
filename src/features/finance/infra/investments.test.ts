import { afterAll, describe, expect, it } from 'vitest';
import { createUserFixtures } from '@/test/fixtures';
import { createInstitution } from './accounts';
import { addOperation, addValuation, createAsset, deleteAsset, portfolio } from './investments';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

describe('investments', () => {
  it('does not present average cost as the current value', async () => {
    const userId = await fixtures.createUser();
    const other = await fixtures.createUser();
    const institution = await createInstitution(userId, {
      name: `Broker ${crypto.randomUUID().slice(0, 6)}`,
      type: 'broker',
    });
    if (!institution.ok) throw new Error('institution');
    const asset = await createAsset(userId, {
      name: 'Tesouro IPCA',
      ticker: null,
      assetClass: 'fixed_income',
      institutionId: institution.item.id,
      newInstitutionName: null,
      currency: 'BRL',
    });
    if (!asset.ok) throw new Error('asset');
    const bought = await addOperation(userId, asset.item.id, {
      operationType: 'buy',
      operationDate: '2026-04-01',
      quantity: '10',
      unitPrice: 2000n,
      fees: 0n,
      notes: null,
    });
    expect(bought.ok).toBe(true);
    const before = await portfolio(userId, '2026-04-19');
    const row = before.assets.find((item) => item.id === asset.item.id);
    expect(row?.averageCostMinor).toBe(2000n);
    expect(row?.currentValueMinor).toBeNull();
    expect(before.totals.find((item) => item.currency === 'BRL')?.omitted).toBe(1);

    await addValuation(userId, asset.item.id, {
      valuationDate: '2026-04-01',
      unitValue: 1200n,
      totalValue: null,
    });
    const after = await portfolio(userId, '2026-04-19');
    const valued = after.assets.find((item) => item.id === asset.item.id);
    expect(valued?.currentValueMinor).toBe(12000n);
    expect(valued?.valuationDate).toBe('2026-04-01');

    const stolen = await addOperation(other, asset.item.id, {
      operationType: 'buy',
      operationDate: '2026-04-02',
      quantity: '1',
      unitPrice: 100n,
      fees: 0n,
      notes: null,
    });
    expect(stolen.ok).toBe(false);
    const still = await portfolio(userId, '2026-04-19');
    expect(still.assets.find((item) => item.id === asset.item.id)?.quantity).toBe('10');
    const removed = await deleteAsset(userId, asset.item.id);
    expect(removed.ok).toBe(false);
    const kept = await portfolio(userId, '2026-04-19');
    expect(kept.assets.find((item) => item.id === asset.item.id)?.quantity).toBe('10');
  });
});
