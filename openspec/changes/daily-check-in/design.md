## Context

Ver `proposal.md` (Why) e `specs/check-ins/spec.md`. Estado que muda o desenho:

- `/app/check-in` é preview: lista `listHabitsForDate` de hoje, nota e humor 1–5 desabilitados, aviso “Em breve: salvar check-in”, e um toggle Minimalista/Detalhado só visual.
- Não existem tabelas `daily_check_in` nem `habit_log`. Hábitos já têm `tracking_type` `completion` | `quantity` e `listHabitsForDate(userId, dateYmd, timeZone)`.
- `requireUserId()` redireciona para `/signin`. Serve a página; não serve Route Handler JSON.
- Driver `neon-http`: sem transação interativa; várias escritas vão em `db.batch`.
- `cacheComponents` está ligado. Leitura de check-in é por sessão; não pode ir para cache compartilhado.
- Route Handlers no Next 16 recebem `params` como `Promise`.

## Goals / Non-Goals

**Goals:**

- Uma feature `check-ins` com a mesma camada das outras, e Route Handlers finos em cima dela.
- Upsert por `(user_id, entry_date)` que preserva `created_at`.
- Um `habit_log` por `(user_id, habit_id, entry_date)`.
- A página grava e relê pela mesma função que a API.

**Non-Goals:**

- Colunas ou payload de gratidão, aprendizados e reflexão.
- Vários logs do mesmo hábito no mesmo dia, rascunho offline, e gráfico de humor.
- Trocar `journal_template` ou implementar o template detalhado.

## Decisions

### 1. Feature e rotas

- Código em `src/features/check-ins/**` (`domain`, `application`, `infra`, `presentation`, `server.ts`).
- HTTP:
  - `src/app/api/check-ins/route.ts` — `GET` com `from` e `to`
  - `src/app/api/check-ins/[date]/route.ts` — `GET`, `PUT`, `DELETE`
- `params` é `Promise<{ date: string }>`; aguardar antes de usar. Conferir o guia em `node_modules/next/dist/docs/` na implementação.
- A página `/app/check-in` continua server component com `Suspense`. O formulário interativo fica em `presentation` e chama uma server action, que chama a mesma função de upsert/delete dos handlers. Assim a API é o contrato testável e o browser não faz `PUT` solto (Auth.js já protege server actions na origem).
- Alternativa rejeitada: a página só faz `fetch` ao próprio `PUT`. Duplicaria CSRF/origem e fugiria do padrão de actions do app.

### 2. Schema

```
daily_check_in(
  id, user_id FK→user cascade,
  entry_date date not null,
  general_note text null,
  mood integer null,             -- 1..5 ou null
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
)
habit_log(
  id, user_id FK→user cascade,
  habit_id FK→habit cascade,
  entry_date date not null,
  completion_status text null,   -- done | not_done; null se quantity
  value integer null,            -- só quantity, >= 0
  unit text null,                -- cópia da unidade do hábito na escrita
  created_at, updated_at,
  unique (user_id, habit_id, entry_date)
)
```

- Sem colunas `gratitude`, `learnings`, `free_reflection`.
- `unit` copiada no log para o valor antigo continuar legível se o hábito mudar depois.
- Índice `(user_id, entry_date)` em `habit_log` para o GET do dia e do intervalo.
- Alternativa rejeitada: vários logs por hábito/dia (modelo de água em `docs/04`). Esta fatia só tem um inteiro por hábito; várias entradas ficam para hábitos tipados.

### 3. Contrato JSON (camelCase)

`PUT /api/check-ins/:date` — a data do caminho é a única `entry_date`. Corpo:

```json
{
  "generalNote": "texto ou null",
  "mood": 3,
  "habitLogs": [
    { "habitId": "…", "completionStatus": "done" },
    { "habitId": "…", "value": 500 },
    { "habitId": "…", "clear": true }
  ]
}
```

- `generalNote` e `mood` ausentes no corpo contam como `null` neste PUT (o formulário manda o dia inteiro).
- `habitLogs` omitido: não mexe nos logs já salvos (permite corrigir só nota/humor por API).
- `habitLogs` presente: cada item faz upsert ou, com `clear: true`, apaga o log daquele hábito na data. Hábito que não está na lista não muda.
- Zod `.strict()`: `gratitude`, `learnings`, `freeReflection` ou chave desconhecida rejeitam o pedido inteiro, status 400, zero escrita.
- Humor fora de 1–5, nota acima de 2000, quantidade negativa, `completionStatus` inválido, data ruim: 400 e nada gravado.
- Hábito de outro usuário, arquivado, tipo trocado (conclusão com `value`, quantidade com `completionStatus`) ou que não cai na data: 400 do pedido inteiro, para não gravar metade. Mensagem neutra em pt-BR.
- Data futura comparada com `calendarDateInTimeZone(preferences.timezone)`: 400.
- Sucesso do PUT e do GET de uma data: 200 com o recurso. Dia sem linha e sem logs ainda é 200: `generalNote: null`, `mood: null`, `createdAt: null`, `habitLogs: []`. Não usar 404.
- `GET /api/check-ins?from&to`: 200 `{ "checkIns": [ ... ] }` só com datas que tenham linha de check-in ou algum log. Sem preencher dias vazios. `from > to` ou vão maior que 366 dias: 400.
- `DELETE`: 204 mesmo se já não havia dados. Apaga check-in e logs daquele usuário naquela data.
- Sem sessão na API: 401 `{ "error": "unauthorized" }`. Não chamar `requireUserId()` no handler — ele redireciona. Usar `auth()` e, se não houver `user.id`, retornar 401. A página segue com `requireUserId()`.

