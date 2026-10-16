## 1. Schema e migração

- [x] 1.1 Adicionar tabelas `goal`, `next_step`, `habit` e `habit_area` em `src/shared/db/schema.ts` conforme `design.md` (FKs, índices, tipos); rodar `npm run db:generate` e verificar que o SQL novo contém as quatro tabelas e as FKs `primary_area_id`/`horizon_id`/`habit_area`
- [x] 1.2 Aplicar com `npm run db:migrate:test` e verificar que `npm test` continua verde nas suítes existentes

## 2. Domain (validação)

- [x] 2.1 Criar `src/features/goals/domain` com schemas zod de meta (título 1–120, `horizonId`, `primaryAreaId`, status `active|completed|archived`, datas opcionais coerentes) e de próximo passo (título 1–120, status `open|done`); verificar com testes unitários limites, trim, datas invertidas e status inválido
- [x] 2.2 Criar `src/features/habits/domain` com schemas zod (`completion|quantity`, `daily|weekdays`, weekdays 1–7, target/unit só em quantity, ≥1 `areaIds`); verificar com testes: Meditar/Água válidos, quantity sem unit, completion com target, weekdays vazios

## 3. Infra de metas e próximos passos

- [x] 3.1 Implementar `src/features/goals/infra/repository.ts`: `listGoals`, `getGoal`, `createGoal`, `updateGoal` (valida área/horizonte do mesmo `userId` antes do write); verificar com testes de CRUD e rejeição de área/horizonte alheios
- [x] 3.2 Adicionar `listNextSteps`, `createNextStep`, `completeNextStep`, `deleteNextStep` com `user_id` denormalizado; verificar meta sem passos permanece válida e isolamento A/B em goal + next_step
- [x] 3.3 Teste de isolamento: operações de A com ids de B retornam não encontrado e B intacto

## 4. Infra de hábitos

- [x] 4.1 Implementar `src/features/habits/infra/repository.ts`: `createHabit` (batch habit + `habit_area`), `listHabits`, `getHabit` (com áreas), `updateHabit`, `archiveHabit` / `unarchiveHabit`; verificar criação Meditar (completion) e Água (quantity+ml) e rejeição sem área / área alheia
- [x] 4.2 Implementar `listHabitsForDate(userId, dateYmd, timeZone)` filtrando ativos por `daily` ou weekday ISO no fuso; verificar com testes: diário sempre entra, weekdays só no dia certo, arquivado fora, isolamento A/B
- [x] 4.3 Helper de calendário/weekday ISO (se ainda não existir em `src/shared/lib`) com testes cobrindo conversão JS `getDay` ↔ ISO 1–7 no fuso

## 5. Application (Server Actions)

- [x] 5.1 Actions de goals em `src/features/goals/application` (criar/editar/status, CRUD de next steps) com `requireUserId()`, mensagens neutras pt-BR e “área” nos textos; verificar com `actions.test.ts` (validação, id de B, `userId` no FormData ignorado, sem sessão redireciona)
- [x] 5.2 Actions de habits equivalentes (criar/editar/arquivar); verificar com `actions.test.ts` no mesmo padrão

## 6. UI de metas

- [x] 6.1 Rotas `/app/goals` (lista ativas/concluídas/arquivadas), `/app/goals/new`, `/app/goals/[id]/edit` com formulário (título, horizonte, área principal, datas, status); verificar no browser criar/editar e que o rótulo do vínculo é “área”
- [x] 6.2 Detalhe `/app/goals/[id]` com próximos passos opcionais (adicionar, concluir, remover) e estado vazio sem culpa; verificar meta sem passos salva e passos persistem após reload

## 7. UI de hábitos (demoável)

- [x] 7.1 Rotas `/app/habits/new` e edição com formulário livre (nome, tracking_type, frequência, multi-select de áreas ativas, target/unit condicionais); verificar criar “Meditar” e “Água” sem catálogo fixo
- [x] 7.2 Página `/app/habits` listando hábitos ativos do dia (fuso das preferências) e demais ativos/arquivados; verificar que diário aparece hoje e hábito de outro weekday não

## 8. Navegação e fechamento

- [x] 8.1 Links “Metas” e “Hábitos” em `src/app/app/page.tsx` e remover a menção “Em breve: check-in, metas e hábitos”; verificar navegação e redirect para `/signin` sem sessão
- [x] 8.2 Rodar `npm run lint`, `npm test` e `npm run build` e verificar os três verdes (sem erro de prerender nas rotas com `[id]`)
- [ ] 8.3 Aplicar `npm run db:migrate` no banco real e smoke test: login → criar meta com área/horizonte → próximo passo opcional → criar dois hábitos → ver lista do dia
  - Migrate real OK (`goal`, `habit`, `habit_area`, `next_step` existem). Falta só smoke no browser.
