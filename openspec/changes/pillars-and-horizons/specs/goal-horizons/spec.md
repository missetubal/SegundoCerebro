## Purpose

Permite ao usuário definir os próprios horizontes temporais (rótulos como curto, médio ou longo prazo) que classificarão suas metas, sem durações fixas impostas pelo sistema.

## ADDED Requirements

### Requirement: Horizontes padrão criados uma única vez
O sistema SHALL criar automaticamente, na primeira vez que os horizontes do usuário forem consultados, os horizontes "Curto", "Médio", "Longo" e "Contínuo", nessa ordem. Essa criação MUST acontecer no máximo uma vez por usuário, inclusive com acessos simultâneos. Os padrões MUST não ter duração associada e MUST ser editáveis e apagáveis como qualquer horizonte. Depois da criação inicial, o sistema MUST nunca recriar os padrões, mesmo que o usuário exclua todos os horizontes.

#### Scenario: Primeiro acesso
- **WHEN** um usuário que nunca consultou horizontes abre a tela de horizontes
- **THEN** a lista exibe "Curto", "Médio", "Longo" e "Contínuo", nessa ordem

#### Scenario: Acessos simultâneos
- **WHEN** duas requisições do mesmo usuário consultam os horizontes ao mesmo tempo pela primeira vez
- **THEN** o usuário fica com exatamente quatro horizontes, sem duplicatas

#### Scenario: Excluir todos não recria
- **WHEN** o usuário exclui todos os horizontes e reabre a tela
- **THEN** a lista está vazia
- **AND** o sistema exibe um estado vazio com a opção de criar horizonte, sem linguagem de falha

### Requirement: Criar horizonte
O sistema SHALL permitir criar um horizonte com nome de 1 a 40 caracteres após remover espaços nas extremidades. O novo horizonte MUST entrar na última posição.

#### Scenario: Novo horizonte
- **WHEN** o usuário cria o horizonte "Este trimestre"
- **THEN** "Este trimestre" aparece como último da lista

#### Scenario: Nome vazio
- **WHEN** o usuário tenta criar um horizonte com nome vazio
- **THEN** nenhum horizonte é criado
- **AND** o sistema exibe uma mensagem neutra pedindo um nome

### Requirement: Nome de horizonte único por usuário
O sistema MUST impedir que um usuário tenha dois horizontes com o mesmo nome, comparando sem diferenciar maiúsculas de minúsculas e após remover espaços nas extremidades.

#### Scenario: Nome repetido
- **WHEN** o usuário tem o horizonte "Curto" e tenta criar ou renomear outro para "curto"
- **THEN** a operação não é aplicada
- **AND** o sistema informa que já existe um horizonte com esse nome

### Requirement: Renomear horizonte
O sistema SHALL permitir renomear qualquer horizonte, incluindo os padrões, com as mesmas regras de nome da criação. Renomear MUST não alterar a posição.

#### Scenario: Renomear padrão
- **WHEN** o usuário renomeia "Curto" para "Até 3 meses"
- **THEN** a lista exibe "Até 3 meses" na posição antes ocupada por "Curto"

### Requirement: Reordenar horizontes
O sistema SHALL permitir mover um horizonte uma posição para cima ou para baixo. A ordem MUST persistir entre sessões. Mover o primeiro para cima ou o último para baixo MUST não alterar nada.

#### Scenario: Mover para baixo
- **WHEN** a lista é "Curto", "Médio", "Longo", "Contínuo" e o usuário move "Curto" para baixo
- **THEN** a lista passa a ser "Médio", "Curto", "Longo", "Contínuo"

### Requirement: Excluir horizonte
O sistema SHALL permitir excluir qualquer horizonte, incluindo os padrões, após confirmação explícita. Sem confirmação, nada MUST ser excluído.

#### Scenario: Excluir padrão
- **WHEN** o usuário exclui "Contínuo" e confirma
- **THEN** "Contínuo" deixa de aparecer na lista
- **AND** os demais horizontes mantêm a ordem relativa

### Requirement: Isolamento de horizontes entre usuários
Toda leitura, criação, renomeação, reordenação e exclusão de horizontes MUST se restringir aos horizontes do usuário da sessão. Operações sobre identificador de horizonte de outro usuário MUST não ter efeito e MUST receber a mesma resposta dada a um identificador inexistente. O isolamento MUST ser coberto por testes automatizados com ao menos dois usuários.

#### Scenario: Padrões independentes
- **WHEN** o usuário A renomeia "Curto" para "Já"
- **THEN** o horizonte "Curto" do usuário B permanece "Curto"

#### Scenario: Exclusão por id alheio
- **WHEN** A envia a exclusão usando o identificador de um horizonte de B
- **THEN** o horizonte de B continua existindo
- **AND** A recebe a mesma mensagem neutra de item não encontrado
