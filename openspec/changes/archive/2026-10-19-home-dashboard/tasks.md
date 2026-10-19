## 1. Calendário e snapshot

- [x] 1.1 Adicionar `shiftCalendarDate` em `src/shared/lib/calendar.ts` e verificar com teste a véspera, a virada de mês e a virada de ano
- [x] 1.2 Criar `buildTodaySnapshot` em `src/features/home/domain` e verificar com teste: check-in ausente não é feito; hábito com log sai da lista; medicamento `done` ou `not_done` sai da lista; ocorrência órfã não entra; pendente devolve nome e horário

## 2. Home

- [x] 2.1 Montar em `/app` o bloco de hoje com os três fatos, a lista do que está em aberto e os links `/app/check-in` e `/app/check-in?date=<ontem>`, copy neutra, antes de metas e áreas; `HabitsTodayCard` deixa de marcar ausência em laranja
- [x] 2.2 No viewport abaixo de `md`, trocar a coluna `w-56` por faixa horizontal com Início, Check-in, Hábitos, Medicamentos e Metas, e manter a coluna em `md+`

## 3. Verificação

- [x] 3.1 Rodar `openspec validate --change home-dashboard` e `npm test` nos testes novos do calendário e do snapshot
