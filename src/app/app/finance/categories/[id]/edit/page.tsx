import {
  BackLink,
  FinancePage,
  FormShell,
  CategoryForm,
} from '@/features/finance';
import {
  listCategories,
  updateCategoryAction,
} from '@/features/finance/server';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <FinancePage
      title='Editar categoria'
      description='Renomeie a categoria.'
      current='/app/finance/categories'
    >
      <BackLink href='/app/finance/categories' label='Voltar às categorias' />
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <FormShell>
          <EditCategory id={id} />
        </FormShell>
      </Suspense>
    </FinancePage>
  );
}

async function EditCategory({ id }: { id: string }) {
  const userId = await requireUserId();
  const { active, archived } = await listCategories(userId);
  const category = [...active, ...archived].find((item) => item.id === id);
  if (!category) notFound();
  return (
    <CategoryForm
      action={updateCategoryAction}
      initial={{ id: category.id, name: category.name }}
      submitLabel='Salvar alterações'
      cancelHref='/app/finance/categories'
    />
  );
}
