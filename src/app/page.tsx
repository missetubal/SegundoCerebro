import Link from "next/link";
import { Suspense } from "react";

import { auth } from "@/auth";

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
          <p className="text-stone-500">Carregando…</p>
        </main>
      }
    >
      <LandingContent />
    </Suspense>
  );
}

async function LandingContent() {
  const session = await auth();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-emerald-800 uppercase">
          Segundo Cérebro
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Seu espaço diário, sem culpa
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-stone-600">
          Pilares, hábitos e check-ins em um só lugar. Bootstrap da Fase 1 —
          entre com Google para começar.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {session ? (
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-medium text-white hover:bg-emerald-900"
          >
            Ir para o app
          </Link>
        ) : (
          <Link
            href="/signin"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-medium text-white hover:bg-emerald-900"
          >
            Entrar
          </Link>
        )}
      </div>
    </main>
  );
}
