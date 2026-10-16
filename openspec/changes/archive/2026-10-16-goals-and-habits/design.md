## Context

Estado atual (após Fatia 2 renomeada para áreas):

- Schema em `src/shared/db/schema.ts`: Auth.js, `user_preference` (incl. `timezone`, `horizons_seeded_at`), `area`, `horizon`. Migrações até `0006_rename_pillar_to_area.sql`.
- Features: `src/features/areas/**` e `src/features/horizons/**` com `domain` / `application` / `infra` / `presentation` / `server.ts`; rotas finas em `src/app/app/areas/**` e `.../horizons/**`.
- Dados: repositórios com `import 'server-only'`, `userId` primeiro parâmetro, helpers `ownedBy` / `writeUnique` / `deleteOwned` em `src/shared/db`.
- Identidade: `requireUserId()` via `@/features/auth/server`. Actions com `useActionState`, zod no domain, mensagens neutras pt-BR.
- Driver `neon-http`: sem transação interativa; writes multi-tabela via `db.batch` ou statement único.
- Home `/app` já linka Áreas, Horizontes e Preferências; copy ainda menciona “Em breve: check-in, metas e hábitos.”

Motivação: `proposal.md`. Contratos: `specs/goals/spec.md`, `specs/habits/spec.md`.

## Goals / Non-Goals

**Goals:**
- Repetir o padrão feature-based de áreas/horizons para `goals` e `habits`.
- Modelo mínimo demoável: CRUD de metas + próximos passos opcionais; hábitos livres com HabitArea; lista do dia filtrada por frequência e fuso.
- Isolamento A/B testado nas novas entidades.

**Non-Goals:**
- `HabitLog`, UI de check-in, templates de journal.
- `HabitGoal`, `GoalArea` (áreas secundárias), métrica de sucesso da meta.
- Frequências avançadas e tracking_types além de `completion` / `quantity`.
- Hábitos tipados (água/treino/leitura como entidades próprias), medicamentos, dashboard, e-mail, REST.

## Decisions

### 1. Duas features espelhando áreas
- `src/features/goals/**` e `src/features/habits/**` com as mesmas camadas.
- Rotas: `/app/goals`, `/app/goals/new`, `/app/goals/[id]`, `/app/goals/[id]/edit`; `/app/habits`, `/app/habits/new`, `/app/habits/[id]/edit`; página “hábitos de hoje” em `/app/habits` (lista do dia no topo ou rota `/app/habits/today` — preferir seção na lista principal `/app/habits` com filtro “Hoje” como default da home de hábitos para reduzir rotas).
- Export client-safe em `index.ts`; server em `server.ts`.
- Alternativa: módulos só em `src/shared/db` + pages monolíticas. Rejeitada: Fatia 2 já padronizou features.

### 2. Schema `goal` e `next_step`
```
goal(
  id, user_id FK→user cascade,
  title,
  primary_area_id FK→area restrict,
  horizon_id FK→horizon restrict,
  status text not null default 'active',  -- active | completed | archived
  start_date date null, target_date date null,
  created_at, updated_at
)
next_step(
  id, user_id FK→user cascade,
  goal_id FK→goal cascade,
  title,
  status text not null default 'open',  -- open | done
  created_at, updated_at
)
```
- Índices: `(user_id, status)`, `(user_id, primary_area_id)`, `(goal_id)` em next_step.
- `user_id` denormalizado em `next_step` para filtros de isolamento sem join obrigatório; escrita sempre copia o `user_id` da meta após validar ownership.
- Datas como `date` (calendário), não timestamptz — alinhado a “entry_date no fuso do usuário” para alvos, sem hora.
- FK `restrict` em área/horizonte: apagar área/horizonte com metas vinculadas falha de forma controlada na action (mensagem neutra pedindo reatribuir). Alternativa `on delete set null` rejeitada porque área e horizonte são obrigatórios na spec.
- Sem `GoalArea` / descrição / métrica nesta fatia (RF-020 completo fica para depois).

