## Purpose

Permite ao usuário organizar as áreas da vida que acompanha em pilares próprios — criando, editando, ordenando, arquivando e excluindo — como base para metas e hábitos.

## ADDED Requirements

### Requirement: Criar pilar
O sistema SHALL permitir que o usuário crie um pilar com nome obrigatório e, opcionalmente, descrição, cor e ícone. O nome MUST ter de 1 a 60 caracteres após remover espaços nas extremidades. A descrição MUST ter no máximo 500 caracteres. A cor, quando informada, MUST ser uma das cores da paleta oferecida pelo sistema; o ícone, quando informado, MUST ser um dos ícones do conjunto oferecido pelo sistema. Campos opcionais vazios MUST ser gravados como ausentes. O novo pilar MUST nascer ativo e na última posição entre os pilares ativos.

#### Scenario: Criação apenas com nome
- **WHEN** o usuário cria um pilar com nome "Saúde" e sem descrição, cor ou ícone
- **THEN** o pilar "Saúde" aparece como último da lista de ativos
- **AND** é exibido sem cor e com o ícone neutro padrão

#### Scenario: Criação com cor e ícone
- **WHEN** o usuário cria o pilar "Carreira" com cor azul e ícone de maleta
- **THEN** o pilar aparece na lista com o ícone de maleta em um bloco azul

#### Scenario: Nome vazio
- **WHEN** o usuário tenta criar um pilar com nome contendo apenas espaços
- **THEN** nenhum pilar é criado
- **AND** o sistema exibe uma mensagem neutra pedindo um nome

#### Scenario: Cor ou ícone fora do conjunto
- **WHEN** a requisição de criação contém uma cor ou um ícone que não pertence ao conjunto oferecido
- **THEN** nenhum pilar é criado
- **AND** o sistema exibe uma mensagem neutra de valor inválido

### Requirement: Nome de pilar único por usuário
O sistema MUST impedir que um usuário tenha dois pilares (ativos ou arquivados) com o mesmo nome, comparando sem diferenciar maiúsculas de minúsculas e após remover espaços nas extremidades. Acentos são considerados diferentes. Usuários diferentes MAY ter pilares com o mesmo nome.

#### Scenario: Nome repetido com outra capitalização
- **WHEN** o usuário já tem o pilar "Saúde" e tenta criar ou renomear outro para "saúde"
- **THEN** a operação não é aplicada
- **AND** o sistema informa, sem tom de erro grave, que já existe um pilar com esse nome

#### Scenario: Nome igual a pilar arquivado
- **WHEN** o usuário tem o pilar "Lazer" arquivado e tenta criar um pilar "Lazer"
- **THEN** a criação não é aplicada
- **AND** o sistema sugere desarquivar o pilar existente

#### Scenario: Mesmo nome em usuários diferentes
- **WHEN** o usuário B cria o pilar "Saúde" e o usuário A já tem um pilar "Saúde"
- **THEN** o pilar de B é criado normalmente

### Requirement: Listar pilares
O sistema SHALL exibir os pilares ativos do usuário ordenados pela posição definida por ele, cada um com ícone, cor, nome e ações para abrir, editar e arquivar. Pilares arquivados MUST ficar fora da lista principal e aparecer numa seção separada de arquivados, com ação para desarquivar. Quando o usuário não tem pilares ativos, o sistema MUST exibir um estado vazio convidativo com a ação de criar pilar, sem linguagem de falha.

#### Scenario: Lista ordenada
- **WHEN** o usuário tem os pilares ativos "Carreira", "Saúde" e "Lazer" nas posições 1, 2 e 3
- **THEN** a lista exibe "Carreira", "Saúde" e "Lazer" nessa ordem

#### Scenario: Arquivados separados
- **WHEN** o usuário tem o pilar "Casa" arquivado
- **THEN** "Casa" não aparece na lista principal
- **AND** "Casa" aparece na seção de arquivados

#### Scenario: Sem pilares
- **WHEN** o usuário não tem nenhum pilar ativo
- **THEN** o sistema exibe um estado vazio com o botão "Novo pilar"

### Requirement: Reordenar pilares
O sistema SHALL permitir mover um pilar ativo uma posição para cima ou para baixo na lista de ativos. A nova ordem MUST persistir entre sessões. Mover o primeiro pilar para cima ou o último para baixo MUST não alterar nada.

#### Scenario: Mover para cima
- **WHEN** a lista é "Carreira", "Saúde", "Lazer" e o usuário move "Lazer" para cima
- **THEN** a lista passa a ser "Carreira", "Lazer", "Saúde"
- **AND** a ordem continua a mesma após recarregar a página

