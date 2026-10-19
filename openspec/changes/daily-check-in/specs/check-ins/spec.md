## Purpose

Permite ao usuário autenticado registrar, reler, corrigir e apagar o check-in mínimo de um dia — hábitos aplicáveis, nota geral e humor — inclusive em data passada, sem exigir todos os campos e sem tratar dia vazio como falha.

## ADDED Requirements

### Requirement: Um check-in por usuário e data
O sistema SHALL manter no máximo um check-in por usuário autenticado e `entry_date`. `entry_date` MUST ser uma data de calendário `YYYY-MM-DD` interpretada no fuso das preferências do usuário. `created_at` e `updated_at` MUST ser instantes UTC distintos de `entry_date`. O primeiro salvamento grava `created_at`. Um salvamento posterior na mesma data MUST preservar `created_at` e atualizar `updated_at`. O identificador de usuário MUST vir só da sessão; um `userId` no corpo, na query ou no caminho MUST ser ignorado.

#### Scenario: Primeiro salvamento do dia
- **WHEN** o usuário salva o check-in de `2026-10-13` pela primeira vez, com nota "Avancei no projeto"
- **THEN** existe um único check-in desse usuário nessa data
- **AND** `entry_date` é `2026-10-13`
- **AND** `created_at` é o instante UTC do salvamento, não a meia-noite da `entry_date`

#### Scenario: Segundo salvamento não duplica
- **WHEN** o mesmo usuário salva de novo o check-in de `2026-10-13` com outra nota
- **THEN** continua existindo um único check-in nessa data
- **AND** a nota passa a ser a nova
- **AND** `created_at` permanece o do primeiro salvamento

#### Scenario: Cliente envia userId de outra pessoa
- **WHEN** o usuário A envia um salvamento com o identificador do usuário B
- **THEN** o check-in gravado é o de A
- **AND** os dados de B não mudam

### Requirement: Salvar sem preencher tudo
O sistema SHALL aceitar um salvamento em que nota, humor e registros de hábito estejam todos ausentes ou só uma parte esteja preenchida. Nenhum desses campos MUST ser obrigatório para salvar. Nota só com espaços MUST ser persistida como ausente. O salvamento MUST concluir sem pedir os campos do template detalhado.

#### Scenario: Só a nota
- **WHEN** o usuário salva o dia só com uma nota e sem humor e sem hábito marcado
- **THEN** o check-in fica gravado com essa nota
- **AND** humor e registros de hábito permanecem ausentes

#### Scenario: Só um hábito
- **WHEN** o dia tem três hábitos aplicáveis e o usuário marca apenas um como feito e salva
- **THEN** o salvamento é aceito
- **AND** os outros dois hábitos continuam sem registro

#### Scenario: Nota em branco
- **WHEN** o usuário salva a nota contendo apenas espaços e um humor 4
- **THEN** a nota fica ausente
- **AND** o humor 4 fica gravado

### Requirement: Registros de hábito do dia
Para a data do check-in, o sistema SHALL mostrar os hábitos ativos do usuário que se aplicam a essa data: diários em qualquer dia, e hábitos por dias da semana só quando o dia da semana dessa data estiver na configuração. Hábitos arquivados MUST não aparecer para novo registro. O sistema MUST gravar no máximo um registro por hábito e `entry_date`. Conclusão aceita apenas `done` ou `not_done`. Quantidade aceita um inteiro maior ou igual a zero. Um segundo salvamento do mesmo hábito na mesma data MUST atualizar o registro existente. Voltar o hábito a “sem registro” MUST apagar o registro desse hábito nessa data. Hábito de outro usuário, arquivado, ou que não se aplica à data MUST ser rejeitado sem gravar esse registro.

#### Scenario: Conclusão feito
- **WHEN** o usuário marca o hábito de conclusão "Meditar", aplicável à data, como feito e salva
- **THEN** existe um registro desse hábito nessa data com estado feito

#### Scenario: Quantidade
- **WHEN** o usuário informa 500 para o hábito de quantidade "Água" (unidade ml) e salva
- **THEN** existe um único registro com valor 500 nessa data

#### Scenario: Atualizar em vez de duplicar
- **WHEN** já existe registro de "Água" com 500 na data e o usuário salva 750
- **THEN** permanece um único registro
- **AND** o valor passa a ser 750

