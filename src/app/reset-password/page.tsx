import Link from 'next/link';
import { AuthFrame, ResetPasswordForm, authLink } from '@/features/auth';

export default function ResetPasswordPage() {
  return (
    <AuthFrame
      title='Nova senha'
      description='A troca de senha ainda não está disponível.'
      footer={
        <Link href='/signin' className={authLink}>
          Voltar a entrar
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthFrame>
  );
}