#### Scenario: Limite da lista
- **WHEN** o usuário tenta mover o primeiro pilar para cima
- **THEN** a ordem permanece inalterada

### Requirement: Editar pilar
O sistema SHALL permitir alterar nome, descrição, cor e ícone de um pilar, ativo ou arquivado, com as mesmas regras de validação da criação. Cor e ícone MUST poder ser removidos. A edição MUST não alterar a posição nem o estado do pilar.

#### Scenario: Renomear e trocar cor
- **WHEN** o usuário edita "Saúde" para nome "Saúde e corpo" e cor verde
- **THEN** o pilar exibe o novo nome e a nova cor na mesma posição

#### Scenario: Remover ícone
- **WHEN** o usuário edita um pilar com ícone e escolhe "Sem ícone"
- **THEN** o pilar passa a exibir o ícone neutro padrão

### Requirement: Arquivar e desarquivar pilar
O sistema SHALL permitir arquivar um pilar ativo, removendo-o das telas principais sem apagar seus dados, e desarquivar um pilar arquivado. Um pilar desarquivado MUST voltar como último da lista de ativos. Arquivar MUST não exigir confirmação, pois é reversível.

#### Scenario: Arquivar
- **WHEN** o usuário arquiva o pilar "Negócio"
- **THEN** "Negócio" sai da lista principal e aparece em arquivados com os mesmos nome, descrição, cor e ícone

#### Scenario: Desarquivar
- **WHEN** a lista de ativos é "Carreira", "Saúde" e o usuário desarquiva "Negócio"
- **THEN** a lista de ativos passa a ser "Carreira", "Saúde", "Negócio"

### Requirement: Detalhe do pilar
O sistema SHALL exibir uma página de detalhe para cada pilar do usuário, com nome, ícone, cor, descrição, estado (ativo ou arquivado) e as ações editar, arquivar ou desarquivar e excluir. Enquanto metas e hábitos não existirem, o detalhe MUST exibir um espaço reservado neutro indicando que metas e hábitos do pilar aparecerão ali. Para um identificador inexistente ou pertencente a outro usuário, o sistema MUST exibir o mesmo estado "Pilar não encontrado" com link de volta para a lista, sem revelar se o pilar existe.

#### Scenario: Abrir detalhe
- **WHEN** o usuário clica em "Abrir" no pilar "Carreira"
- **THEN** o sistema exibe o detalhe de "Carreira" com suas informações e ações

#### Scenario: Detalhe de pilar arquivado
- **WHEN** o usuário abre o detalhe de um pilar arquivado
- **THEN** o detalhe indica que o pilar está arquivado e oferece a ação de desarquivar

#### Scenario: Pilar de outro usuário
- **WHEN** o usuário A acessa o endereço de detalhe de um pilar do usuário B
- **THEN** A vê "Pilar não encontrado"
- **AND** nenhuma informação do pilar de B é exibida

### Requirement: Excluir pilar definitivamente
O sistema SHALL permitir excluir definitivamente um pilar, ativo ou arquivado, somente após confirmação explícita que informa que a ação não pode ser desfeita e sugere arquivar como alternativa. Sem confirmação, nada MUST ser excluído. Após excluir, o usuário MUST ser levado à lista de pilares.

#### Scenario: Exclusão confirmada
- **WHEN** o usuário pede para excluir "Lazer" e confirma
- **THEN** "Lazer" deixa de existir em ativos e arquivados
- **AND** o usuário vê a lista de pilares

#### Scenario: Exclusão cancelada
- **WHEN** o usuário pede para excluir "Lazer" e cancela a confirmação
- **THEN** "Lazer" permanece inalterado

### Requirement: Isolamento de pilares entre usuários
Toda leitura, criação, edição, reordenação, arquivamento e exclusão de pilares MUST se restringir aos pilares do usuário da sessão. Operações sobre um identificador de pilar de outro usuário MUST não ter efeito e MUST receber a mesma resposta dada a um identificador inexistente. O isolamento MUST ser coberto por testes automatizados com ao menos dois usuários.

#### Scenario: Listagem isolada
- **WHEN** A e B têm pilares diferentes e A abre a lista de pilares
- **THEN** A vê apenas os próprios pilares

#### Scenario: Alteração por id alheio
- **WHEN** A envia edição, arquivamento, reordenação ou exclusão usando o identificador de um pilar de B
- **THEN** o pilar de B permanece inalterado
- **AND** A recebe a mesma mensagem neutra de item não encontrado
