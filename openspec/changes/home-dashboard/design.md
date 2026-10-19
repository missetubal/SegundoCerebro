## Context

Ver `proposal.md` (Why) e `specs/home-dashboard/spec.md`. Estado que muda o desenho:

- `/app` já monta a home em `HomeDashboard`: saudação, dois links que caem os dois em `/app/check-in`, tiles com “Ainda não” e “Em breve” fixos, depois hábitos do dia, metas, próximos passos e áreas.
- Check-in de uma data já sai de `getCheckIn`. Sem linha e sem log, `createdAt` vem nulo. Com linha, `createdAt` vem preenchido. `habitLogs` traz o que foi registrado.
- `listHabitsForDate` devolve os hábitos ativos aplicáveis à data, não os pendentes.
- Ocorrência de medicamento com status `pending` | `done` | `not_done` entra no change `medications` (`listOccurrencesForDate`). Esta home só lê.
- Fuso e “hoje” já usam `calendarDateInTimeZone`. Não há helper de “ontem”.
- `cacheComponents` ligado. A home já lê atrás de `requireUserId()` e `Suspense`.

## Goals / Non-Goals

**Goals:**

- Um bloco `TodaySummary` no topo, com estado do check-in, nomes pendentes e os dois links.
- Função pura que separa pendente de já registrado, testável sem browser.
- Ontem calculado no fuso do usuário.

**Non-Goals:**

- Tabela, API ou preferência de dashboard.
- Mudar o contrato de salvamento de check-in ou de medicamento.
- Reestilizar metas, áreas, hábitos e check-in além do que a home precisa para o bloco caber no celular.

## Decisions

### 1. Onde vive

- Componente `TodaySummary` em `src/features/shell/presentation/today-summary.tsx`. A página `/app` continua server component e só passa dados já filtrados pelo `userId` da sessão.
- Função pura `summarizeToday` ao lado, em `src/features/shell/domain/today-summary.ts` (ou `src/shared` se o shell não tiver `domain`). Entrada: se o check-in tem linha, hábitos aplicáveis com flag de log, ocorrências do dia. Saída: textos e listas já cortadas em cinco.
- Alternativa rejeitada: feature `home` nova. A home já é composição no shell; um módulo a mais não muda o comportamento.

### 2. O que é “feito” e o que é pendente

- Check-in registrado hoje se e só se `getCheckIn(userId, today).createdAt` não é nulo. Log de hábito ou de medicamento sem linha de check-in não conta como check-in feito.
- Hábito pendente: está em `listHabitsForDate` e o id não está em `habitLogs` dessa data. Log de quantidade, inclusive valor 0, conta como registrado. `done` e `not_done` também.
- Medicamento pendente: ocorrência com `status === "pending"`. `done` e `not_done` ficam de fora. Sem ocorrência no dia: estado “nada para organizar”, com link `/app/medications`, não uma contagem.
- Depende de `listOccurrencesForDate` do change `medications`. Aplicar esta change depois daquela.

### 3. Ontem

- Novo `addCalendarDays(dateYmd, delta)` em `src/shared/lib/calendar.ts`. Soma dias civis em UTC meio-dia, a mesma âncora de `isoWeekdayFromDateYmd`, para não pular dia em horário de verão. A home usa `addCalendarDays(today, -1)` no href `/app/check-in?date=`.
- O seletor do check-in segue como caminho para outras datas passadas. Esta change não cria outra tela retroativa.

### 4. Ordem e copy

- Ordem na página: saudação e data, `TodaySummary`, atalhos que já existem (`HomeQuickActions`), depois os cards atuais de hábitos, metas, próximos passos e áreas.
- Tirar do header os dois links que hoje apontam para o mesmo lugar. Sair continua no header.
- Os tiles “Ainda não” e “Em breve” saem. Contagem de hábitos ativos e de metas ativas não ocupa o lugar do que falta; se permanecer, fica abaixo do resumo.
- Copy do bloco, pt-BR, sem “falha”, “atraso”, “atrasado” ou “você não fez”:
  - “Check-in de hoje registrado” / “Check-in de hoje ainda sem registro”
  - hábitos: nomes, ou “Nenhum hábito para hoje”, ou “Hábitos de hoje já registrados”
  - meds: “Nome · 08:00”, ou “Tomadas de hoje já marcadas”, ou “Nenhum medicamento para organizar hoje”
  - links: “Fazer check-in de hoje”, “Preencher dia anterior”, e “Cadastrar medicamento” só no estado sem cadastro
- Acima de cinco pendências: os cinco primeiros nomes e “e mais N no check-in”.

### 5. Mobile

- Coluna única no bloco. Links com área de toque de pelo menos 44px e largura total abaixo de `sm`.
- Sem largura mínima que force rolagem horizontal em 390px. Confirmar no browser, viewport estreita e larga: os três fatos e os dois links aparecem antes dos cards de metas e áreas.

### 6. Testes

- Unidade de `addCalendarDays` na virada do mês.
- Unidade de `summarizeToday`: check-in com e sem `createdAt`; hábito feito, não realizado e sem log; ocorrência `pending` contra `done`; corte em cinco; ausência de cadastro sem contagem de falha; as strings proibidas não aparecem.
- Isolamento: a página só chama `getCheckIn`, `listHabitsForDate` e `listOccurrencesForDate` com o `userId` de `requireUserId()`. Não há parâmetro de usuário vindo do cliente. Os testes A/B dessas funções cobrem o dado; o teste da home cobre a regra de pendência em cima de listas já do usuário.

## Risks / Trade-offs

- [Home quebra se `medications` não estiver aplicada] → Tarefas desta change assumem `listOccurrencesForDate`. Não duplicar a query de ocorrência aqui.
- [`createdAt` nulo com logs de hábito parece “sem check-in”] → É o que o spec pede: check-in é a linha do dia. Os hábitos já marcados saem da lista de pendentes mesmo assim.
- [Cinco nomes escondem o resto] → O sexto em diante continua no check-in, com a contagem “e mais N”. O bloco permanece curto o bastante para ler em menos de dez segundos.
- [Cache Components misturar o resumo] → Sem `use cache` no resumo. Mesmo `Suspense` que a home já usa.

## Migration Plan

- Sem migração. Só código de leitura e um helper de data.
- Rollback: voltar `src/app/app/page.tsx` e o componente novo. Nenhum dado para desfazer.

## Open Questions

Nenhuma que mude spec, abordagem ou tarefas. O tile de áreas e metas pode continuar abaixo do resumo; não faz parte do “o que falta hoje”.
