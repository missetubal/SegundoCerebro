## 1. Schema e migração

- [x] 1.1 Adicionar `daily_check_in` e `habit_log` em `src/shared/db/schema.ts` conforme `design.md` (FKs cascade, unique `(user_id, entry_date)` e `(user_id, habit_id, entry_date)`, índice de logs por data, sem colunas de gratidão/aprendizados/reflexão); rodar `npm run db:generate` e verificar que o SQL novo contém as duas tabelas e esses uniques
- [x] 1.2 Aplicar com `npm run db:migrate:test` e verificar que `npm test` continua verde nas suítes existentes

## 2. Domain

- [x] 2.1 Criar `src/features/check-ins/domain` com zod strict do PUT: `generalNote` até 2000 após trim (só espaços vira null), `mood` 1–5 ou null, `habitLogs` opcional com `completionStatus` `done|not_done`, `value` inteiro ≥ 0, ou `clear: true`; data `YYYY-MM-DD`; verificar com testes que humor 0/6, nota longa, chave `gratitude`/`learnings`/`freeReflection` e `userId` extra falham sem objeto parcial aceito

## 3. Infra

- [x] 3.1 Implementar `src/features/check-ins/infra/repository.ts`: `getCheckIn`, `listCheckIns` (intervalo inclusivo, só datas com linha ou log), `upsertCheckIn` (`on conflict` preserva `created_at`, `habitLogs` omitido não altera logs, `clear` apaga, batch Neon) e `deleteCheckIn`; verificar com testes no banco de teste o primeiro save, o segundo save com o mesmo `created_at`, quantidade 500 depois 750 num único log, e “sem registro” sem gravar `not_done`
- [x] 3.2 Rejeitar no upsert, antes do batch, hábito alheio, arquivado ou que não se aplica à data (`listHabitsForDate` / posse); verificar que nada da requisição é gravado e que a mensagem é neutra
- [x] 3.3 Teste de isolamento A/B: A não lê check-in nem log de B na mesma `entry_date`; save e delete de A deixam B intacto; hábito de B no PUT de A não grava

## 4. Application

- [x] 4.1 Funções de aplicação que leem `userId` só da sessão (`auth()` na API, `requireUserId()` na action da página), ignoram `userId` do cliente, resolvem “hoje” com `calendarDateInTimeZone` e rejeitam data futura; server action de salvar/apagar com mensagens pt-BR sem culpa; verificar com teste que data futura não grava e que save só com humor persiste

## 5. API

- [x] 5.1 `GET`/`PUT`/`DELETE` em `src/app/api/check-ins/[date]/route.ts` e `GET` em `src/app/api/check-ins/route.ts`, com `params` awaited (guia de Route Handlers em `node_modules/next/dist/docs/`); sem sessão retorna 401 e não chama `requireUserId()`; dia vazio retorna 200 com nota/humor null e `habitLogs: []`; delete sem dados retorna 204; intervalo `from > to` ou maior que 366 dias retorna 400 sem dias “falha”; verificar com testes dos handlers

## 6. UI `/app/check-in`

- [x] 6.1 Trocar o preview por formulário: data default hoje, `?date=` para retroativo, hábitos do dia (feito / não realizado / sem registro, quantidade numérica única), nota e humor 1–5 opcionais, um botão Salvar; remover toggle Detalhado e o aviso “Em breve”; manter texto de que em branco permanece neutro; verificar no browser que salvar só o humor grava, recarregar mantém o humor, e hábitos em sem registro continuam sem registro
- [x] 6.2 Seletor de data passada com aviso visível, carga da nota e dos logs daquele dia, e save que não muda a `entry_date`; data futura na URL não grava e mostra mensagem neutra; log de hábito que saiu da lista do dia aparece só para consulta ou limpeza; verificar no browser o fluxo de ontem e o redirect para `/signin` sem sessão
- [x] 6.3 “Apagar este dia” discreto, só quando já há dados, reusando o confirm do app; após apagar, o dia volta a sem registro e não aparece como falha; verificar no browser que salvar não exige apagar

## 7. Fechamento

- [x] 7.1 Confirmar no browser o caminho mínimo (um hábito ou só nota, menos de cinco minutos de fluxo, sem campos detalhados) em viewport larga e estreita; rodar `npm test` e deixar a suíte de check-ins verde no banco de teste
