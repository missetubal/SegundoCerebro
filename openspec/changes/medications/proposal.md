## Why

O check-in do dia registra hábitos, nota e humor, mas não há onde cadastrar um medicamento nem marcar a tomada. Sem isso, a lista do dia fica incompleta e a home não tem o que mostrar como pendente. O aceite desta fatia é cadastrar um medicamento e marcar a tomada de hoje, só como organização — sem dose prescrita pelo sistema e sem aconselhamento.

## What Changes

- CRUD de `Medication`: nome, instruções em texto livre (o que a pessoa escreveu, sem interpretação) e `schedule_config` simples. Ativo ou arquivado. Sem campos de dose, unidade de dose ou posologia estruturada.
- `schedule_config` simples, no mesmo espírito da frequência de hábitos: diário ou dias da semana, mais um ou mais horários locais de referência (`HH:mm`). Cada horário numa data é uma ocorrência.
- `MedicationLog` por ocorrência e data. Realizado e não realizado gravam linha. Pendente é a ausência de linha: a interface mostra “pendente” e voltar a pendente apaga o log. Ausência não é falha.
- A data de início (`starts_on`) nasce como o dia corrente no fuso do usuário. Antes disso a ocorrência não entra na lista, para um cadastro de hoje não inventar tomadas em dias passados.
- Encaixe no fluxo do dia: em `/app/check-in`, na data escolhida, a lista mostra as ocorrências aplicáveis e a pessoa marca cada uma. O mesmo vale para data passada já coberta pelo check-in. Data futura continua rejeitada.
- Copy de organização apenas. A interface não recomenda, altera, interpreta dose, tratamento, horário médico nem interação.
- Suposição desta fatia: no máximo seis horários por medicamento; sem “a cada N horas”, sem lembrete e sem data de fim. Arquivar tira o medicamento das listas novas e preserva logs já gravados.

## Capabilities

### New Capabilities

- `medications`: cadastro do medicamento, agenda simples, log por ocorrência e data (realizado, não realizado ou pendente por ausência), marcação na lista do dia do check-in, e copy só de organização, sem dose prescrita pelo sistema.

### Modified Capabilities

<!-- Nenhuma. `habits` continua dono de hábitos genéricos e segue sem tipo “medicamento”. `data-isolation` já exige teste A/B por entidade nova; os cenários ficam em `medications`. `check-ins` ainda não está em `openspec/specs/` (change `daily-check-in`); o encaixe na lista do dia entra nesta capability, sem mudar nota, humor nem logs de hábito. -->

## Impact

- Banco: tabelas `medication` e `medication_log` (FKs para `user` e `medication`); migração Drizzle aditiva. Sem colunas de dose.
- Feature nova `src/features/medications/**` e rotas `/app/medications`. API em `src/app/api/medications/` e `src/app/api/medication-logs/`. A página `/app/check-in` passa a listar e gravar as ocorrências do dia pela camada de medicamentos, no mesmo salvamento do dia.
- Item “Medicamentos” na navegação (`app-sidebar`).
- Reusa `requireUserId()`, o fuso em `user_preference` e o padrão de data do check-in. Não altera CRUD de hábitos, metas, áreas nem o contrato de nota/humor.
- Fora desta fatia: lembretes, dashboard, gráficos, dose estruturada, interações e aconselhamento. A home que consome as pendências é o change `home-dashboard`.
