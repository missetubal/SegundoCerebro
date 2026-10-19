import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { MedicationForm } from '@/features/medications';
import {
  deleteMedicationAction,
  getMedication,
  updateMedicationAction,
} from '@/features/medications/server';
import { ConfirmDeleteDialog, eyebrow } from '@/shared/ui';

export default function EditMedicationPage({
  params,
}: PageProps<'/app/medications/[id]/edit'>) {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Suspense fallback={<p>Carregando…</p>}>
        <EditMedicationContent params={params} />
      </Suspense>
    </main>
  );
}

async function EditMedicationContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const medication = await getMedication(userId, id);
  if (!medication) notFound();

  return (
    <>
      <Link href='/app/medications' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <span className={eyebrow}>Organização</span>
          <h1 className='text-3xl font-semibold'>Editar medicamento</h1>
        </div>
        <ConfirmDeleteDialog
          action={deleteMedicationAction}
          id={medication.id}
          title='Excluir este medicamento?'
          description='O cadastro e os registros de tomada saem. Isso não altera orientação nenhuma — é só a sua lista.'
          triggerLabel={`Excluir ${medication.name}`}
          triggerClassName='text-sm text-muted underline'
          trigger='Excluir'
        />
      </header>
      <MedicationForm
        action={updateMedicationAction}
        initial={{
          id: medication.id,
          name: medication.name,
          instructions: medication.instructions,
          frequencyKind: medication.frequencyKind,
          weekdays: medication.weekdays,
          times: medication.times,
          startsOn: medication.startsOn,
        }}
        submitLabel='Salvar'
        cancelHref='/app/medications'
      />
    </>
  );
}
