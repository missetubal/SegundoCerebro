/** Client-safe public API. Server: `@/features/auth/server` */
export {
  AuthFrame,
  BrandMark,
  ForgotPasswordForm,
  PasswordSignInForm,
  ResetPasswordForm,
  SignUpForm,
  authLink,
} from './presentation';
export {
  NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from './domain';
