import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import {
  archiveMedicationAction,
  listMedications,
  unarchiveMedicationAction,
  type Medication,
} from '@/features/medications/server';
import { ItemActionButton, card, eyebrow, iconButton, primaryButton } from '@/shared/ui';

export default function MedicationsPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link href='/app' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <span className={eyebrow}>Organização</span>
          <h1 className='text-3xl font-semibold'>Medicamentos</h1>
          <p className='text-sm text-muted'>
            Lista sua, para organizar. O app não orienta dose nem tratamento.
          </p>
        </div>
        <Link href='/app/medications/new' className={primaryButton}>
          <Plus className='size-4' aria-hidden />
          Novo medicamento
        </Link>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <MedicationsContent />
      </Suspense>
    </main>
  );
}

async function MedicationsContent() {
  const userId = await requireUserId();
  const { active, archived } = await listMedications(userId);

  return (
    <>
      <section className='flex flex-col gap-3'>
        <h2 className='text-lg font-semibold'>Ativos</h2>
        {active.length === 0 ? (
          <p className={`${card} p-4 text-sm text-muted`}>
            Nenhum medicamento ativo. Você pode cadastrar um quando quiser.
          </p>
        ) : (
          <MedicationList medications={active} showArchive />
        )}
      </section>
      {archived.length > 0 && (
        <details className='group'>
          <summary className='cursor-pointer text-lg font-semibold'>
            Arquivados ({archived.length})
          </summary>
          <div className='mt-3'>
            <MedicationList medications={archived} showUnarchive />
          </div>
        </details>
      )}
    </>
  );
}

function MedicationList({
  medications,
  showArchive = false,
  showUnarchive = false,
}: {
  medications: Medication[];
  showArchive?: boolean;
  showUnarchive?: boolean;
}) {
  return (
    <ul className='flex flex-col gap-2'>
      {medications.map((medication) => (
        <li
          key={medication.id}
          className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}
        >
          <div className='flex flex-col gap-1'>
            <span className='font-medium'>{medication.name}</span>
            <span className='text-sm text-muted'>
              {medication.frequencyKind === 'daily'
                ? 'Todo dia'
                : `Dias ${(medication.weekdays ?? []).join(', ')}`}
              {' · '}
              {medication.times.join(', ')}
              {' · a partir de '}
              {medication.startsOn}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <Link
              href={`/app/medications/${medication.id}/edit`}
              className={iconButton}
              aria-label={`Editar ${medication.name}`}
            >
              <Pencil className='size-4' aria-hidden />
            </Link>
            {showArchive && (
              <ItemActionButton
                action={archiveMedicationAction}
                id={medication.id}
                label={`Arquivar ${medication.name}`}
                className={iconButton}
              >
                <Archive className='size-4' aria-hidden />
              </ItemActionButton>
            )}
            {showUnarchive && (
              <ItemActionButton
                action={unarchiveMedicationAction}
                id={medication.id}
                label={`Reativar ${medication.name}`}
                className={iconButton}
              >
                <ArchiveRestore className='size-4' aria-hidden />
              </ItemActionButton>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
