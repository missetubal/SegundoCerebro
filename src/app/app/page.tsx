import { Suspense } from "react";

import { signOutAction } from "@/app/actions/auth";
import { auth } from "@/auth";

export default function AppHomePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
          <p className="text-stone-500">Carregando…</p>
        </main>
      }
    >
      <AppHomeContent />
    </Suspense>
  );
}

async function AppHomeContent() {
  const session = await auth();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <p className="text-sm font-medium tracking-wide text-emerald-800 uppercase">
            Segundo Cérebro
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">
            Olá{session?.user?.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-2 text-stone-600">
            Shell autenticado (Fatia 0). Pilares, hábitos e check-in vêm nas
            próximas fatias.
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Sair
          </button>
        </form>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-stone-900">Status</h2>
        <ul className="list-inside list-disc text-stone-600">
          <li>Sessão ativa via Auth.js + Google</li>
          <li>Preferências seed criadas no primeiro login</li>
          <li>
            Conta:{" "}
            <span className="font-mono text-sm text-stone-800">
              {session?.user?.email ?? "—"}
            </span>
          </li>
        </ul>
      </section>
    </main>
  );
}
