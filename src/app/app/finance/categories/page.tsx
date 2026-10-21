import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { CategoryForm } from '@/features/finance/presentation/category-form';
import {
  EmptyState,
  FinancePage,
  Panel,
} from '@/features/finance/presentation/finance-shell';
import {
  archiveCategoryAction,
  createCategoryAction,
  listCategories,
} from '@/features/finance/server';
import { ItemActionButton } from '@/shared/ui';

const ACTION_CLASS =
  'inline-flex min-h-9 items-center rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-bg-app hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-50';

export default function CategoriesPage() {
  return (
    <FinancePage
      title='Categorias'
      description='Categorias usadas para organizar os lançamentos.'
      current='/app/finance/transactions'
    >
      <Suspense fallback={<p className='text-sm text-muted'>Carregando…</p>}>
        <Categories />
      </Suspense>
    </FinancePage>
  );
}

async function Categories() {
  const userId = await requireUserId();
  const { active } = await listCategories(userId);
  return (
    <>
      <Panel title='Nova categoria'>
        <div className='max-w-xl'>
          <CategoryForm action={createCategoryAction} />
        </div>
      </Panel>
      <Panel title='Categorias ativas'>
        {active.length === 0 ? (
          <EmptyState title='Nenhuma categoria ainda' hint='Crie a primeira categoria no formulário acima.' />
        ) : (
          <ul className='flex flex-col'>
            {active.map((category) => (
              <li
                key={category.id}
                className='flex min-h-11 items-center justify-between gap-3 border-b border-border py-1.5 last:border-b-0'
              >
                <span className='text-sm font-medium text-ink'>{category.name}</span>
                <ItemActionButton
                  action={archiveCategoryAction}
                  id={category.id}
                  label='Arquivar'
                  className={ACTION_CLASS}
                >
                  Arquivar
                </ItemActionButton>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
