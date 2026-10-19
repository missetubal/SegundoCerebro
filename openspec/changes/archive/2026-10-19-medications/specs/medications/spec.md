## Purpose

Permite cadastrar medicamentos como lista pessoal de organização, com agenda simples e um registro por ocorrência e data, e marcar a tomada no fluxo do dia — sem dose prescrita pelo sistema e sem aconselhamento.

## ADDED Requirements

### Requirement: Cadastrar medicamento sem dose estruturada
O sistema SHALL permitir que o usuário autenticado crie um medicamento com nome obrigatório de 1 a 80 caracteres após trim, instruções opcionais e uma agenda simples. Instruções são texto livre de até 2000 caracteres após trim; só espaços MUST virar ausência. A agenda MUST ser diária ou por dias da semana (ISO, 1 = segunda a 7 = domingo, ao menos um dia) e MUST incluir de 1 a 6 horários locais distintos no formato `HH:mm`. O medicamento MUST nascer ativo. `starts_on` MUST ser uma data `YYYY-MM-DD`; se omitida, MUST ser o dia corrente no fuso das preferências. O sistema MUST NOT aceitar nem persistir dose, unidade de dose, posologia estruturada ou qualquer campo que o sistema preencha como prescrição. Um corpo com esses campos, nome vazio, horário inválido, mais de seis horários, horários repetidos, dias da semana vazios ou `userId` de outra pessoa MUST rejeitar a criação inteira, sem gravar parte.

#### Scenario: Cadastro mínimo
- **WHEN** o usuário cria "Losartana" com agenda diária no horário `08:00` e sem instruções
- **THEN** o medicamento fica ativo
- **AND** `starts_on` é o dia corrente no fuso do usuário
- **AND** nenhum campo de dose é gravado

#### Scenario: Instruções são texto opaco
- **WHEN** o usuário grava instruções "1 comprimido depois do café, anotação minha"
- **THEN** o sistema guarda esse texto exatamente como organização
- **AND** não infere quantidade, unidade nem conduta

#### Scenario: Corpo pede dose
- **WHEN** a criação envia `doseAmount`, `doseUnit` ou outro campo de dose prescrita
- **THEN** nenhum medicamento é criado

#### Scenario: Nome vazio
- **WHEN** o nome contém apenas espaços
- **THEN** nenhum medicamento é criado
- **AND** a interface pede um nome, em texto neutro

### Requirement: Ler, editar, arquivar e excluir
O sistema SHALL listar os medicamentos do usuário, separados em ativos e arquivados, e SHALL permitir editar nome, instruções, agenda e `starts_on`, arquivar, reativar e excluir. Arquivar MUST NOT apagar o medicamento nem os logs já gravados. Excluir MUST apagar o medicamento e os logs dele. Identificador de outro usuário MUST ser tratado como inexistente, sem alterar o dado alheio. A edição MUST obedecer as mesmas regras de nome, instruções, agenda e rejeição de dose da criação.

#### Scenario: Arquivar some da lista ativa
- **WHEN** o usuário arquiva "Losartana"
- **THEN** ele deixa de aparecer entre os ativos
- **AND** os logs já gravados permanecem
- **AND** pode ser reativado

#### Scenario: Excluir remove logs
- **WHEN** o usuário exclui um medicamento que já tem log
- **THEN** o medicamento e os logs dele deixam de existir
- **AND** medicamentos de outro usuário permanecem

#### Scenario: Id alheio
- **WHEN** a sessão de A envia PATCH ou DELETE com o id de um medicamento de B
- **THEN** nada de B muda
- **AND** a operação responde como não encontrado

### Requirement: Ocorrência por data e horário
Para uma `entry_date` no fuso do usuário, o sistema SHALL derivar uma ocorrência por horário da agenda quando o medicamento está ativo, a data é igual ou posterior a `starts_on`, a data não é futura, e a agenda inclui esse dia (diário, ou o dia da semana está na lista). Medicamento arquivado MUST NOT gerar ocorrência nova. Cada ocorrência é o par (medicamento, data, horário). Mudar a agenda depois MUST NOT apagar logs antigos; um log cujo horário saiu da agenda continua legível naquela data.

#### Scenario: Dois horários no mesmo dia
- **WHEN** "Losartana" é diária às `08:00` e `20:00` e o usuário abre o dia de hoje, com `starts_on` hoje ou antes
- **THEN** existem duas ocorrências nesse dia, uma para cada horário

#### Scenario: Dia da semana fora da agenda
- **WHEN** a agenda é só às segundas e a data, no fuso do usuário, é uma terça
- **THEN** essa data não ganha ocorrência desse medicamento

#### Scenario: Antes de starts_on
- **WHEN** `starts_on` é `2026-10-19` e o usuário abre `2026-10-18`
- **THEN** não há ocorrência nova nesse dia

#### Scenario: Arquivado não gera ocorrência nova
- **WHEN** o medicamento está arquivado e o dia não tem log
- **THEN** ele não entra na lista desse dia

