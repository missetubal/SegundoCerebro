## Purpose

Mostra o resumo do período, os gastos por categoria, conta e cartão, a lista filtrável e a visão geral do módulo, sempre com moeda, origem dos números e alternativa em tabela.

## ADDED Requirements

### Requirement: Resumo do mês
O sistema SHALL mostrar, para um mês de calendário escolhido pelo usuário, o total de despesas, o total de receitas e o saldo do período, por moeda. O saldo do período MUST ser receitas menos despesas líquidas. Despesa líquida MUST ser despesas menos estornos. O recorte MUST usar a data da compra. Pagamento de fatura e transferência MUST NOT entrar nesses três números. Se houver mais de uma moeda no período, cada moeda MUST ter o próprio bloco. O sistema MUST NOT converter nem somar moedas diferentes. Mês sem lançamento MUST mostrar zeros nessa moeda, sem tratar o mês vazio como falha.

#### Scenario: Saldo do período
- **WHEN** o mês tem R$ 100,00 de receita, R$ 40,00 de despesa e R$ 10,00 de estorno, todos em BRL
- **THEN** as despesas exibidas são R$ 30,00
- **AND** as receitas exibidas são R$ 100,00
- **AND** o saldo do período é R$ 70,00

#### Scenario: Duas moedas
- **WHEN** o mês tem uma despesa em BRL e outra em USD
- **THEN** os totais aparecem em blocos separados
- **AND** nenhum total mistura as duas moedas

### Requirement: Gastos por categoria, conta e cartão
O sistema SHALL quebrar as despesas líquidas do período por categoria, por conta e por cartão, na moeda selecionada. Lançamento sem categoria MUST aparecer no grupo "Sem categoria" e MUST NOT ser omitido. Categoria, conta ou cartão sem movimento no período MUST NOT ser preenchido com valor inventado. Pagamento de fatura e transferência MUST NOT entrar nessas quebras.

#### Scenario: Sem categoria
- **WHEN** o período tem uma despesa de R$ 15,00 sem categoria e outra de R$ 20,00 em "Mercado"
- **THEN** a quebra mostra "Sem categoria" com R$ 15,00
- **AND** mostra "Mercado" com R$ 20,00

#### Scenario: Por conta e por cartão
- **WHEN** há uma despesa na conta e outra no cartão, na mesma moeda e período
- **THEN** a visão por conta inclui a primeira
- **AND** a visão por cartão inclui a segunda
- **AND** cada uma fica de fora da visão do outro instrumento

### Requirement: Lista com busca e filtros
O sistema SHALL listar os lançamentos do usuário com busca por trecho da descrição, sem distinguir maiúsculas, e filtros por período da data da compra, categoria, conta, cartão e tipo. Os filtros MUST poder ser combinados. A busca sem resultado MUST mostrar lista vazia, sem linguagem de falha. A lista MUST incluir pagamento de fatura e transferência quando o filtro de tipo não os exclui.

#### Scenario: Filtro combinado
- **WHEN** o usuário filtra o mês de abril, a categoria "Mercado" e uma conta
- **THEN** a lista mostra só os lançamentos que cumprem os três critérios

#### Scenario: Busca sem resultado
- **WHEN** a busca não encontra descrição
- **THEN** a lista fica vazia
- **AND** o texto não trata isso como erro

### Requirement: Gráfico com tabela equivalente
Todo gráfico de gastos MUST mostrar o período, a moeda e a origem "lançamentos pela data da compra". O mesmo conjunto MUST estar disponível em tabela, com os mesmos rótulos e valores. O gráfico MUST NOT ser a única forma de ler os números.

#### Scenario: Tabela acompanha o gráfico
- **WHEN** o usuário vê o gráfico de gastos por categoria de abril em BRL
- **THEN** o período, a moeda e a origem estão visíveis
- **AND** a tabela do mesmo recorte repete cada categoria e cada valor do gráfico

### Requirement: Visão geral do módulo
A entrada do módulo SHALL mostrar, para o mês corrente no fuso do usuário, o gasto do mês por moeda, o saldo de cada conta ativa, o patrimônio investido informado e o próximo vencimento entre os cartões ativos. O próximo vencimento MUST ser a data de vencimento mais próxima, usando o dia cadastrado e o último dia do mês quando o mês for mais curto. O patrimônio MUST usar só valores de investimento informados, com a data da atualização. Conta sem lançamento MUST mostrar o saldo inicial. Ausência de cartão ou de valor investido MUST aparecer como ausência, sem zero inventado no lugar do patrimônio.

#### Scenario: Visão com uma conta e um cartão
- **WHEN** o usuário abre o módulo e tem uma conta ativa e um cartão ativo
- **THEN** vê o gasto do mês corrente, o saldo dessa conta e a próxima data de vencimento do cartão

#### Scenario: Sem valor investido
- **WHEN** nenhum ativo tem valor informado
- **THEN** a visão geral não mostra um patrimônio numérico
- **AND** indica que ainda não há valor informado

### Requirement: Isolamento das visualizações
Totais, listas e a visão geral MUST incluir somente dados do usuário da sessão.

#### Scenario: Gasto alheio
- **WHEN** o usuário B tem despesas e o usuário A abre o resumo
- **THEN** nenhuma despesa de B entra nos totais de A
