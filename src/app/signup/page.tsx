import Link from 'next/link';
import { AuthFrame, SignUpForm, authLink } from '@/features/auth';
import { GoogleSignInButton } from '@/features/auth/server';

export default function SignUpPage() {
  return (
    <AuthFrame
      title='Criar conta'
      description='Comece a organizar suas áreas'
      footer={
        <>
          Já tem conta?{' '}
          <Link href='/signin' className={authLink}>
            Entrar
          </Link>
        </>
      }
    >
      <SignUpForm google={<GoogleSignInButton />} />
    </AuthFrame>
  );
}
