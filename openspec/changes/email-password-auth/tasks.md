## 1. Schema

- [x] 1.1 Adicionar `user_password` (PK/FK `user_id` cascade, `password_hash`) e `login_failure` (`email`, `created_at`, índice `(email, created_at)`) em `src/db/schema.ts`; rodar `npm run db:generate` e verificar o SQL gerado
- [x] 1.2 Aplicar com `npm run db:migrate:test` e verificar que `npm test` continua verde

## 2. Senha e validação

- [x] 2.1 Criar `src/lib/password.ts` (`hashPassword`/`verifyPassword` com `scrypt`, formato com parâmetros, `timingSafeEqual`) e verificar com testes: senha certa/errada, salts diferentes para a mesma senha, hash malformado retorna `false`
- [x] 2.2 Criar `src/lib/validation/credentials.ts` (cadastro: nome 1–80, e-mail normalizado, senha 8–128; login: e-mail normalizado, senha não vazia) e verificar com testes de limites e normalização

## 3. Camada de dados de credenciais

- [x] 3.1 Criar `src/db/credentials.ts` com `createPasswordUser` (`db.batch` de `user` + `user_password`, `23505` vira `email_taken`) e `findPasswordUserByEmail` (busca por `lower(email)`, indica se tem senha); verificar com testes no banco de teste, incluindo e-mail com outra capitalização e usuário Google sem senha
- [x] 3.2 Adicionar `countRecentLoginFailures(email)` e `recordLoginFailure(email)` (com limpeza de falhas > 1 dia); verificar com testes de contagem na janela e de falhas antigas fora da janela

## 4. Autorização de credenciais

- [x] 4.1 Criar `src/lib/credentials-authorize.ts` com `authorizeCredentials` (valida, checa limite, verifica hash com hash de mentira para e-mail desconhecido, registra falha) e `RateLimitedSignin`; verificar com testes: sucesso retorna `{ id, name, email, image }` sem hash, senha errada/e-mail desconhecido/conta Google retornam `null`, 6ª tentativa após 5 falhas lança `RateLimitedSignin` mesmo com senha certa, falhas de outro e-mail não bloqueiam, falhas com mais de 15 min não contam
- [x] 4.2 Atualizar `src/auth.ts`: `session.strategy = 'jwt'`, provider `Credentials` usando `authorizeCredentials`, callback `session` com `session.user.id = token.sub`, `pages.error = '/signin'`; verificar que `npm run build` passa e que `requireUserId()` segue funcionando (teste existente de `session.ts` verde)

## 5. Login

- [x] 5.1 Criar Server Action de login em `src/app/signin/actions.ts` (`signIn('credentials')`, mapeia `CredentialsSignin`/`rate_limited` para mensagens neutras, relança redirect); verificar com testes mockando `@/auth`
- [ ] 5.2 Atualizar `/signin`: formulário client de e-mail/senha com `useActionState`, botão Google mantido, link "Criar conta", mensagem para `?error=OAuthAccountNotLinked`; verificar no browser login com senha, erro genérico e mensagem do Google bloqueado

## 6. Cadastro

- [x] 6.1 Criar Server Action de cadastro em `src/app/signup/actions.ts` (validação, e-mail existente com/sem senha, `createPasswordUser`, `signIn` em seguida); verificar com testes: sucesso cria conta e chama `signIn`, e-mail de conta com senha recusa orientando login com senha, e-mail de conta Google recusa orientando Google, nenhum dos dois altera dados, entrada inválida não grava
- [ ] 6.2 Criar página `/signup` (formulário client, link para `/signin`) e verificar no browser cadastro completo levando a `/app` com o nome correto

## 7. Fechamento

- [x] 7.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar os três verdes
- [ ] 7.2 Aplicar `npm run db:migrate` no banco real e fazer smoke test: cadastro, sair, login com senha, 5 senhas erradas seguidas de bloqueio, login Google de conta existente, sair
