## 1. Data de ontem

- [ ] 1.1 Adicionar `addCalendarDays` em `src/shared/lib/calendar.ts` (soma civil em UTC meio-dia, como `isoWeekdayFromDateYmd`); verificar com teste a virada de mês (`2026-10-01` menos um dia = `2026-09-30`) e que o dia da semana não muda de forma inesperada

## 2. Resumo puro

- [ ] 2.1 Implementar `summarizeToday` no shell: check-in registrado só com `createdAt`; hábito pendente = aplicável sem log (quantidade 0 conta como registrado); medicamento pendente = ocorrência `pending`; corte em cinco com “e mais N no check-in”; sem cadastro de medicamento não vira contagem de falha; verificar com testes esses casos e que o texto não contém “falha”, “atraso”, “atrasado” nem “você não fez”

## 3. Home

- [ ] 3.1 Montar `TodaySummary` e colocá-lo em `/app` logo após a saudação, antes de metas, áreas e próximos passos; dados só de `requireUserId()` via `getCheckIn`, `listHabitsForDate` e `listOccurrencesForDate` (change `medications`); links `/app/check-in` e `/app/check-in?date=` de ontem; tirar os dois atalhos duplicados do header e os tiles fixos “Ainda não” e “Em breve”; copy de `design.md`; links com alvo de toque ≥ 44px e coluna única abaixo de `sm`; verificar no teste da página ou do componente que ontem em `2026-10-19` aponta para `2026-10-18` e que um hábito `not_done` não entra na lista

## 4. Fechamento

- [ ] 4.1 No browser, viewport 390px e larga: com check-in ausente, um hábito sem registro e uma tomada pendente, esses três fatos e os dois links aparecem antes dos cards de metas e áreas, sem rolagem horizontal e sem linguagem de culpa; rodar `npm test` da suíte nova
