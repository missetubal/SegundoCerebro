## Purpose

Permite montar uma carteira manual, calcular a posição a partir das operações e mostrar o valor só quando o usuário informou, sempre com a data dessa atualização e sem recomendação.

## ADDED Requirements

### Requirement: Cadastrar ativo
O sistema SHALL permitir criar, editar e arquivar um ativo com nome obrigatório de 1 a 80 caracteres após trim, classe obrigatória no conjunto fechado ação, FII, ETF, renda fixa, fundo, cripto ou outro, instituição do próprio usuário e moeda obrigatória (BRL, USD ou EUR). Ticker MUST ser opcional, de 1 a 20 caracteres após trim. O ativo MUST nascer ativo. Arquivar MUST tirá-lo da carteira principal e MUST preservar operações e valores já gravados. Ativo arquivado MUST NOT receber operação nem valor novo. Excluir MUST ser recusado enquanto existir operação ou valor informado. A moeda MUST NOT mudar depois da primeira operação. Esta change MUST NOT exigir vencimento, taxa ou indexador, inclusive para renda fixa.

#### Scenario: Ativo mínimo
- **WHEN** o usuário cria "Tesouro IPCA" como renda fixa, na própria corretora, em BRL
- **THEN** o ativo aparece na carteira
- **AND** não pede taxa nem data de vencimento

#### Scenario: Exclusão com operação
- **WHEN** o ativo já tem uma compra e o usuário pede para excluí-lo
- **THEN** o ativo e a compra permanecem

### Requirement: Registrar operação
O sistema SHALL permitir registrar compra, venda, provento ou ajuste na data informada, com quantidade, preço unitário em centavos da moeda do ativo e taxas em centavos maiores ou iguais a zero. Quantidade MUST ser um decimal exato com no máximo 8 casas, maior que zero em compra, venda e provento. Taxa omitida MUST valer zero. Venda cuja quantidade supere a posição naquela data MUST ser recusada, sem gravar a operação. Provento MUST NOT alterar quantidade nem preço médio. As operações MUST ser aplicadas por data e, na mesma data, pela ordem de criação. Produto de quantidade por preço que não caia em centavo exato MUST arredondar metade para longe de zero na menor unidade da moeda.

#### Scenario: Compra
- **WHEN** o usuário registra a compra de 10 unidades a R$ 20,00 com taxa de R$ 1,00
- **THEN** a operação fica no ativo
- **AND** a posição passa a 10 unidades

#### Scenario: Venda acima da posição
- **WHEN** a posição é 10 e o usuário tenta vender 11
- **THEN** a venda não é gravada
- **AND** a posição continua 10

#### Scenario: Provento não muda a posição
- **WHEN** o usuário registra um provento com a posição em 10 unidades
- **THEN** a quantidade continua 10
- **AND** o preço médio continua o mesmo

### Requirement: Posição e preço médio
A posição exibida MUST ser calculada só pelas operações, nesta ordem. Compra soma a quantidade e soma ao custo a quantidade vezes o preço unitário mais as taxas. Venda diminui a quantidade e diminui o custo pelo preço médio vezes a quantidade vendida; a taxa da venda MUST NOT aumentar o custo restante. Quando a quantidade chega a zero, o custo MUST passar a zero. O preço médio MUST ser o custo dividido pela quantidade enquanto a quantidade for maior que zero, e MUST estar rotulado como preço médio. Ajuste MUST substituir a quantidade e o preço médio pelos valores informados. Sem operação, a posição MUST ser zero, sem linguagem de falha.

#### Scenario: Preço médio depois da compra
- **WHEN** a única operação é comprar 2 unidades a R$ 10,00 com taxa zero
- **THEN** a quantidade é 2
- **AND** o preço médio é R$ 10,00

#### Scenario: Venda parcial
- **WHEN** a posição é 2 unidades com preço médio de R$ 10,00 e o usuário vende 1
- **THEN** a quantidade passa a 1
- **AND** o preço médio restante continua R$ 10,00

#### Scenario: Ajuste
- **WHEN** o usuário registra um ajuste para 5 unidades com preço médio de R$ 8,00
- **THEN** a posição exibida passa a ser 5 unidades
- **AND** o preço médio exibido passa a ser R$ 8,00

### Requirement: Valor atual informado
O sistema SHALL permitir que o usuário informe o valor de um ativo numa data, como valor unitário ou como valor total, um dos dois, em centavos da moeda do ativo. A origem desta change MUST ser manual. A carteira MUST usar, como valor atual, o informe com data igual ou anterior a hoje no fuso do usuário; se houver mais de um, o de data mais recente e, na mesma data, o gravado por último. Informe com data futura MUST ser guardado e MUST NOT ser apresentado como valor atual. Sem informe aplicável, a tela MUST dizer que o valor não foi informado e MUST NOT mostrar o preço médio como se fosse o valor atual. O total da carteira numa moeda MUST somar só ativos com valor atual informado nessa moeda e MUST dizer quantos ativos ficaram de fora por falta de valor. Moedas MUST NOT ser somadas.

#### Scenario: Valor com data
- **WHEN** o usuário informa R$ 12,00 por unidade em 2026-04-01 para um ativo de 10 unidades
- **THEN** o valor atual exibido é R$ 120,00
- **AND** a data 2026-04-01 aparece junto desse valor

#### Scenario: Sem informe
- **WHEN** o ativo tem preço médio e nenhum valor informado
- **THEN** a carteira não apresenta esse preço médio como valor atual
- **AND** indica que o valor não foi informado

#### Scenario: Total deixa ativo de fora
- **WHEN** dois ativos estão em BRL e só um tem valor informado
- **THEN** o total em BRL inclui só o que tem valor
- **AND** a tela mostra que um ativo ficou de fora

### Requirement: Carteira por classe, instituição e ativo
O sistema SHALL mostrar a carteira agrupada por classe, por instituição e por ativo. Cada ativo MUST mostrar quantidade, preço médio e, quando houver, valor atual com data. Ativo arquivado MUST ficar fora do agrupamento principal e MUST continuar acessível no histórico.

#### Scenario: Três leituras da mesma carteira
- **WHEN** o usuário abre a carteira
- **THEN** consegue ver os ativos agrupados por classe, por instituição e um a um

### Requirement: Sem recomendação e sem cotação automática
As telas de investimento MUST NOT recomendar compra, venda, alocação, crédito ou imposto. O sistema MUST NOT buscar cotação em provedor externo nesta change. Renda fixa MUST NOT receber cálculo de rendimento por taxa ou vencimento.

#### Scenario: Detalhe sem conselho
- **WHEN** o usuário abre o detalhe de um ativo
- **THEN** vê operações, posição e valor informado
- **AND** não vê recomendação de compra, venda ou alocação

### Requirement: Isolamento da carteira
Toda leitura e escrita de ativo, operação e valor MUST usar somente o usuário da sessão.

#### Scenario: Ativo alheio
- **WHEN** o usuário A tenta registrar uma compra num ativo do usuário B
- **THEN** a operação não é gravada
- **AND** a posição de B permanece a mesma
