import Link from 'next/link';
import { AuthFrame, ForgotPasswordForm, authLink } from '@/features/auth';

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      title='Esqueceu a senha?'
      description='Enviamos um link se o e-mail existir na conta'
      footer={
        <>
          Lembrou?{' '}
          <Link href='/signin' className={authLink}>
            Voltar a entrar
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
