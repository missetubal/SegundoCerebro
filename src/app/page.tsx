import Link from "next/link";
import { primaryButton } from "@/shared/ui";

export default function Home() {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6'>
      <h1 className='text-3xl font-semibold'>Segundo Cérebro</h1>
      <p>Pilares, hábitos e check-ins, sem culpa.</p>
      <Link href='/signin' className={primaryButton}>
        Entrar
      </Link>
    </main>
  );
}
