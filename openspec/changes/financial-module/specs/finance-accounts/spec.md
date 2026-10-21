## Purpose

Permite ao usuário cadastrar as próprias instituições, contas e cartões, com saldo inicial e limite opcionais, sem guardar número completo de cartão, CVV ou senha.

## ADDED Requirements

### Requirement: Cadastrar instituição
O sistema SHALL permitir que o usuário autenticado crie uma instituição com nome obrigatório de 1 a 80 caracteres após trim e tipo obrigatório no conjunto fechado banco, corretora ou outro. O nome MUST ser único para o usuário, sem distinguir maiúsculas. Uma lista sugerida na interface MUST NOT gravar instituição até o usuário confirmar. `userId` vindo do cliente MUST ser ignorado.

#### Scenario: Cadastro mínimo
- **WHEN** o usuário cria a instituição "Nubank" com tipo banco
- **THEN** ela aparece na lista dele
- **AND** não fica disponível para outro usuário

#### Scenario: Nome repetido
- **WHEN** o usuário tenta criar outra instituição com o nome "nubank"
- **THEN** nenhuma instituição nova é criada
- **AND** a mensagem pede outro nome, em texto neutro

### Requirement: Cadastrar, editar, arquivar e excluir conta
O sistema SHALL permitir criar e editar uma conta com nome obrigatório de 1 a 80 caracteres após trim, tipo obrigatório no conjunto fechado corrente, poupança, carteira, pagamento ou outro, instituição do próprio usuário, moeda obrigatória e saldo inicial opcional. A moeda MUST ser BRL, USD ou EUR. Saldo inicial omitido MUST valer zero na menor unidade dessa moeda. O saldo inicial MUST ser um inteiro de centavos, positivo, negativo ou zero. A conta MUST nascer ativa. Arquivar MUST tirá-la da lista principal e MUST NOT apagar lançamentos nem faturas. Conta arquivada MUST NOT receber lançamento nem fatura novos. Excluir MUST ser recusado enquanto existir lançamento ou fatura nessa conta; nesse caso a conta e os registros permanecem. Excluir uma conta sem lançamento e sem fatura MUST removê-la. Instituição, conta ou `userId` de outro usuário MUST ser tratados como inexistentes. A moeda MUST NOT mudar depois que a conta tiver lançamento.

#### Scenario: Conta com saldo inicial
- **WHEN** o usuário cria "Conta corrente" no "Nubank", tipo corrente, moeda BRL e saldo inicial de R$ 100,00
- **THEN** a conta fica ativa com saldo inicial de 10000 centavos
- **AND** a moeda exibida é BRL

#### Scenario: Exclusão com lançamento
- **WHEN** a conta já tem um lançamento e o usuário pede para excluí-la
- **THEN** a conta continua existindo
- **AND** o lançamento continua existindo
- **AND** a interface indica que dá para arquivar

#### Scenario: Moeda travada
- **WHEN** a conta já tem lançamento e o usuário tenta trocar a moeda de BRL para USD
- **THEN** a moeda permanece BRL

#### Scenario: Conta de outro usuário
- **WHEN** o usuário A tenta editar, arquivar ou excluir uma conta do usuário B
- **THEN** a conta de B permanece inalterada
- **AND** o sistema trata o item como não encontrado

### Requirement: Cadastrar, editar e arquivar cartão
O sistema SHALL permitir criar e editar um cartão com apelido obrigatório de 1 a 80 caracteres após trim, instituição do próprio usuário, moeda obrigatória (BRL, USD ou EUR), dia de fechamento e dia de vencimento obrigatórios de 1 a 31. Bandeira, 4 últimos dígitos e limite MUST ser opcionais. Se os 4 últimos dígitos forem informados, MUST ser exatamente quatro dígitos. O limite, quando informado, MUST ser inteiro de centavos maior ou igual a zero, na moeda do cartão. O cartão MUST nascer ativo. Arquivar MUST tirá-lo da lista principal e MUST NOT apagar faturas nem lançamentos. Cartão arquivado MUST NOT receber fatura nem lançamento novos. A moeda MUST NOT mudar depois que o cartão tiver lançamento. O sistema MUST NOT oferecer exclusão que apague faturas ou lançamentos do cartão.

#### Scenario: Cartão sem número completo
- **WHEN** o usuário cria o cartão "Dia a dia" com fechamento 3, vencimento 10 e últimos dígitos 1234
- **THEN** o cartão fica ativo
- **AND** a interface mostra apenas 1234 como identificação numérica

#### Scenario: Dígitos inválidos
- **WHEN** o usuário informa últimos dígitos com tamanho diferente de quatro
- **THEN** nenhum cartão é criado

#### Scenario: Vencimento em mês curto
- **WHEN** o cartão tem vencimento no dia 31 e o mês corrente termina no dia 30
- **THEN** a próxima data de vencimento exibida usa o dia 30 desse mês

### Requirement: Não armazenar dado sensível de cartão
O sistema MUST NOT aceitar, persistir, devolver ou exportar número completo do cartão, CVV, CVC, senha ou PIN. Um pedido que traga esses campos MUST ser recusado por inteiro, sem gravar o cartão. A leitura de um cartão MUST devolver no máximo os 4 últimos dígitos.

#### Scenario: Pedido com número completo
- **WHEN** a criação envia número completo, CVV ou senha junto com o apelido
- **THEN** nenhum cartão é criado
- **AND** esses valores não ficam gravados

#### Scenario: Leitura não revela mais que os quatro dígitos
- **WHEN** o usuário abre um cartão cujo final informado é 1234
- **THEN** a resposta mostra 1234
- **AND** não mostra outro número de cartão, CVV ou senha

### Requirement: Saldo da conta a partir dos lançamentos
O saldo exibido de uma conta MUST ser o saldo inicial mais as entradas e menos as saídas dos lançamentos dessa conta. Despesa é saída. Receita e estorno são entradas. Pagamento de fatura e transferência usam a direção escolhida no lançamento. Lançamento de cartão MUST NOT alterar o saldo da conta. Moedas diferentes MUST NOT ser somadas.

#### Scenario: Saldo depois de uma despesa
- **WHEN** a conta tem saldo inicial de R$ 100,00 e uma despesa de R$ 40,00
- **THEN** o saldo exibido é R$ 60,00

#### Scenario: Lançamento do cartão não muda a conta
- **WHEN** existe uma despesa no cartão e nenhuma despesa na conta
- **THEN** o saldo da conta permanece o saldo inicial

### Requirement: Isolamento de instituições, contas e cartões
Toda leitura e escrita destas entidades MUST usar somente o usuário da sessão. Registro de outro usuário MUST ser tratado como inexistente.

#### Scenario: Lista isolada
- **WHEN** os usuários A e B têm contas e A abre a lista
- **THEN** A vê apenas as próprias contas, cartões e instituições
