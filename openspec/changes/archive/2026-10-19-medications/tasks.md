## 1. Schema e migração

- [x] 1.1 Adicionar `medication` e `medication_log` em `src/shared/db/schema.ts` conforme `design.md` (FKs cascade, agenda em colunas, `times`, `starts_on`, unique de log por usuário/medicamento/data/horário, sem coluna de dose); rodar `npm run db:generate` e verificar que o SQL novo contém as duas tabelas e esse unique
- [x] 1.2 Aplicar com `npm run db:migrate:test` e verificar que `npm test` continua verde nas suítes existentes

## 2. Domain

- [x] 2.1 Criar `src/features/medications/domain` com zod strict do cadastro e do `PUT` do dia: nome 1–80 após trim, instruções até 2000 (só espaços vira null), `frequencyKind` `daily|weekdays`, 1–6 horários `HH:mm` distintos, `startsOn` opcional `YYYY-MM-DD`, status `done|not_done|pending`; verificar com testes que dose (`doseAmount`, `doseUnit`, `prescribedDose`), `userId` extra, horário repetido, sétimo horário, dias vazios e nome em branco falham sem objeto parcial aceito

## 3. Infra

- [x] 3.1 Implementar repositório: criar, listar ativos/arquivados, editar, arquivar, reativar, excluir em cascade, `listOccurrencesForDate` e `saveMedicationDay` (upsert preserva `created_at`, `pending` apaga, `done` grava `taken_at`, `not_done` deixa `taken_at` nulo, item omitido não altera log); verificar no banco de teste dois horários no mesmo dia, segunda marcação com o mesmo `created_at`, e pendente sem linha `not_done`
- [x] 3.2 Rejeitar antes do batch data futura, medicamento alheio, arquivado sem log prévio, data anterior a `starts_on` e dia fora da agenda; ocorrência órfã (horário removido ou arquivado com log) só volta a pendente ou permanece; verificar que a requisição inválida não grava nada
- [x] 3.3 Teste de isolamento A/B: A não lê nem altera medicamento ou log de B na mesma data e horário; delete de A deixa B intacto

## 4. Application

- [x] 4.1 Funções que leem `userId` só da sessão (`auth()` na API, `requireUserId()` na página), ignoram `userId` do cliente e preenchem `startsOn` omitido com `calendarDateInTimeZone`; mensagens de formulário em pt-BR, neutras, sem aconselhamento; verificar com teste que o default de `startsOn` é o dia corrente do fuso e que corpo com dose não cria linha

## 5. API

- [x] 5.1 `GET`/`POST /api/medications`, `PATCH`/`DELETE /api/medications/:id`, `GET /api/medication-logs` e `PUT /api/medication-logs/:date`, com `params` awaited (guia de Route Handlers em `node_modules/next/dist/docs/`); sem sessão retorna 401 e não chama `requireUserId()`; dia sem log retorna ocorrências `pending`; intervalo devolve só logs e rejeita `from > to`, mistura com `date` ou vão maior que 366 dias; verificar com testes dos handlers

## 6. UI de cadastro

- [x] 6.1 Páginas `/app/medications`, `/new` e `/[id]/edit`, mais o link “Medicamentos” na sidebar: nome, anotações livres com texto de que o app não interpreta, agenda diária ou dias da semana, até seis horários, início; sem campo de dose; arquivar, reativar e excluir; verificar no browser cadastrar “Losartana” às 08:00, reler, editar o horário e arquivar

## 7. Lista do dia

- [x] 7.1 No `/app/check-in`, grupo Medicamentos na data escolhida (realizado / não realizado / pendente), um botão Salvar junto do check-in, validando os dois lados antes de gravar; data passada marca o log nessa data; copy só de organização; verificar no browser que marcar a tomada de hoje grava, recarregar mantém realizado, voltar a pendente apaga o log, e salvar só a nota continua possível

## 8. Fechamento

- [x] 8.1 Confirmar no browser o aceite (cadastrar, marcar a tomada de hoje, nenhum campo de dose) em viewport larga e estreita; rodar `npm test` e deixar a suíte de medicamentos verde no banco de teste
