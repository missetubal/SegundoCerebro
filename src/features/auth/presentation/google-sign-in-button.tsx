import { signIn } from '../infra/next-auth';
import { secondaryButton } from '@/shared/ui';

export function GoogleSignInButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signIn('google', { redirectTo: '/app' });
      }}
    >
      <button type='submit' className={`${secondaryButton} w-full rounded-full py-2`}>
        <span className='size-2.5 rounded-full bg-[#2f8fa4]' aria-hidden />
        Continuar com Google
      </button>
    </form>
  );
}
