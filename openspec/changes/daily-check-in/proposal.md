## Why

A tela `/app/check-in` só lista os hábitos do dia e não grava nada. Sem um check-in por data, o núcleo diário da Fase 1 não existe: o usuário não registra hábitos, nota nem humor, e não consegue lançar um dia passado. O aceite desta fatia é um registro em menos de cinco minutos, parcial, sem tratar dia vazio como falha.

## What Changes

- Um `daily_check_in` por usuário e `entry_date` (calendário no fuso das preferências). `created_at` e `updated_at` em UTC, independentes da data do registro. Upsert não reescreve `created_at`.
- `PUT /api/check-ins/:date` faz upsert. `GET /api/check-ins/:date` e `GET /api/check-ins?from=&to=` leem. `DELETE /api/check-ins/:date` apaga o dia (check-in e logs daquela data). Apagar é opcional para o usuário: o fluxo de salvar não depende de delete.
- Template minimalista na UI: hábitos aplicáveis à data escolhida, com no máximo um `habit_log` por hábito e data; `general_note` opcional; humor opcional como inteiro 1–5. A escala numérica já está no preview; emoji não é um segundo valor gravado.
- Salvar sem preencher tudo. Hábito omitido ou “sem registro” não vira linha e não conta como “não realizado”. Dia sem check-in e sem logs permanece neutro: a interface não o classifica como falha.
- Retroativo: o usuário escolhe `entry_date` diferente de hoje, vê o que já existe nessa data e salva mantendo essa data. Data futura é rejeitada. A UI deixa claro que a data não é hoje.
- Campos do template detalhado (gratidão, aprendizados, reflexão livre) não entram na UI nem no contrato desta fatia. A preferência `journal_template` continua `minimal` e sem seletor novo.

## Capabilities

### New Capabilities

- `check-ins`: check-in diário mínimo por data, logs de hábito do dia, nota e humor opcionais, leitura por data ou intervalo, upsert, exclusão opcional e lançamento retroativo sem linguagem de culpa.

### Modified Capabilities

<!-- Nenhuma. `habits` continua dono da definição e da lista de hábitos; o check-in só consome `listHabitsForDate` para a data escolhida. `user-preferences` já guarda fuso e template `minimal`. `data-isolation` já exige teste A/B em cada entidade nova; os cenários ficam em `check-ins`. -->

## Impact

- Banco: tabelas `daily_check_in` e `habit_log` (FKs para `user` e `habit`); migração Drizzle aditiva. Sem colunas de gratidão, aprendizados ou reflexão nesta fatia.
- API nova em `src/app/api/check-ins/`; feature `src/features/check-ins/**` no padrão domain / application / infra. A página `/app/check-in` deixa de ser preview e passa a ler e gravar pela mesma camada.
- Reusa `listHabitsForDate`, `requireUserId()` e o fuso em `user_preference`. Não altera CRUD de hábitos, metas, áreas nem o seletor de template.
- Fora desta fatia: template detalhado, várias entradas do mesmo hábito no dia, hábitos tipados (treino, leitura, água como entidade própria), medicamentos, revisões, rascunho offline (RF-055), dashboard e gráficos.
