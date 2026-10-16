## Purpose

Permite ao usuário criar e gerenciar metas leves ligadas a um horizonte e a uma área principal, com próximos passos opcionais que não bloqueiam fluxos futuros.

## ADDED Requirements

### Requirement: Criar meta
O sistema SHALL permitir que o usuário autenticado crie uma meta com título obrigatório, horizonte obrigatório (um dos horizontes do próprio usuário), área principal obrigatória (uma área ativa do próprio usuário) e status inicial ativo. Datas de início e alvo MAY ser omitidas. O título MUST ter de 1 a 120 caracteres após remover espaços nas extremidades. Datas, quando informadas, MUST ser datas de calendário válidas; se ambas existirem, a data-alvo MUST não ser anterior à data de início.

#### Scenario: Criação mínima
- **WHEN** o usuário cria a meta "Correr 5 km" com horizonte "Curto", área principal "Saúde" e sem datas
- **THEN** a meta aparece na lista de metas ativas com status ativo
- **AND** o horizonte e a área principal exibidos são os escolhidos

#### Scenario: Título vazio
- **WHEN** o usuário tenta criar uma meta com título contendo apenas espaços
- **THEN** nenhuma meta é criada
- **AND** o sistema exibe uma mensagem neutra pedindo um título

#### Scenario: Horizonte ou área de outro usuário
- **WHEN** a requisição de criação referencia um horizonte ou área que não pertence ao usuário da sessão
- **THEN** nenhuma meta é criada
- **AND** o sistema trata o vínculo como inválido com mensagem neutra

#### Scenario: Datas inconsistentes
- **WHEN** o usuário informa data de início posterior à data-alvo
- **THEN** nenhuma meta é criada
- **AND** o sistema exibe uma mensagem neutra pedindo datas coerentes

### Requirement: Listar e editar metas
O sistema SHALL listar as metas do usuário autenticado, separando ativas das arquivadas ou concluídas conforme o status. O usuário MUST poder alterar título, horizonte, área principal, status e datas opcionais com as mesmas regras de validação da criação. Metas de outro usuário MUST ser tratadas como inexistentes.

#### Scenario: Lista isolada
- **WHEN** os usuários A e B têm metas e A abre a lista
- **THEN** A vê apenas as próprias metas

#### Scenario: Editar campos
- **WHEN** o usuário altera o título de uma meta ativa e troca o horizonte
- **THEN** a lista e o detalhe refletem o novo título e o novo horizonte

#### Scenario: Meta alheia
- **WHEN** o usuário A tenta editar ou excluir o id de uma meta do usuário B
- **THEN** a operação não altera a meta de B
- **AND** o sistema trata o item como não encontrado

### Requirement: Status da meta
O sistema SHALL representar o status da meta com um conjunto fechado: ativo, concluído e arquivado. Concluir ou arquivar MUST não apagar a meta. Uma meta arquivada MUST ficar fora da lista principal de ativas.

#### Scenario: Concluir
- **WHEN** o usuário marca a meta ativa "Correr 5 km" como concluída
- **THEN** a meta deixa a lista de ativas
- **AND** permanece acessível como concluída

#### Scenario: Arquivar
- **WHEN** o usuário arquiva uma meta ativa
- **THEN** a meta não aparece na lista principal de ativas
- **AND** pode ser reativada depois

### Requirement: Próximos passos opcionais
O sistema SHALL permitir criar, listar, concluir e remover próximos passos associados a uma meta do usuário. Cada próximo passo MUST ter título obrigatório (1 a 120 caracteres após trim). Próximos passos MAY ser omitidos por completo: a meta MUST permanecer válida sem nenhum próximo passo. A ausência de próximos passos MUST não impedir operações da meta nem fluxos futuros de check-in.

#### Scenario: Meta sem próximos passos
- **WHEN** o usuário cria e edita uma meta sem cadastrar próximos passos
- **THEN** a meta é salva normalmente
- **AND** o detalhe indica que ainda não há próximos passos, sem linguagem de falha

#### Scenario: Adicionar e concluir próximo passo
- **WHEN** o usuário adiciona o próximo passo "Comprar tênis" a uma meta e depois o marca como concluído
- **THEN** o passo aparece na lista da meta
- **AND** após concluir, fica marcado como concluído sem apagar o registro

#### Scenario: Isolamento de próximo passo
- **WHEN** o usuário A tenta alterar um próximo passo pertencente a uma meta do usuário B
- **THEN** a operação não altera o passo de B
- **AND** o sistema trata o item como não encontrado

### Requirement: UI em português com área
Textos exibidos ao usuário nas telas de metas MUST usar o termo "área" (nunca "pilar") para a área principal. Rotas e identificadores técnicos permanecem em inglês.

#### Scenario: Rótulo da área principal
- **WHEN** o usuário abre o formulário de nova meta
- **THEN** o campo de vínculo principal está rotulado como área