### 4. Upsert e `created_at`

- Check-in: `insert ... on conflict (user_id, entry_date) do update` de `general_note`, `mood`, `updated_at`. A cláusula de update não inclui `created_at`.
- Log: o mesmo em `(user_id, habit_id, entry_date)`, atualizando status ou valor/`unit`.
- `clear` é `delete` filtrado por `user_id` + `habit_id` + `entry_date`.
- Ordem no `db.batch`: upsert do check-in, deletes dos clears, upserts dos logs. Validar hábitos antes do batch; se um falhar, não escrever.
- Salvamento com nota, humor e logs todos vazios ainda grava a linha do check-in (o spec aceita). Isso não é “falha”: a UI não usa essa linha para culpar o dia. Dia nunca salvo continua sem linha.
- `userId` no JSON é ignorado pelo schema (chave extra cai no `.strict()` como 400, ou é omitida do tipo e descartada). Não há coluna vinda do cliente.

### 5. Tela

- `/app/check-in` e `/app/check-in?date=YYYY-MM-DD`. Sem `date`, hoje no fuso. `searchParams` é `Promise` no Next 16.
- Lista de hábitos: `listHabitsForDate` da data escolhida. Estado inicial de cada um vem dos logs: ausência = sem registro; `done` / `not_done`; quantidade preenchida ou input vazio (vazio = clear, `0` é valor gravado).
- Log cujo hábito não está mais na lista (arquivado ou frequência mudou) aparece como registro já salvo, só para ver ou limpar. Não oferece criar registro novo para hábito fora da lista.
- Um botão “Salvar”. O submit manda todos os hábitos visíveis (valor ou `clear`) mais nota e humor, para a tela e o banco coincidirem.
- Se `date` ≠ hoje, faixa visível de data passada. Seletor com máximo = hoje. Data futura na URL não grava e mostra mensagem neutra.
- Humor: cinco opções 1–5; escolher de novo o mesmo número limpa (null). Sem emoji persistido.
- Remover o toggle Detalhado e o aviso “Em breve”. Manter a frase de que em branco permanece neutro. Meta numérica do hábito pode aparecer como legenda; barra abaixo da meta não usa cor nem texto de falha.
- “Apagar este dia” só aparece se já existe check-in ou log, texto discreto, com o confirm já usado no app. Salvar não depende dele.
- Quantidade: um campo numérico, não uma fila de incrementos. O preview com “+250” não vira várias linhas.

### 6. Isolamento e testes

- Toda query leva `userId` da sessão no primeiro filtro (`ownedBy` / `where` explícito).
- Testes de repositório no banco de teste, usuários A e B: leitura, upsert, delete e hábito alheio.
- Testes de domain para limites (nota, humor, data, chave detalhada).
- Testes dos handlers: 401 sem sessão, 200 de dia vazio, 400 de data futura e de campo detalhado, upsert que preserva `created_at`.

## Risks / Trade-offs

- [PUT com `habitLogs` parcial deixa logs de fora intocados] → A tela sempre envia a lista visível. Documentar o omit no contrato para clientes da API não apagarem o dia sem querer.
- [Salvar tudo vazio cria linha] → Aceito pelo spec. O GET de intervalo pode incluir esse dia; o payload não traz status de falha. Copy da UI não trata a linha como fracasso.
- [`requireUserId` dentro do handler devolveria redirect HTML] → Handler usa `auth()` e 401.
- [Cache Components servir check-in de outro usuário] → Sem `use cache` nas leituras de check-in. Dados atrás de `auth()` / Suspense, no mesmo padrão da página atual.
- [Batch grande] → Uso pessoal, dezenas de hábitos. Se o batch do Neon estourar, falhar o pedido inteiro em vez de gravar pela metade.
- [Cópia de `unit` fica velha] → É o desejado para o registro histórico. A lista do dia mostra a unidade atual do hábito no input; o log guarda a da escrita.

## Migration Plan

- Migração Drizzle aditiva (`npm run db:generate`, aplicar no banco de teste com `npm run db:migrate:test`). Sem backfill.
- Deploy: tabelas novas primeiro; a página antiga só lê hábitos, então convive com as tabelas vazias até o código novo.
- Rollback de código: a página volta ao preview; as tabelas podem ficar. Rollback de schema, se preciso: `drop table habit_log, daily_check_in`.

## Open Questions

Nenhuma que mude spec, abordagem ou tarefas. Humor fica inteiro 1–5; emoji não é coluna.