#### Scenario: Sem registro não é não realizado
- **WHEN** o usuário deixa "Meditar" em sem registro e salva o restante do dia
- **THEN** não existe registro de "Meditar" nessa data
- **AND** o sistema não grava estado não realizado para esse hábito

#### Scenario: Desfazer um registro
- **WHEN** "Meditar" estava feito e o usuário volta para sem registro e salva
- **THEN** o registro desse hábito nessa data deixa de existir
- **AND** o check-in do dia, se ainda tiver nota, humor ou outro hábito, permanece

#### Scenario: Hábito que não cabe na data
- **WHEN** o usuário tenta registrar um hábito ativo só às segundas numa terça
- **THEN** esse registro não é gravado
- **AND** o sistema informa que o hábito não se aplica a essa data, sem linguagem de culpa

### Requirement: Nota geral e humor opcionais
O check-in SHALL ter uma nota geral opcional de até 2000 caracteres após trim e um humor opcional inteiro de 1 a 5. Humor fora desse intervalo, nota acima do limite ou tipo inválido MUST rejeitar o salvamento inteiro, sem gravar parte do pedido. O sistema MUST NOT aceitar nem persistir gratidão, aprendizados ou reflexão livre nesta fatia. A tela MUST NOT exibir esses campos nem um controle que alterne para o template detalhado.

#### Scenario: Humor válido
- **WHEN** o usuário escolhe humor 3 e salva
- **THEN** o check-in guarda humor 3

#### Scenario: Humor inválido
- **WHEN** o pedido traz humor 0 ou 6
- **THEN** nada desse pedido é gravado
- **AND** o usuário vê uma mensagem neutra de valor inválido

#### Scenario: Campo detalhado no pedido
- **WHEN** o pedido inclui gratidão, aprendizados ou reflexão livre
- **THEN** nada desse pedido é gravado
- **AND** esses campos não aparecem na tela de check-in

### Requirement: Dia vazio permanece neutro
O sistema SHALL tratar a ausência de check-in e de registros de hábito como dia sem registro. A interface MUST NOT classificar esse dia como falha, atraso ou punição, e MUST NOT exibir linguagem de culpa. Uma lista de vários dias MUST omitir datas sem dados em vez de marcá-las como falha.

#### Scenario: Abrir hoje sem nada salvo
- **WHEN** o usuário abre o check-in de hoje e ainda não salvou nada
- **THEN** a tela mostra os hábitos aplicáveis em sem registro, nota vazia e humor vazio
- **AND** o texto visível afirma que em branco permanece neutro

#### Scenario: Intervalo não preenche buracos
- **WHEN** o usuário pede os check-ins de uma semana e só dois dias têm dados
- **THEN** a resposta traz só esses dois dias
- **AND** os outros dias não vêm marcados como falha

### Requirement: Leitura por data e por intervalo
O sistema SHALL expor `GET /api/check-ins/:date` e `GET /api/check-ins?from=YYYY-MM-DD&to=YYYY-MM-DD`. A leitura de uma data sem dados MUST responder com sucesso, nota ausente, humor ausente e lista de registros vazia — não como erro. O intervalo é inclusivo. `from` posterior a `to`, data inválida ou intervalo maior que 366 dias MUST ser rejeitado sem vazar dados. Cada item MUST incluir `entry_date`, nota, humor, `created_at` quando existir, e os registros de hábito dessa data.

#### Scenario: Data sem dados
- **WHEN** o usuário autenticado lê `GET /api/check-ins/2026-10-01` e não há check-in nem registros nesse dia
- **THEN** a resposta é sucesso
- **AND** nota e humor vêm ausentes
- **AND** a lista de registros de hábito vem vazia

#### Scenario: Intervalo inclusivo
- **WHEN** existem dados em `2026-10-01` e `2026-10-03` e o usuário lê `from=2026-10-01&to=2026-10-03`
- **THEN** a resposta inclui os dois dias com dados
- **AND** não inclui dias fora do intervalo

#### Scenario: Intervalo inválido
- **WHEN** `from` é posterior a `to`, ou o intervalo passa de 366 dias
- **THEN** nenhum dado é retornado
- **AND** a resposta indica pedido inválido

