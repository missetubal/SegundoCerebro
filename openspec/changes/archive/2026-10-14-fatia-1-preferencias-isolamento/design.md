## Context

Estado atual (Fatia 0, na `main`):

- `src/auth.ts`: Auth.js v5 + Google + `DrizzleAdapter`, sessão em banco (estratégia padrão com adapter). `session.user.id` disponível.
- `src/db/index.ts`: cliente Drizzle único (`neon-http`) lendo `DATABASE_URL`.
- `src/db/schema.ts`: `user_preference` já existe (`user_id` PK/FK, `timezone`, `journal_template`, `created_at`, `updated_at`). Nenhum código lê ou grava.
- `src/app/app/page.tsx`: lê sessão dentro de `<Suspense>` por causa de `cacheComponents: true`.
- Sem test runner. `drizzle.config.ts` carrega `.env`.
- O usuário da Michelle já existe no banco sem linha em `user_preference`.

Requisitos: ver `specs/user-preferences/spec.md` e `specs/data-isolation/spec.md`.

## Goals / Non-Goals

**Goals:**
- Um padrão único de acesso a dados por usuário que as próximas fatias copiem.
- Testes de isolamento rodando contra banco real de teste, não mocks de SQL.

**Non-Goals:**
- Row Level Security no Postgres (avaliar quando houver mais entidades).
- Endpoints REST de preferências.
- `proxy.ts` para proteção de rotas.

## Decisions

### 1. Defaults criados sob demanda (get-or-create), não no evento de login
`getPreferences(userId)` faz `insert ... on conflict (user_id) do nothing` seguido de `select`. Idempotente e seguro contra requisições simultâneas pela PK.
- Alternativa: evento `createUser` do Auth.js. Rejeitada como mecanismo único porque não cobre o usuário já existente e falhas no evento deixariam o usuário sem linha.

### 2. Camada de dados com `userId` obrigatório
`src/db/preferences.ts` exporta `getPreferences(userId)` e `updateTimezone(userId, timezone)`. Toda query usa `where(eq(userPreferences.userId, userId))`. Nenhuma função de dados pessoais é exportada sem `userId` como primeiro parâmetro. Módulos de dados importam `server-only`.
- Alternativa: RLS com `set_config` por requisição. Rejeitada agora: o driver `neon-http` não mantém sessão entre queries, exigiria transação por requisição; custo alto para uma usuária.

### 3. `requireUserId()` como única porta de entrada da identidade
`src/lib/session.ts`: chama `auth()`; sem `session.user.id`, `redirect('/signin')`; senão retorna o id. Páginas e Server Actions usam só isso. Server Actions nunca leem `userId` de `FormData`.

### 4. Server Action para salvar, não rota REST
`src/app/app/preferences/actions.ts` com `updateTimezoneAction(prevState, formData)`, usado com `useActionState` num formulário client. Valida com `zod` + checagem `Intl.DateTimeFormat(undefined, { timeZone })` (lança `RangeError` se inválido). Após salvar, chama `refresh()` de `next/cache` para re-renderizar a rota.
- Alternativa: `PATCH /api/preferences`. Adiada; nada consome API externa ainda.

### 5. Página com `cacheComponents`
`/app/preferences/page.tsx`: shell estático; leitura de sessão + preferências num componente async dentro de `<Suspense>`, mesmo padrão de `/app`. Lista de fusos: `Intl.supportedValuesOf('timeZone')` no servidor. Sugestão do fuso do navegador num client component pequeno (`Intl.DateTimeFormat().resolvedOptions().timeZone`) que só preenche o select.

### 6. Testes: Vitest + branch Neon de teste
- Vitest em ambiente `node`, testes em `src/**/*.test.ts`.
- `vitest.config.mts` carrega `.env.test` (ignorado no Git) com `DATABASE_URL` da branch Neon `dev` (já existente; testes só criam e apagam usuários `test-*`, então convivem com dados de dev). O teste aborta se `DATABASE_URL` for igual ao do `.env` (proteção contra rodar no banco real).
- Migrações na branch de teste: `npm run db:migrate:test` (drizzle-kit com env de teste).
- Fixtures criam usuários com ids aleatórios e removem no `afterAll` (cascade apaga preferências).
- Testes da Server Action: `vi.mock('@/auth')` para simular sessão do usuário A; `next/cache` mockado. Verifica que `userId` de B no `FormData` é ignorado.
- `server-only` mockado/alias no Vitest.
- Alternativa: Postgres local em Docker. Rejeitada porque o driver `neon-http` só fala com Neon por HTTP; trocaria driver só em teste.

## Risks / Trade-offs

- [Isolamento depende de disciplina, sem RLS] → padrão único em `src/db/*` com `userId` obrigatório + teste de isolamento por entidade (spec `data-isolation`); revisar RLS quando houver 3+ entidades.
- [Testes dependem de rede/Neon] → branch de teste dedicada; falha de rede aparece como erro claro de conexão.
- [Rodar testes contra o banco real por engano] → guarda no setup que compara URLs e aborta.
- [`Intl.supportedValuesOf` varia por runtime] → validação usa `Intl.DateTimeFormat` (aceita aliases válidos); lista só alimenta o select.
- [Get-or-create faz insert em leitura] → custo de uma query extra por leitura; aceitável no volume atual.

## Migration Plan

Sem migração de schema. Deploy normal; a linha de preferências da Michelle é criada no primeiro acesso. Rollback: reverter o código; linhas criadas em `user_preference` são inofensivas.
