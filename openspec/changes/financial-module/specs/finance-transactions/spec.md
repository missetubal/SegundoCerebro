## Purpose

Permite lançar, corrigir e classificar transações manualmente, e define como despesa, receita, estorno, pagamento de fatura e transferência entram nas somas.

## ADDED Requirements

### Requirement: Criar, editar e excluir lançamento manual
O sistema SHALL permitir criar, editar e excluir um lançamento do usuário com data da compra obrigatória, descrição obrigatória de 1 a 200 caracteres após trim, valor obrigatório e tipo obrigatório. O valor MUST ser inteiro de centavos maior que zero. O tipo MUST ser despesa, receita, estorno, pagamento de fatura ou transferência. O lançamento MUST estar ligado a exatamente uma conta ou exatamente um cartão do próprio usuário, ativo. A moeda MUST ser a dessa conta ou cartão e MUST NOT ser escolhida à parte. Categoria MUST ser opcional e, se vier, MUST ser do próprio usuário. Nota MUST ser opcional, até 2000 caracteres; só espaços viram ausência. Data de compensação MUST ser opcional. Número e total de parcela MUST ser ambos omitidos ou ambos informados, com total maior ou igual a 1 e número entre 1 e o total. Informar parcela MUST NOT criar lançamentos futuros. Conta, cartão, categoria ou `userId` de outro usuário MUST ser tratados como inexistentes. Valor zero, data inválida ou descrição vazia MUST recusar a gravação inteira.

#### Scenario: Despesa manual
- **WHEN** o usuário lança "Mercado" em 2026-04-05, R$ 32,50, despesa, na própria conta BRL
- **THEN** o lançamento aparece nessa conta com essa data e esse valor
- **AND** a moeda é BRL

#### Scenario: Parcela não projeta o futuro
- **WHEN** o usuário grava uma despesa como parcela 2 de 6
- **THEN** existe só esse lançamento
- **AND** as parcelas 3 a 6 não são criadas

#### Scenario: Valor que não fecha em centavo
- **WHEN** o usuário informa um valor que não é múltiplo exato de um centavo da moeda
- **THEN** nenhum lançamento é criado

### Requirement: Exatidão monetária
Toda quantia monetária do módulo MUST ser múltiplo exato da menor unidade da moeda. Para BRL, USD e EUR essa unidade é o centavo. A soma de R$ 0,10 e R$ 0,20 MUST ser R$ 0,30. O sistema MUST NOT calcular nem guardar essas quantias como ponto flutuante binário.

#### Scenario: Soma de centavos
- **WHEN** existem duas despesas, de R$ 0,10 e R$ 0,20, na mesma moeda e no mesmo período
- **THEN** o total de despesas exibido é R$ 0,30

### Requirement: Direção de pagamento e transferência
Despesa MUST ser saída. Receita e estorno MUST ser entrada. Pagamento de fatura e transferência MUST exigir direção de entrada ou saída, escolhida pelo usuário. No cartão, o padrão sugerido para pagamento de fatura MUST ser entrada. Na conta, o padrão sugerido MUST ser saída. O usuário MUST poder trocar a direção antes de salvar.

#### Scenario: Pagamento sai da conta
- **WHEN** o usuário grava um pagamento de fatura de R$ 200,00 na conta, como saída
- **THEN** o saldo da conta diminui R$ 200,00
- **AND** o valor não entra no total de despesas nem no de receitas

### Requirement: Categorias do usuário
O sistema SHALL permitir criar, editar e arquivar categorias com nome obrigatório de 1 a 40 caracteres após trim, único para o usuário sem distinguir maiúsculas. Cor, ícone e categoria pai MUST ser opcionais. A pai, se existir, MUST ser do próprio usuário e MUST NOT formar ciclo. Arquivar MUST impedir o uso em lançamento novo e MUST preservar os lançamentos já classificados. Excluir MUST ser recusado enquanto algum lançamento usar a categoria. O usuário MUST poder atribuir uma categoria ativa a vários lançamentos próprios numa única ação. Lançamento sem categoria MUST continuar sem categoria até o usuário escolher uma.

#### Scenario: Categoria nova
- **WHEN** o usuário cria a categoria "Transporte"
- **THEN** ela fica disponível para os lançamentos dele

#### Scenario: Nome repetido
- **WHEN** já existe "Transporte" e o usuário cria "transporte"
- **THEN** a segunda categoria não é criada

#### Scenario: Troca em massa
- **WHEN** o usuário seleciona três lançamentos sem categoria e aplica "Transporte"
- **THEN** os três passam a usar "Transporte"
- **AND** um lançamento que não estava selecionado permanece sem categoria

### Requirement: O que entra no gasto e na receita
Despesa MUST somar no gasto. Receita MUST somar na receita. Estorno MUST reduzir o gasto da categoria do estorno e o gasto total. Pagamento de fatura e transferência MUST NOT somar no gasto nem na receita. Essas regras valem para lançamento manual e importado. Estorno sem categoria MUST reduzir o grupo "Sem categoria".

#### Scenario: Estorno reduz a categoria
- **WHEN** a categoria "Transporte" tem uma despesa de R$ 30,00 e um estorno de R$ 10,00 no mesmo período
- **THEN** o gasto exibido de "Transporte" é R$ 20,00

#### Scenario: Pagamento não é gasto
- **WHEN** o único lançamento do mês é um pagamento de fatura de R$ 500,00
- **THEN** o total de despesas do mês é zero
- **AND** o total de receitas do mês é zero
- **AND** o pagamento continua visível na lista de lançamentos

### Requirement: Data da compra separada da competência
A data usada para ordenar e filtrar o lançamento por período MUST ser a data da compra. O mês de referência da fatura, quando houver, MUST ser guardado na fatura e MUST NOT substituir a data da compra. Editar a data da compra MUST NOT alterar o mês de referência da fatura.

#### Scenario: Compra num mês e fatura no outro
- **WHEN** a compra é de 2026-03-28 e a fatura ligada tem mês de referência 2026-04
- **THEN** o lançamento entra no período de março quando o filtro usa a data da compra
- **AND** a fatura continua com referência 2026-04

### Requirement: Isolamento de lançamentos e categorias
Toda leitura e escrita de lançamento e categoria MUST usar somente o usuário da sessão. Identificador de outro usuário MUST ser tratado como inexistente.

#### Scenario: Lançamento alheio
- **WHEN** o usuário A tenta editar ou excluir um lançamento do usuário B
- **THEN** o lançamento de B permanece inalterado
