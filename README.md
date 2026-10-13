# Segundo Cérebro

App pessoal de pilares, hábitos e check-ins (Fase 1). Stack: **Next.js App Router**, TypeScript, Tailwind, **Drizzle**, **Neon Postgres**, **Auth.js (Google OAuth)**, deploy na **Vercel**.

## Pré-requisitos

- Node.js 22+ e [pnpm](https://pnpm.io/)
- Conta [Neon](https://neon.tech) (Postgres) — Michelle cria o projeto
- Projeto OAuth no [Google Cloud Console](https://console.cloud.google.com/) — Michelle cria as credenciais
- (Opcional) Postgres local via Docker se ainda não houver Neon

## Segredos que a Michelle precisa criar

Checklist Ops (não versionar valores reais):

1. **Neon**
   - Criar projeto/banco
   - Copiar a connection string → `DATABASE_URL`
2. **Google Cloud OAuth**
   - Criar OAuth Client (tipo *Web application*)
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (e a URL de produção depois)
   - Copiar Client ID → `AUTH_GOOGLE_ID`
   - Copiar Client Secret → `AUTH_GOOGLE_SECRET`
3. **Auth.js**
   - Gerar secret: `openssl rand -base64 32` → `AUTH_SECRET`
4. **Auth URL**
   - Local: `AUTH_URL=http://localhost:3000`
   - Produção: URL do deploy Vercel

Modelo: copie `.env.example` para `.env.local` e preencha.

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local
# edite .env.local com os segredos acima

pnpm db:generate   # gera SQL a partir do schema (já versionado em drizzle/)
pnpm db:migrate    # aplica migrações no Postgres apontado por DATABASE_URL

pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

- `/` — landing (deslogada)
- `/signin` — login Google
- `/app` — shell autenticado (stub)
- `GET /api/health` — health check do banco

## Scripts úteis

| Script | Uso |
|--------|-----|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Build e produção local |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Gera migração Drizzle |
| `pnpm db:migrate` | Aplica migrações |
| `pnpm db:push` | Push direto do schema (dev) |
| `pnpm db:studio` | Drizzle Studio |

## Documentação de produto

Ver `docs/` (00–08) e o plano da Fase 1 no store do projeto Cursor.

## Fora desta fatia (Fatia 0)

Pilares, hábitos, check-in, medicamentos, e-mail/cron — vêm nas próximas fatias. Provisionamento real Neon/Vercel fica com a Michelle; este README só documenta os passos.
