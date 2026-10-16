## Why

Metas e hábitos genéricos são o próximo bloco da Fase 1/2 depois de áreas e horizontes (Fatia 2): sem eles não há o que listar no check-in diário (Fatia 4) nem vínculo leve com áreas. O aceite exige criar hábitos sem catálogo fixo e listar os ativos do dia.

## What Changes

- Nova entidade `goal` por usuário: título, horizonte (`horizon_id`), área principal (`primary_area_id`), status, datas opcionais (`start_date`, `target_date`); CRUD mínimo com isolamento por `user_id`.
- Próximos passos (`next_step`) opcionais ligados a uma meta; ausência deles MUST não impedir fluxos futuros de check-in.
- Nova entidade `habit` genérica (sem catálogo fixo): nome, `tracking_type` (`completion` | `quantity`), frequência simples (`daily` | dias da semana), `target_value`/`unit` só quando `quantity`, estado ativo/arquivado.
- Join `habit_area` (não `habit_pillar`) ligando hábito a uma ou mais áreas do usuário.
- Listagem dos hábitos ativos aplicáveis ao dia corrente (base para o check-in da Fatia 4), usando o fuso do usuário.
- UI pt-BR com o termo **área** (nunca “pilar”); rotas e código em inglês (`/app/goals`, `/app/habits`, features `goals` / `habits`).
- Testes de isolamento A/B para `goal`, `next_step`, `habit` e `habit_area`.

## Capabilities

### New Capabilities
- `goals`: CRUD mínimo de metas leves, vínculo com horizonte e área principal, e próximos passos opcionais.
- `habits`: hábitos genéricos sem catálogo, vínculo multi-área via `HabitArea`, frequências simples e listagem dos ativos do dia.

### Modified Capabilities
<!-- Nenhuma: o requisito de isolamento por testes em `data-isolation` já cobre novas entidades; cenários específicos ficam nas specs novas. -->

## Impact

- Banco: tabelas `goal`, `next_step`, `habit`, `habit_area` (FKs para `user`, `area`, `horizon`); migração Drizzle aditiva.
- Código: `src/shared/db/schema.ts`; features `src/features/goals/**` e `src/features/habits/**` no padrão de `areas`/`horizons`; rotas `src/app/app/goals/**` e `src/app/app/habits/**`; links na home `/app`.
- Dependências: reutiliza áreas e horizontes já seedados/cadastrados; não altera o catálogo de áreas.
- Fora do escopo desta fatia: UI de check-in / `HabitLog`, medicamentos, dashboard, hábitos tipados (treino/leitura/água especializada), vínculo hábito↔meta, áreas secundárias da meta (`GoalArea`), e-mail, API REST.
