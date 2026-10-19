import Link from 'next/link';
import { Suspense } from 'react';
import { AuthFrame, PasswordSignInForm, authLink } from '@/features/auth';
import { GoogleSignInButton } from '@/features/auth/server';

export default function SignInPage({ searchParams }: PageProps<'/signin'>) {
  return (
    <AuthFrame
      title='Bem-vinda de volta'
      description='Entre na sua conta do Segundo Cérebro'
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link href='/signup' className={authLink}>
            Criar conta
          </Link>
        </>
      }
    >
      <Suspense
        fallback={<PasswordSignInForm google={<GoogleSignInButton />} />}
      >
        <SignInBody searchParams={searchParams} />
      </Suspense>
    </AuthFrame>
  );
}

async function SignInBody({
  searchParams,
}: Pick<PageProps<'/signin'>, 'searchParams'>) {
  const { error } = await searchParams;
  const notice = !error
    ? null
    : error === 'OAuthAccountNotLinked'
      ? 'Este e-mail já tem uma conta com senha. Entre com e-mail e senha.'
      : 'Não foi possível entrar. Tente de novo.';

  return <PasswordSignInForm notice={notice} google={<GoogleSignInButton />} />;
}