### Requirement: Upsert pela data
O sistema SHALL gravar pelo `PUT /api/check-ins/:date`. A data do caminho é a `entry_date`; o corpo não pode movê-la. Data que não é `YYYY-MM-DD`, ou data posterior a hoje no fuso do usuário, MUST ser rejeitada sem gravar. Pedido sem sessão MUST não ler nem gravar e MUST responder como não autorizado.

#### Scenario: Upsert retroativo
- **WHEN** hoje no fuso do usuário é `2026-10-19` e ele envia `PUT /api/check-ins/2026-10-13` com uma nota
- **THEN** o check-in fica em `2026-10-13`
- **AND** `created_at` é o instante do pedido, não `2026-10-13`

#### Scenario: Data futura
- **WHEN** o usuário envia `PUT` com data posterior a hoje no fuso dele
- **THEN** nada é gravado
- **AND** a resposta indica que a data não é aceita

#### Scenario: Sem sessão na API
- **WHEN** `PUT` ou `GET` de check-in chega sem sessão
- **THEN** nenhum dado é lido ou gravado
- **AND** a resposta é não autorizada

### Requirement: Exclusão opcional do dia
O sistema SHALL expor `DELETE /api/check-ins/:date`, removendo o check-in e todos os registros de hábito daquele usuário naquela data. O fluxo de salvar MUST NOT exigir exclusão. Excluir uma data que já não tem dados MUST terminar com sucesso e sem linhas restantes. Excluir MUST NOT afetar outra data do mesmo usuário nem a mesma data de outro usuário.

#### Scenario: Apagar o dia
- **WHEN** o usuário exclui `2026-10-13`, dia em que tinha nota e um registro de hábito
- **THEN** o check-in e os registros de hábito dessa data deixam de existir
- **AND** os outros dias do usuário permanecem

#### Scenario: Apagar de novo
- **WHEN** o usuário exclui uma data que já não tem check-in nem registros
- **THEN** a operação termina com sucesso
- **AND** nenhuma outra data é alterada

#### Scenario: Salvar não pede delete
- **WHEN** o usuário preenche só o humor e salva
- **THEN** o check-in é gravado
- **AND** nenhuma exclusão é necessária para concluir

### Requirement: Check-in retroativo na interface
A tela `/app/check-in` SHALL abrir em hoje no fuso do usuário e SHALL permitir escolher uma data passada. Ao escolher outra data, a tela MUST carregar nota, humor e registros já salvos nela, e MUST indicar com clareza que não é hoje. Salvar MUST manter a `entry_date` escolhida. Sem sessão, a tela MUST redirecionar para o login. O caminho do registro MUST ser completável sem preencher nota, humor e todos os hábitos: salvar fica disponível com qualquer subconjunto.

#### Scenario: Abrir hoje
- **WHEN** o usuário autenticado abre `/app/check-in` sem data na URL
- **THEN** a data em edição é hoje no fuso das preferências
- **AND** os hábitos aplicáveis a hoje aparecem

#### Scenario: Escolher ontem
- **WHEN** o usuário seleciona o dia anterior, que já tem "Meditar" feito e uma nota
- **THEN** a tela mostra essa nota e "Meditar" feito
- **AND** um aviso visível indica que a data é passada
- **AND** ao salvar uma alteração, `entry_date` continua sendo esse dia anterior

#### Scenario: Salvar parcial na tela
- **WHEN** o usuário altera só o humor e aciona salvar
- **THEN** o humor fica gravado
- **AND** hábitos deixados em sem registro continuam sem registro
- **AND** a tela não trata o restante em branco como falha

#### Scenario: Tela sem sessão
- **WHEN** alguém sem sessão abre `/app/check-in`
- **THEN** é redirecionado para o login
- **AND** nenhum check-in é lido ou gravado

### Requirement: Isolamento entre usuários
Toda leitura, criação, atualização e exclusão de check-in e de registro de hábito MUST ficar restrita ao usuário da sessão. Dados de outro usuário MUST ser tratados como inexistentes. A suíte MUST cobrir pelo menos dois usuários e MUST rodar contra o banco de teste.

#### Scenario: Leitura cruzada
- **WHEN** A e B têm check-ins na mesma `entry_date` e A lê essa data
- **THEN** A recebe só nota, humor e registros dele
- **AND** os dados de B não aparecem

#### Scenario: Escrita cruzada
- **WHEN** A salva ou exclui a própria data
- **THEN** o check-in e os registros de B nessa data permanecem
- **AND** um hábito de B não é aceito no salvamento de A
