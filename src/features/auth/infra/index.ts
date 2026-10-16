export { withNormalizedEmails } from './auth-adapter';
export {
  createPasswordUser,
  findPasswordUserByEmail,
  type CreatePasswordUserResult,
  type PasswordUser,
} from './credentials';
export { auth, handlers, signIn, signOut } from './next-auth';
export { requireUserId } from './session';
