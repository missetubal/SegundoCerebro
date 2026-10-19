## Why

A home em `/app` ainda mostra check-in e medicamentos como texto fixo e trata todo hábito do dia como “sem registro”. Quem abre o app não vê, de imediato, o que falta hoje. O aceite desta fatia é saber isso em menos de dez segundos, em linguagem neutra, no celular.

## What Changes

- A home passa a mostrar o check-in de hoje como feito ou em aberto, os hábitos de hoje ainda sem log e os medicamentos de hoje ainda pendentes.
- Dois atalhos visíveis: check-in de hoje e registro de um dia anterior (data de ontem no fuso do usuário).
- A composição é mobile-first: no viewport estreito a navegação não empurra o status do dia para baixo da dobra.
- Copy visível trata ausência como neutra. Sem “falha”, “esqueceu” ou alerta visual para item em aberto.
- Sem API nova, gráfico, widget configurável, lembrete ou aconselhamento de medicamento.

## Capabilities

### New Capabilities

- `home-dashboard`: leitura do dia corrente na home — status do check-in, hábitos e medicamentos em aberto, atalhos de check-in e retroativo, layout mobile-first e linguagem sem culpa.

### Modified Capabilities

<!-- Nenhuma. `check-ins`, `habits` e `medications` continuam donos da gravação e das regras de pendência. A home só lê o dia de hoje no fuso do usuário. -->

## Impact

- Página `/app` e o shell (`AppSidebar` / layout de `/app`). Reusa `getCheckIn`, `listHabitsForDate` e `listOccurrencesForDate` com o `userId` da sessão.
- Sem migração, sem rota nova e sem mudança de contrato das APIs existentes.
- Fora desta fatia: dashboard personalizável, histórico, gráficos, revisões e template detalhado do check-in.
