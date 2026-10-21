## Purpose

Importa lançamentos de CSV ou OFX para uma fatura do próprio usuário somente depois de revisão, sinaliza duplicados, confere o total informado e permite desfazer o lote inteiro.

## ADDED Requirements

### Requirement: Importar só CSV e OFX
O sistema SHALL importar lançamentos a partir de CSV ou OFX/QFX já anexados a uma fatura do usuário. PDF e imagem MUST permanecer só como anexo. Pedir importação desses formatos MUST NOT criar lançamento e MUST explicar, em texto neutro, que o arquivo continua guardado e que esta versão não lê PDF nem imagem. A moeda das linhas MUST ser a moeda da conta ou do cartão da fatura. Linha cuja moeda declarada no arquivo seja outra MUST aparecer na revisão como incompatível e MUST NOT ser salva.

#### Scenario: PDF não vira lançamento
- **WHEN** o usuário pede para importar uma fatura cujo arquivo é PDF
- **THEN** nenhum lançamento é criado
- **AND** o PDF continua anexado

#### Scenario: Moeda diferente
- **WHEN** a conta é BRL e o arquivo declara USD numa linha
- **THEN** essa linha não pode ser salva
- **AND** o sistema não converte o valor

### Requirement: Mapear colunas do CSV a cada importação
Para CSV, o sistema SHALL pedir que o usuário indique a coluna de data, a de descrição e o valor, seja numa coluna com sinal ou num par débito e crédito, antes de mostrar a revisão. Sem esse mapeamento MUST NOT haver lista de lançamentos propostos. Um mapeamento usado antes MUST NOT ser aplicado sozinho na importação seguinte, mesmo da mesma instituição. OFX MUST dispensar mapeamento de colunas e MUST produzir a revisão direto do arquivo.

#### Scenario: CSV sem mapeamento
- **WHEN** o usuário abre um CSV e ainda não confirma as colunas
- **THEN** nenhum lançamento proposto aparece
- **AND** nada é gravado como lançamento

#### Scenario: Segunda importação pede o mapa de novo
- **WHEN** o usuário importa outro CSV da mesma instituição
- **THEN** o sistema pede de novo a confirmação das colunas
- **AND** não grava lançamento com o mapa anterior sem essa confirmação

### Requirement: Revisar antes de salvar
O sistema SHALL mostrar os lançamentos propostos sem gravá-los. O usuário MUST poder editar data, descrição, valor, tipo e categoria, ignorar uma linha ou tirá-la da lista. Confirmar MUST gravar somente as linhas incluídas, todas ou nenhuma. Mais de 2000 linhas incluídas MUST recusar a confirmação inteira, sem gravar lançamento. Ignorar todas MUST ser permitido e MUST NOT criar lançamento. Confirmar MUST NOT alterar lançamento que já existia. Cada linha salva MUST ficar ligada à fatura e ao lote. A data gravada MUST ser a data da compra editada na revisão. A competência MUST permanecer o mês de referência da fatura.

#### Scenario: Prévia ainda não grava
- **WHEN** o usuário vê a lista proposta e sai sem confirmar
- **THEN** a lista de lançamentos da conta continua sem essas linhas

#### Scenario: Edição na revisão
- **WHEN** o usuário corrige o valor de uma linha e confirma
- **THEN** o lançamento salvo tem o valor corrigido
- **AND** uma linha marcada como ignorada não é salva

#### Scenario: Falha no meio não grava parte
- **WHEN** a confirmação não pode gravar o lote inteiro
- **THEN** nenhum lançamento novo desse lote permanece

#### Scenario: Lote grande demais
- **WHEN** a revisão incluída tem mais de 2000 linhas
- **THEN** a confirmação não grava lançamento
- **AND** a fatura continua só com o anexo

