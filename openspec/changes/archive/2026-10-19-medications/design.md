## Context

Ver `proposal.md` (Why) e `specs/medications/spec.md`. Estado que muda o desenho:

- Não existem tabelas `medication` nem `medication_log`. Hábitos já guardam frequência em colunas (`frequency_kind`, `weekdays`), não em JSON.
- `/app/check-in` já salva o dia num botão só, via server action, com hábitos aplicáveis à `entry_date`. A API de check-in não conhece medicamento.
- `requireUserId()` redireciona para `/signin`. Route Handler JSON usa `auth()` e responde 401.
- Driver `neon-http`: sem transação interativa; várias escritas vão em `db.batch`.
- `cacheComponents` está ligado. Leitura por sessão não pode ir para cache compartilhado.
- Route Handlers no Next 16 recebem `params` como `Promise`.

## Goals / Non-Goals

**Goals:**

- Feature `medications` no mesmo corte das outras, com Route Handlers finos.
- Agenda em colunas, validada, sem campo de dose.
- Uma linha de log por ocorrência; pendente é ausência de linha.
- A lista do check-in marca tomadas no mesmo salvamento do dia, chamando a feature de medicamentos.

**Non-Goals:**

- Estender o `PUT /api/check-ins/:date` com medicamentos.
- Lembrete, dose estruturada, intervalo “a cada N horas”, data de fim e aconselhamento.
- A home. Isso é o change `home-dashboard`.

## Decisions

### 1. Feature, páginas e HTTP

- Código em `src/features/medications/**` (`domain`, `application`, `infra`, `presentation`, `server.ts`).
- Páginas: `/app/medications`, `/app/medications/new`, `/app/medications/[id]/edit`. Link “Medicamentos” na sidebar, no grupo de Hábitos e Check-in.
- HTTP:
  - `src/app/api/medications/route.ts` — `GET`, `POST`
  - `src/app/api/medications/[id]/route.ts` — `PATCH`, `DELETE`
  - `src/app/api/medication-logs/route.ts` — `GET` com `date` ou com `from` e `to`, nunca os dois
  - `src/app/api/medication-logs/[date]/route.ts` — `PUT`
- `params` é `Promise`; aguardar antes de usar. Conferir o guia em `node_modules/next/dist/docs/` na implementação.
- Handler sem sessão: `auth()` e 401 `{ "error": "unauthorized" }`. Não chamar `requireUserId()` no handler. Página usa `requireUserId()`.
- Alternativa rejeitada: medicamentos só dentro do check-in, sem CRUD próprio. O aceite pede cadastrar o medicamento, e a lista do dia só consome o que já está ativo.

### 2. Schema

```
medication(
  id, user_id FK→user cascade,
  name text not null,
  instructions text null,
  frequency_kind text not null,       -- daily | weekdays
  weekdays integer[] null,
  times text[] not null,              -- HH:mm, 1..6
  starts_on date not null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
medication_log(
  id, user_id FK→user cascade,
  medication_id FK→medication cascade,
  entry_date date not null,
  scheduled_time text not null,       -- HH:mm de referência
  status text not null,               -- done | not_done
  taken_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, medication_id, entry_date, scheduled_time)
)
```

- Sem colunas `dose_amount`, `dose_unit`, `prescribed_dose` ou equivalentes.
- Agenda em colunas, no mesmo modelo de `habit`. Alternativa rejeitada: `jsonb schedule_config`. Um blob aceitaria forma inválida e fugiria do padrão já testado de frequência.
- Índice `(user_id, archived_at)` em `medication` e `(user_id, entry_date)` em `medication_log`.
- `DELETE` do medicamento cai em cascade nos logs.

### 3. Contrato

`POST` e `PATCH` em camelCase, zod `.strict()`:

```json
{
  "name": "Losartana",
  "instructions": "anotação da pessoa ou null",
  "frequencyKind": "daily",
  "weekdays": null,
  "times": ["08:00", "20:00"],
  "startsOn": "2026-10-19"
}
```

