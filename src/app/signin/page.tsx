import Link from "next/link";
import { Suspense } from "react";

import { signInWithGoogle } from "@/app/actions/auth";
import { auth } from "@/auth";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-16">
          <p className="text-stone-500">Carregando…</p>
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

async function SignInContent() {
  const session = await auth();

  if (session) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-16">
        <p className="text-stone-700">Você já está autenticada.</p>
        <Link
          href="/app"
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-medium text-white hover:bg-emerald-900"
        >
          Continuar
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-emerald-800 hover:underline">
          ← Segundo Cérebro
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Entrar
        </h1>
        <p className="text-stone-600">
          Use sua conta Google. OAuth precisa de{" "}
          <code className="rounded bg-stone-100 px-1 text-sm">AUTH_GOOGLE_*</code>{" "}
          no ambiente.
        </p>
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-md border border-stone-300 bg-white px-5 text-sm font-medium text-stone-900 hover:bg-stone-50"
        >
          Continuar com Google
        </button>
      </form>
    </main>
  );
}
