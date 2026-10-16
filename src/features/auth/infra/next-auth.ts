import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { db } from '@/shared/db';
import { accounts, sessions, users, verificationTokens } from '@/shared/db';
import { authorizeCredentials } from '../application/authorize';
import { withNormalizedEmails } from './auth-adapter';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: withNormalizedEmails(
    DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
  ),
  session: { strategy: 'jwt' },
  providers: [
    Google,
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: { signIn: '/signin', error: '/signin' },
});
