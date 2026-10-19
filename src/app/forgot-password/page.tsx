import Link from 'next/link';
import { AuthFrame, ForgotPasswordForm, authLink } from '@/features/auth';

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      title='Esqueceu a senha?'
      description='A recuperação de senha ainda não está disponível.'
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
