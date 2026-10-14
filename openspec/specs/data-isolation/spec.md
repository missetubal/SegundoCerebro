# data-isolation Specification

## Purpose

Garante que cada usuário só consegue ler, criar, alterar ou excluir os próprios dados, e que essa garantia é verificada por testes automatizados a cada nova entidade.

## Requirements

### Requirement: Identidade vem apenas da sessão
O sistema SHALL determinar o usuário de toda leitura ou escrita de dados pessoais exclusivamente pela sessão autenticada no servidor. Identificadores de usuário enviados pelo cliente (formulário, query string, corpo de requisição) MUST ser ignorados.

#### Scenario: Cliente tenta se passar por outro usuário
- **WHEN** o usuário A envia uma alteração de preferências contendo o identificador do usuário B
- **THEN** a alteração é aplicada apenas às preferências de A
- **AND** as preferências de B permanecem inalteradas

#### Scenario: Operação sem sessão
- **WHEN** uma operação de leitura ou escrita de dados pessoais é chamada sem sessão válida
- **THEN** nenhum dado é lido ou alterado
- **AND** o usuário é encaminhado para o login

### Requirement: Acesso a dados filtrado por usuário
Toda leitura, criação, alteração e exclusão de dados pessoais MUST ser restrita ao usuário da sessão. Dados de outro usuário MUST ser tratados como inexistentes.

#### Scenario: Leitura isolada
- **WHEN** os usuários A e B têm preferências diferentes e A lê suas preferências
- **THEN** A recebe somente os próprios valores

#### Scenario: Escrita isolada
- **WHEN** A altera seu fuso horário
- **THEN** o fuso de B não muda

### Requirement: Isolamento verificado por testes automatizados
Cada entidade de dados pessoais SHALL ter testes automatizados que criam ao menos dois usuários e verificam que um não lê nem altera dados do outro. Os testes MUST rodar contra um banco separado do banco de uso real.

#### Scenario: Suíte de isolamento de preferências
- **WHEN** a suíte de testes é executada
- **THEN** os testes de isolamento de preferências passam contra o banco de teste
- **AND** nenhum dado do banco de uso real é lido ou alterado
