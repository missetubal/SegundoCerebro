# GitHub Actions

## CI (`.github/workflows/ci.yml`)

Roda em PR, push em `main` e `workflow_dispatch`:

1. **quality** — `npm run lint` + `npm run typecheck`
2. **verify** — migrate DB de teste → Vitest → `next build` → Playwright (se houver secrets E2E)

### Banco de teste (escolha um)

**Opção A — Neon branch efêmero (recomendado)**

1. [Neon GitHub Integration](https://neon.tech/docs/guides/neon-github-integration) ou secrets manuais
2. Secret `NEON_API_KEY`
3. Variable `NEON_PROJECT_ID`
4. Opcional: variable `NEON_TEST_PARENT_BRANCH` (default `main`)  
   Para E2E, use um parent que já tenha o usuário de `E2E_EMAIL` / `E2E_PASSWORD`.

**Opção B — branch fixa**

1. Secret `DATABASE_URL_TEST` (connection string da branch de teste Neon)

### E2E (opcional)

Secrets `E2E_EMAIL` e `E2E_PASSWORD`. Sem eles, o job pula Playwright.

## CD (`.github/workflows/cd.yml`)

Deploy da app: **Vercel** (Git integration — preview na PR, produção no `main`).

Migrate de produção: workflow manual. Em Actions → **CD** → Run workflow → digite `migrate`.

1. Crie o Environment `production` no GitHub
2. Secret `DATABASE_URL` nesse environment (produção)
