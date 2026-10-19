## Context

Ver proposal.md — Why. A home em `src/app/app/page.tsx` já cumprimenta e lista hábitos do dia, metas, próximos passos e áreas, mas os blocos de check-in e medicamento são texto fixo. `HabitsTodayCard` marca todo hábito como “sem registro” em laranja, sem olhar o log. O check-in real vive em `getCheckIn`; a ocorrência do dia, em `listOccurrencesForDate`; o hábito aplicável, em `listHabitsForDate`. O fuso vem de `getPreferences`. A tela `/app/check-in?date=` já abre uma data passada. O layout de `/app` coloca `AppSidebar` (largura fixa `w-56`) ao lado do conteúdo em qualquer viewport.

## Goals / Non-Goals

**Goals:**

- Derivar o snapshot de hoje em função pura, testável sem banco.
- A home só compõe leituras que já filtram por `userId` da sessão.
- No viewport estreito, a navegação vira faixa compacta e o status do dia fica no início do fluxo.

**Non-Goals:**

- Endpoint novo, tabela nova, widget configurável, gráfico, revisão.
- Mudar a regra de pendência de hábito ou medicamento.
- Filtrar medicamento pelo relógio (pendente o dia inteiro continua em aberto, não “atrasado”).

## Decisions

1. **Snapshot puro em `src/features/home/domain`.** Entrada: check-in existe ou não, hábitos do dia, logs do dia, ocorrências. Saída: check-in feito, hábitos sem log, ocorrências com status `pending` e `orphan: false`. A página busca os três reads em paralelo depois de resolver “hoje” no fuso. Alternativa: calcular na query SQL. Rejeitada: a regra já está nas leituras existentes; duplicar filtro no banco não acrescenta isolamento.

2. **Check-in feito = linha do dia (`createdAt` presente).** Ausência da linha é “em aberto”, não erro. Hábito pendente = id aplicável ausente em `habitLogs`. Medicamento pendente = ocorrência não órfã com status `pending`. Realizado e não realizado saem da lista.

3. **Ontem por calendário, não por instante.** `shiftCalendarDate(today, -1)` em `src/shared/lib/calendar.ts`, meio-dia UTC, para o link `/app/check-in?date=<ontem>`. A página de check-in já avisa quando a data não é hoje. Alternativa: abrir o check-in sem data e pedir para o usuário voltar um dia. Rejeitada: o atalho precisa cair no dia anterior.

4. **Shell.** Abaixo de `md`, `AppSidebar` mostra só uma faixa horizontal com os destinos principais (Início, Check-in, Hábitos, Medicamentos, Metas). A coluna `w-56` fica em `md+`. O bloco “hoje” entra logo após o cumprimento, antes de metas e áreas. Cards secundários permanecem. `HabitsTodayCard` deixa de pintar ausência em laranja; usa o mesmo fato “registrado / em aberto”.

5. **Copy.** “Feito”, “Em aberto”, “Nada pendente para hoje”, “Nenhum hábito previsto hoje”, “Nenhum medicamento previsto hoje”. Sem dose e sem verbo de conduta.

## Risks / Trade-offs

- [Faixa mobile esconde áreas e horizontes] → Continuam na coluna `md+` e nas rotas já existentes (`/app/areas`, `/app/horizons`). A faixa leva aos destinos do dia.
- [Check-in “feito” com hábitos ainda em aberto] → Os três fatos ficam separados. Salvar o dia não apaga a lista do que ainda não tem log.
- [Muitos itens no dia] → Lista simples, sem paginação. Volume pessoal cabe na primeira dobra melhor do que um número sem nome.

## Migration Plan

Sem migração. Rollback é reverter a página e o shell. Dados existentes não mudam.

## Open Questions

Nenhuma. O atalho retroativo abre ontem; outra data passada continua no seletor do check-in.
