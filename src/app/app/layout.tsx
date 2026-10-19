import { Suspense } from 'react';
import { listAreas } from '@/features/areas/server';
import { auth, requireUserId } from '@/features/auth/server';
import { AppSidebar } from '@/features/shell';

export default function AppLayout({ children }: LayoutProps<'/app'>) {
  return (
    <div className='flex min-h-dvh flex-col bg-bg-app md:flex-row'>
      <Suspense
        fallback={
          <aside className='hidden h-dvh w-56 shrink-0 border-r border-border bg-bg-card md:block' />
        }
      >
        <SidebarSlot />
      </Suspense>
      <div className='min-w-0 flex-1 overflow-y-auto'>{children}</div>
    </div>
  );
}

async function SidebarSlot() {
  const userId = await requireUserId();
  const [session, { active: areas }] = await Promise.all([
    auth(),
    listAreas(userId),
  ]);

  return (
    <AppSidebar
      areas={areas.map((area) => ({ id: area.id, name: area.name }))}
      userName={session?.user?.name}
    />
  );
}
