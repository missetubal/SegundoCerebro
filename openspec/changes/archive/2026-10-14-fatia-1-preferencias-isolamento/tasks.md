## 1. Infra de testes

- [x] 1.1 Criar `.env.test` com `DATABASE_URL` da branch Neon `dev` (manual, Michelle; `.env` não pode apontar para `dev`); confirmar que `.env.test` está ignorado com `git check-ignore .env.test`
- [x] 1.2 Instalar `vitest`, `zod` e `server-only` (`npm install zod server-only` + `npm install -D vitest`) e verificar que `npm install` termina sem erro
- [x] 1.3 Adicionar scripts `test` (`vitest run`) e `db:migrate:test` (drizzle-kit com `.env.test`) e verificar que `npm run db:migrate:test` cria as tabelas na branch de teste
- [x] 1.4 Criar `vitest.config.mts` (ambiente node, alias `@/`, carga de `.env.test`, mock de `server-only`) com guarda que aborta se a URL de teste for igual à do `.env`; verificar com um teste trivial que `npm test` passa e que a guarda dispara se as URLs forem iguais
- [x] 1.5 Criar fixtures de teste (criar usuário com id aleatório, limpar no `afterAll`) e verificar que após a suíte nenhum usuário de teste sobra no banco de teste

## 2. Identidade da sessão

- [x] 2.1 Criar `src/lib/session.ts` com `requireUserId()` (usa `auth()`, redireciona para `/signin` sem sessão) e verificar com teste unitário mockando `@/auth` os dois casos (com e sem sessão)

## 3. Camada de dados de preferências

- [x] 3.1 Criar `src/db/preferences.ts` com `getPreferences(userId)` (get-or-create com `on conflict do nothing`) e verificar com teste que usuário sem linha recebe `America/Sao_Paulo`/`minimal` e que chamadas simultâneas (`Promise.all`) geram uma única linha
- [x] 3.2 Adicionar `updateTimezone(userId, timezone)` (atualiza `timezone` e `updated_at`, filtra por `userId`) e verificar com teste que o valor e `updated_at` mudam
- [x] 3.3 Teste de isolamento da camada de dados: usuários A e B com fusos diferentes; ler A retorna só A; atualizar A não altera B

## 4. Server Action

- [x] 4.1 Criar `src/app/app/preferences/actions.ts` com `updateTimezoneAction(prevState, formData)`: `requireUserId()`, validação `zod` + `Intl.DateTimeFormat`, `updateTimezone`, `refresh()`; retorna estado de sucesso/erro com mensagem neutra. Verificar com testes que fuso válido salva e `Marte/Base` retorna erro sem alterar o banco
- [x] 4.2 Teste de isolamento da action: sessão mockada como A, `FormData` com `userId` de B; verificar que só A muda e B fica intacto

## 5. Interface

- [x] 5.1 Criar `src/app/app/preferences/page.tsx` (shell estático + componente async em `<Suspense>` que lê `requireUserId()` e `getPreferences`) e verificar que `npm run build` passa sem erro de prerender
- [x] 5.2 Criar formulário client com `useActionState`: select de fusos (`Intl.supportedValuesOf('timeZone')` vindo do servidor), template `minimal` só leitura, mensagem de sucesso/erro; verificar no browser que salvar `Europe/Lisbon` persiste após recarregar
- [x] 5.3 Adicionar sugestão do fuso do navegador (preenche o select sem salvar) e verificar no browser trocando o fuso do sistema ou via DevTools (Sensors → Location/timezone)
- [x] 5.4 Adicionar link "Preferências" em `/app` e verificar navegação; verificar que `/app/preferences` sem sessão redireciona para `/signin`

## 6. Fechamento

- [x] 6.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar os três verdes
- [x] 6.2 Smoke test manual: login, abrir preferências (linha criada com defaults no banco real), trocar fuso, recarregar, sair