### 3. Schema `habit` e `habit_area`
```
habit(
  id, user_id FK→user cascade,
  name,
  tracking_type text not null,  -- completion | quantity
  frequency_kind text not null, -- daily | weekdays
  weekdays integer[] null,      -- 1=Mon .. 7=Sun (ISO); null se daily
  target_value integer null,    -- só quantity; > 0
  unit text null,               -- só quantity
  archived_at timestamptz null,
  created_at, updated_at
)
habit_area(
  habit_id FK→habit cascade,
  area_id FK→area cascade,
  PK (habit_id, area_id)
)
```
- Nome da join: **`habit_area`** (código `habitAreas`) — nunca `habit_pillar`.
- Check de aplicação (zod + opcional check SQL): completion ⇒ target/unit null; quantity ⇒ ambos presentes; daily ⇒ weekdays null; weekdays ⇒ array length ≥ 1, valores 1–7 distintos.
- Alternativa: `frequency_config` jsonb livre. Rejeitada nesta fatia: só dois modos; colunas tipadas simplificam query da lista do dia.
- Sem `HabitGoal`, lembrete, start/end date nesta fatia.

### 4. Lista dos hábitos ativos do dia
- `listHabitsForDate(userId, dateYmd, timeZone)` (ou deriva “hoje” via `user_preference.timezone` com helper de calendário existente/novo em `src/shared/lib`).
- Filtro: `archived_at is null` AND (`frequency_kind = 'daily'` OR dia-da-semana ISO de `dateYmd` ∈ `weekdays`).
- Carrega áreas via join `habit_area` + `area` do mesmo `user_id`.
- Não cria nem lê `HabitLog` — só definição aplicável ao dia (base do check-in futuro).

### 5. Validação e actions
- Zod em `features/goals/domain` e `features/habits/domain`.
- Actions: nunca aceitam `userId` do client; ids de área/horizonte/hábito/meta validados com `getArea` / `getHorizon` / ownership antes do write.
- Criar hábito: `db.batch` — insert habit + N inserts `habit_area` (ou um insert multi-row). Se área inválida, aborta sem hábito órfão (batch atômico no Neon HTTP).
- Atualizar áreas do hábito: delete joins do hábito + reinsert (mesmo batch), sempre ≥ 1 área.
- Mensagens pt-BR neutras; rótulos de formulário usam “área”.

### 6. UI mínima demoável
- Metas: lista (ativas / concluídas / arquivadas em seções), formulário criar/editar, detalhe com próximos passos (adicionar, marcar feito, remover).
- Hábitos: formulário livre (nome, tipo, frequência, áreas multi-select das áreas ativas, target/unit condicionais); lista “Hoje” + lista de todos os ativos; arquivar.
- Links “Metas” e “Hábitos” na home `/app`; atualizar copy “Em breve…”.
- UI copy: área / meta / hábito / próximo passo / horizonte.

### 7. Testes
- Repositório: CRUD, FKs inválidas, isolamento A/B, lista do dia (daily vs weekdays, fuso, arquivado).
- Domain: zod (quantity sem unit, weekdays vazios, datas invertidas, completion com target).
- Actions: sessão ausente → redirect; id de B com sessão A → not found / sem side effect.

## Risks / Trade-offs

- [Apagar área/horizonte com metas] → `restrict` + mensagem na action; não cascade silencioso.
- [neon-http sem transação multi-statement ad hoc] → `db.batch` para habit+áreas; se batch indisponível para o caso, um CTE/`insert…returning` + inserts dependentes no mesmo batch.
- [ISO weekday 1–7 vs JS `getDay()` 0–6] → converter num único helper documentado nos testes.
- [Escopo RF-020/031 maior que a fatia] → specs desta change limitam explicitamente; fatias futuras ampliam.

## Migration Plan

1. Adicionar tabelas em `schema.ts` e gerar migração Drizzle aditiva (`0007_goals_and_habits` ou próximo número).
2. Deploy só schema (sem backfill — entidades novas).
3. Rollback: dropar as quatro tabelas (sem dados legados críticos nesta fatia).

## Open Questions

Nenhuma que altere specs ou o breakdown: associação hábito↔meta e áreas secundárias da meta ficam conscientemente fora; rota exata “hoje” vs seção na lista é detalhe de UI coberto pela decision 1.
