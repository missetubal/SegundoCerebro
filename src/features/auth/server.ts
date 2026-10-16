import 'server-only';

export {
  auth,
  handlers,
  signIn,
  signOut,
  createPasswordUser,
  findPasswordUserByEmail,
  type CreatePasswordUserResult,
  type PasswordUser,
  requireUserId,
} from './infra';
export {
  signInWithPasswordAction,
  signUpAction,
  type SignInState,
  type SignUpState,
} from './application';
export {
  authorizeCredentials,
  RateLimitedSignin,
  type AuthorizedUser,
} from './application/authorize';
