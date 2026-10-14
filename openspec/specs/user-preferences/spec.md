# user-preferences Specification

## Purpose

Guarda as preferências globais de cada usuário — fuso horário e template de check-in — que outras funcionalidades usam para interpretar datas e montar telas.

## Requirements

### Requirement: Preferências sempre disponíveis com defaults
Todo usuário autenticado SHALL ter exatamente um conjunto de preferências. Se ainda não existir, o sistema SHALL criá-lo no primeiro acesso com fuso `America/Sao_Paulo` e template `minimal`, sem exigir ação do usuário.

#### Scenario: Primeiro acesso de usuário sem preferências
- **WHEN** um usuário autenticado sem preferências gravadas acessa qualquer funcionalidade que lê preferências
- **THEN** o sistema cria as preferências com fuso `America/Sao_Paulo` e template `minimal`
- **AND** retorna esses valores

#### Scenario: Acessos repetidos não duplicam
- **WHEN** o mesmo usuário acessa preferências várias vezes, inclusive em requisições simultâneas
- **THEN** existe apenas um conjunto de preferências para esse usuário

### Requirement: Visualizar preferências
O usuário autenticado SHALL poder ver seu fuso horário atual e seu template global numa tela de preferências acessível a partir da área logada.

#### Scenario: Abrir tela de preferências
- **WHEN** o usuário autenticado abre a tela de preferências
- **THEN** vê o fuso horário salvo selecionado
- **AND** vê o template global atual (`minimal`) sem opção de alterá-lo nesta fase

#### Scenario: Acesso sem sessão
- **WHEN** alguém sem sessão tenta abrir a tela de preferências
- **THEN** é redirecionado para a tela de login

### Requirement: Alterar fuso horário
O usuário SHALL poder alterar seu fuso horário para qualquer identificador IANA válido. O sistema MUST rejeitar valores inválidos sem alterar o valor salvo.

#### Scenario: Salvar fuso válido
- **WHEN** o usuário escolhe `Europe/Lisbon` e salva
- **THEN** o fuso salvo passa a ser `Europe/Lisbon`
- **AND** a data de última atualização das preferências é atualizada
- **AND** ao recarregar a tela, `Europe/Lisbon` aparece selecionado

#### Scenario: Fuso inválido
- **WHEN** o servidor recebe um fuso que não é um identificador IANA válido (ex.: `Marte/Base`)
- **THEN** o valor salvo não muda
- **AND** o usuário vê uma mensagem de erro neutra, sem linguagem de culpa

#### Scenario: Sugestão do fuso do navegador
- **WHEN** o fuso detectado no navegador é diferente do fuso salvo
- **THEN** a tela oferece usar o fuso detectado, sem salvar automaticamente