### Requirement: Log realizado, não realizado ou pendente
O sistema SHALL guardar no máximo um `MedicationLog` por usuário, medicamento, `entry_date` e horário. Status gravado MUST ser apenas `done` (realizado) ou `not_done` (não realizado). Pendente MUST ser a ausência de log: a interface mostra pendente e MUST NOT classificar isso como falha. Marcar realizado ou não realizado MUST criar ou atualizar essa única linha. Voltar a pendente MUST apagar o log. Um segundo salvamento do mesmo par MUST atualizar a linha e preservar `created_at`. `taken_at` MUST ser o instante UTC em que o status passou a realizado, ou nulo quando o status é não realizado; o horário da agenda permanece o de referência e MUST NOT ser substituído por `taken_at`. Data futura, medicamento de outro usuário, ou ocorrência que não se aplica à data MUST ser rejeitada sem gravar.

#### Scenario: Marcar realizada
- **WHEN** o usuário marca a ocorrência `08:00` de hoje como realizada
- **THEN** existe um único log dessa ocorrência com status realizado
- **AND** `taken_at` é o instante UTC da marcação
- **AND** o horário de referência continua `08:00`

#### Scenario: Não realizado não é pendente
- **WHEN** o usuário marca a ocorrência como não realizada
- **THEN** existe um log com status não realizado
- **AND** `taken_at` fica ausente
- **AND** a ocorrência deixa de aparecer como pendente

#### Scenario: Voltar a pendente apaga o log
- **WHEN** existe um log e o usuário marca a mesma ocorrência como pendente
- **THEN** o log é apagado
- **AND** a interface volta a mostrar pendente
- **AND** o dia não é tratado como falha

#### Scenario: Data futura
- **WHEN** o usuário tenta gravar um log em data posterior a hoje no fuso dele
- **THEN** nada é gravado

### Requirement: Marcar a tomada no fluxo do dia
Na tela de check-in da data escolhida, o sistema SHALL listar as ocorrências de medicamento aplicáveis a essa data junto dos hábitos do dia, e SHALL permitir marcar cada uma como realizada, não realizada ou pendente. A marcação MUST valer para a `entry_date` selecionada, inclusive data passada. Omitir medicamentos MUST NOT impedir salvar nota, humor ou hábitos. A lista MUST NOT exibir campo de dose. Copy visível MUST apresentar o bloco como organização da pessoa e MUST NOT recomendar, ajustar, interpretar dose, tratamento, horário médico ou interação.

#### Scenario: Tomada de hoje no check-in
- **WHEN** o usuário abre o check-in de hoje e existe uma ocorrência pendente às `08:00`
- **THEN** essa ocorrência aparece na lista do dia com o horário
- **AND** ele consegue marcá-la como realizada sem preencher nota nem hábitos

#### Scenario: Dia passado
- **WHEN** o usuário abre uma data passada em que a ocorrência se aplica e marca não realizada
- **THEN** o log fica nessa data
- **AND** a tela deixa claro que a data não é hoje

#### Scenario: Sem aconselhamento na tela
- **WHEN** o usuário vê o cadastro ou a lista do dia
- **THEN** não há campo de dose prescrita pelo sistema
- **AND** os textos não orientam conduta médica

### Requirement: Leitura e escrita pela API
O sistema SHALL expor `GET` e `POST /api/medications`, `PATCH` e `DELETE /api/medications/:id`, `GET /api/medication-logs?from=YYYY-MM-DD&to=YYYY-MM-DD` e a gravação das marcas de um dia. A leitura de um dia MUST incluir ocorrências pendentes (sem linha) e logs gravados. A listagem por intervalo MUST incluir só logs gravados, sem preencher datas vazias como falha. `from` posterior a `to`, data inválida ou intervalo maior que 366 dias MUST ser rejeitado. Pedido sem sessão MUST NOT ler nem gravar. O identificador de usuário MUST vir só da sessão.

#### Scenario: Dia sem log
- **WHEN** o usuário autenticado lê as ocorrências de hoje e não marcou nenhuma
- **THEN** a resposta lista as ocorrências aplicáveis como pendentes
- **AND** não há erro nem status de falha

#### Scenario: Intervalo omite dia vazio
- **WHEN** o usuário pede um intervalo em que só um dia tem log
- **THEN** a resposta traz esse log
- **AND** os outros dias do intervalo não aparecem como não realizados

#### Scenario: Sem sessão
- **WHEN** um pedido de leitura ou escrita chega sem sessão
- **THEN** nenhum dado é lido ou gravado
- **AND** a resposta é não autorizada

### Requirement: Isolamento por usuário
Toda leitura e escrita de medicamento e de log MUST usar somente o usuário da sessão. Usuário A MUST NOT ler, criar, alterar ou apagar medicamento ou log de B, mesmo na mesma data e horário.

#### Scenario: Lista e log separados
- **WHEN** A e B têm medicamentos e logs na mesma data
- **THEN** A vê e altera só os próprios
- **AND** um salvamento de A deixa os dados de B intactos
