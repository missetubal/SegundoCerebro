import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { AssetForm } from '@/features/finance/presentation/asset-form';
import { BackLink, FinancePage, FormShell } from '@/features/finance/presentation/finance-shell';
import { createAssetAction, listInstitutions } from '@/features/finance/server';

export default function NewAssetPage() {
  return (
    <FinancePage
      title='Novo ativo'
      description='Cadastre o ativo. Operações e valores entram depois, na página dele.'
      current='/app/finance/investments'
    >
      <BackLink href='/app/finance/investments' label='Voltar aos investimentos' />
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <FormShell>
          <NewAsset />
        </FormShell>
      </Suspense>
    </FinancePage>
  );
}

async function NewAsset() {
  const userId = await requireUserId();
  const institutions = await listInstitutions(userId);
  return (
    <AssetForm
      action={createAssetAction}
      institutions={institutions.map((institution) => ({
        id: institution.id,
        name: institution.name,
      }))}
      submitLabel='Salvar ativo'
      cancelHref='/app/finance/investments'
    />
  );
}
