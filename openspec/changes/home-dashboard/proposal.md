## Why

`/app` já saúda a pessoa e lista áreas, metas e hábitos do dia, mas o check-in aparece fixo como “Ainda não”, medicamentos como “Em breve”, e os dois atalhos caem no mesmo `/app/check-in` sem data passada. Abrir o app não responde, em poucos segundos, o que falta hoje. O aceite é: ao abrir, dá para ver o que falta hoje em menos de dez segundos, sem linguagem de culpa.

## What Changes

- A home passa a mostrar, no primeiro bloco visível no celular, o estado do check-in de hoje (feito ou ainda sem registro), os hábitos de hoje ainda sem registro e os medicamentos de hoje ainda pendentes.
- Hábito com log (feito ou não realizado) sai da lista de pendentes. Medicamento com log sai da lista de pendentes. Contagem de “ativos no dia” deixa de ocupar o lugar do que falta.
- Dois links distintos: check-in de hoje (`/app/check-in`) e um dia anterior (`/app/check-in?date=` de ontem no fuso do usuário). Outras datas passadas continuam no seletor que o check-in já tem.
- Linguagem sem culpa: “ainda sem registro” e “pendente”, nunca atraso, falha ou cobrança. Dia vazio não vira zero punitivo.
- Layout mobile-first desse bloco: empilhado, alvos de toque usáveis, sem exigir rolar a página inteira para saber o que falta. O restante da home (metas, áreas, próximos passos) permanece abaixo.
- Depende do change `medications` para a lista de pendências de tomada. Se não houver medicamento cadastrado, o bloco de meds explica que dá para cadastrar, sem tratar isso como falta.

## Capabilities

### New Capabilities

- `home-dashboard`: resumo fixo de hoje na home — check-in feito ou não, hábitos pendentes, medicamentos pendentes — com links para o check-in de hoje e para um dia anterior, em layout mobile-first e linguagem sem culpa.

### Modified Capabilities

<!-- Nenhuma. `habits` segue dono da definição e de “aplicável ao dia”; esta capability só lê quem ainda não tem log. Check-in e medicamentos não estão em `openspec/specs/` (changes `daily-check-in` e `medications`); a home consome esses dados sem alterar o contrato de salvamento. `dashboard_preferences` não existe e não entra aqui. -->

## Impact

- `src/app/app/page.tsx` e os cards da home em `src/features/shell` (e leitura de hábitos/check-in/medicamentos já existentes). Os tiles “Ainda não” e “Em breve” deixam de ser texto fixo.
- Sem tabela nova e sem API nova: a home lê no servidor, com `userId` da sessão, o check-in de hoje, os hábitos aplicáveis sem `habit_log` e as ocorrências de medicamento sem `medication_log`.
- Fora desta fatia: dashboard configurável, gráficos, revisões, reordenar o app inteiro e lembretes. A Fase 4 do roadmap (componentes escolhidos pelo usuário) continua futura.