- `startsOn` omitido no `POST`: dia corrente no fuso do usuário.
- Chave desconhecida, inclusive `doseAmount`, `doseUnit`, `prescribedDose` e `userId`: 400 e nada gravado.
- `GET /api/medications`: `{ "active": [...], "archived": [...] }`.
- `GET /api/medication-logs?date=YYYY-MM-DD`: ocorrências do dia, cada uma com `medicationId`, `name`, `scheduledTime`, `status` (`done` | `not_done` | `pending`) e `takenAt`. `pending` não tem linha. Inclui log órfão (horário que saiu da agenda, ou medicamento arquivado) só para ver ou limpar.
- `GET /api/medication-logs?from=&to=`: só linhas gravadas. `from > to`, data inválida, intervalo maior que 366 dias, ou `date` junto com `from`/`to`: 400.
- `PUT /api/medication-logs/:date`:

```json
{
  "logs": [
    { "medicationId": "…", "scheduledTime": "08:00", "status": "done" },
    { "medicationId": "…", "scheduledTime": "20:00", "status": "pending" }
  ]
}
```

- `pending` apaga a linha. Item omitido não mexe no log já salvo. A tela envia todas as ocorrências visíveis.
- Status `done` grava `taken_at = now()` UTC. `not_done` grava `taken_at` nulo. Upsert não reescreve `created_at`.
- Data futura, ocorrência que não se aplica, id alheio ou arquivado sem log prévio: 400 do pedido inteiro, sem gravar parte.
- Mensagem de validação para a pessoa em pt-BR e neutra. Erro de desenvolvedor e teste em inglês.

### 4. Quem entra no dia

- Ativo, `entry_date >= starts_on`, data não futura, e o dia da semana cai na agenda (`isoWeekdayFromDateYmd`).
- Arquivado, ou horário que não está mais em `times`: não gera ocorrência nova. Se já existe log nessa data e horário, a tela mostra como registro já salvo, com limpar (pendente) ou manter. Sem controle para criar outro horário.
- Mudar `times` não apaga logs.

### 5. Check-in

- A página `/app/check-in` pede `listOccurrencesForDate` e renderiza um grupo “Medicamentos” abaixo dos hábitos, com três estados: Realizado, Não realizado, Pendente. Sem input de dose.
- Texto fixo no grupo: organização, o app não interpreta anotação nem orienta conduta.
- O formulário continua com um botão Salvar. A action do check-in valida nota, humor, hábitos e marcas de medicamento antes de escrever. Em seguida grava o check-in e chama `saveMedicationDay` na feature de medicamentos.
- O `PUT` de check-in não ganha campo novo. Cliente de API marca tomada no `PUT` de medication-logs.
- Alternativa rejeitada: segundo botão só de medicamentos. O aceite é marcar no fluxo do dia, e o check-in já tem um salvamento único.
- `db.batch` separado por feature. Sem transação entre as duas. Validar os dois lados antes; se a validação de medicamento falha, não grava nenhum dos dois.

### 6. Isolamento e testes

- Toda query filtra `user_id` da sessão.
- Sem `use cache` nessas leituras.
- Testes de domain: nome, instruções, agenda, dose rejeitada, data.
- Testes de repositório no banco de teste, usuários A e B: CRUD, ocorrência antes de `starts_on`, dia da semana, upsert que preserva `created_at`, pendente apaga, órfão, isolamento.
- Testes dos handlers: 401, 400 de dose e de data futura, dia sem log com pendentes, intervalo sem dia vazio.

## Risks / Trade-offs

- [Dois batches, check-in e medicamentos] → Validar tudo antes. Se o segundo batch falhar depois do primeiro, o check-in fica salvo e a action devolve erro para tentar de novo. Uso pessoal; não introduzir transação que o driver não tem.
- [PUT de logs omisso não apaga o que faltou] → A tela manda a lista visível. O contrato da API fica explícito para não limpar o dia por engano.
- [`taken_at` muda a cada novo “realizado”] → É o instante da última marcação, não o horário de referência. O horário da agenda continua em `scheduled_time`.
- [Cache Components vazar medicamento] → Sem `use cache`. Leitura atrás de `auth()` / Suspense.
- [Arquivar esconde ocorrência não marcada] → Igual a hábito arquivado. Log já gravado continua visível naquela data.

## Migration Plan

- Migração Drizzle aditiva (`npm run db:generate`, aplicar no banco de teste com `npm run db:migrate:test`). Sem backfill.
- Deploy: tabelas novas primeiro. A página de check-in antiga ignora medicamento até o código novo.
- Rollback de código: check-in volta a só hábitos; tabelas podem ficar. Rollback de schema, se preciso: `drop table medication_log, medication`.

## Open Questions

Nenhuma que mude spec, abordagem ou tarefas. Pendente continua sendo ausência de linha, não um terceiro valor gravado.