### Requirement: Sinalizar duplicados sem descartar
O sistema SHALL marcar como possível duplicata uma linha proposta que tenha a mesma conta ou o mesmo cartão, a mesma data da compra, o mesmo valor em centavos e a mesma descrição de um lançamento já salvo, ignorando maiúsculas e espaços repetidos. Se o arquivo trouxer um identificador próprio da transação e ele já existir na mesma conta ou cartão, a linha também MUST ser marcada, mesmo com outra descrição. A linha marcada MUST continuar na revisão, incluída por padrão. Salvá-la MUST criar outro lançamento e MUST NOT modificar o lançamento antigo.

#### Scenario: Duplicata permanece na lista
- **WHEN** já existe uma despesa de R$ 18,90 em 2026-04-02 com descrição "Padaria" e o arquivo traz a mesma data, o mesmo valor e a descrição "padaria"
- **THEN** a linha proposta aparece marcada como possível duplicata
- **AND** ela não é removida da revisão

#### Scenario: Usuário decide salvar mesmo assim
- **WHEN** o usuário confirma a revisão com a duplicata ainda incluída
- **THEN** os dois lançamentos existem
- **AND** o lançamento antigo permanece com o valor e a descrição originais

### Requirement: Tipo sugerido pelo arquivo
Na revisão, o sistema SHALL sugerir um tipo que o usuário pode trocar. Em conta, valor negativo no arquivo MUST sugerir despesa e valor positivo MUST sugerir receita, salvo quando o arquivo indicar pagamento ou transferência. Em cartão, valor positivo MUST sugerir despesa e valor negativo MUST sugerir estorno, salvo quando o arquivo indicar pagamento ou transferência. Pagamento MUST ser sugerido como pagamento de fatura. A sugestão MUST NOT gravar lançamento antes da confirmação.

#### Scenario: Cartão com pagamento
- **WHEN** o OFX do cartão traz um pagamento
- **THEN** a linha aparece na revisão como pagamento de fatura
- **AND** o usuário pode mudar o tipo antes de confirmar

### Requirement: Conferir com o total informado
Antes da confirmação, o sistema SHALL mostrar a soma conferida das linhas incluídas: despesas menos estornos, na moeda da fatura. Receitas, pagamentos de fatura e transferências MUST aparecer em totais separados e MUST NOT entrar nessa soma. Se houver total informado, o sistema MUST mostrar a diferença entre esse total e a soma conferida, inclusive quando a diferença for diferente de zero. Diferença MUST NOT impedir a confirmação. Sem total informado, a revisão MUST dizer que não há total para comparar e MUST NOT usar zero no lugar.

#### Scenario: Diferença visível
- **WHEN** o total informado é R$ 100,00 e as linhas incluídas somam R$ 90,00 em despesas, sem estorno
- **THEN** a revisão mostra diferença de R$ 10,00
- **AND** o usuário ainda pode confirmar

#### Scenario: Pagamento fora da soma conferida
- **WHEN** a revisão tem uma despesa de R$ 80,00 e um pagamento de fatura de R$ 80,00
- **THEN** a soma conferida é R$ 80,00
- **AND** o pagamento aparece só no total separado de pagamentos

### Requirement: Desfazer a importação inteira
O sistema SHALL permitir desfazer um lote confirmado. Desfazer MUST remover todos os lançamentos daquele lote, mesmo os que o usuário editou depois, e MUST NOT remover lançamento manual nem lançamento de outro lote. O anexo e a fatura MUST permanecer. Se não restar outro lote confirmado nessa fatura, o estado MUST voltar para anexada. Desfazer lote de outro usuário MUST ser tratado como inexistente.

#### Scenario: Desfazer tira só o lote
- **WHEN** o usuário desfaz uma importação que gravou três lançamentos, um deles editado depois, e existe um lançamento manual na mesma conta
- **THEN** os três lançamentos do lote deixam de existir
- **AND** o lançamento manual permanece
- **AND** o arquivo continua anexado

### Requirement: Isolamento da importação
A prévia, a confirmação e o desfazer MUST usar somente faturas, contas, cartões e categorias do usuário da sessão.

#### Scenario: Lote alheio
- **WHEN** o usuário A tenta confirmar ou desfazer um lote do usuário B
- **THEN** nenhum lançamento de B é criado ou removido
