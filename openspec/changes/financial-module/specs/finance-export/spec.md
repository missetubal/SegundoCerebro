## Purpose

Permite ao usuário baixar um JSON dos próprios dados financeiros, sem arquivo de fatura, sem segredo de armazenamento e sem dados de outra pessoa.

## ADDED Requirements

### Requirement: Exportar o módulo em JSON
O sistema SHALL permitir que o usuário autenticado baixe um JSON com as próprias instituições, contas, cartões, faturas, lotes de importação, lançamentos, categorias, ativos, operações e valores informados. O download MUST acontecer na resposta ao pedido autenticado. O sistema MUST NOT criar URL pública permanente para esse JSON. Pedido sem sessão MUST NOT devolver dados.

#### Scenario: Download do dono
- **WHEN** o usuário autenticado pede a exportação financeira
- **THEN** recebe um JSON com as próprias contas, lançamentos e ativos
- **AND** o arquivo não fica num endereço público permanente

#### Scenario: Sem sessão
- **WHEN** um pedido sem sessão pede a exportação
- **THEN** nenhum dado financeiro é devolvido

### Requirement: Conteúdo mínimo e o que fica de fora
O JSON MUST incluir, para cada cartão, no máximo os 4 últimos dígitos, além de apelido, bandeira, limite, dias, moeda e estado. MUST NOT incluir número completo, CVV, senha, PIN, bytes do arquivo anexado, chave de armazenamento ou URL de download. Metadados da fatura MUST incluir nome do arquivo, tipo, tamanho, mês de referência, total informado e estado. A exportação financeira MUST NOT incluir metas, hábitos, check-ins, medicamentos nem preferências.

#### Scenario: Cartão exportado sem segredo
- **WHEN** o usuário exporta e tem um cartão com final 1234 e um PDF anexado
- **THEN** o JSON traz 1234 e o nome do arquivo
- **AND** não traz o PDF, a chave de armazenamento nem URL de download

### Requirement: Só os dados do próprio usuário
Cada coleção do JSON MUST conter somente registros do usuário da sessão. Identificador de outro usuário no pedido MUST ser ignorado.

#### Scenario: Dois usuários
- **WHEN** os usuários A e B têm contas e A exporta
- **THEN** o JSON de A não contém a conta de B

### Requirement: Exportação não envia e-mail
Pedir ou concluir a exportação financeira MUST NOT enviar e-mail e MUST NOT colocar descrição, valor ou conteúdo de fatura em notificação.

#### Scenario: Exportação silenciosa
- **WHEN** o usuário baixa o JSON
- **THEN** nenhum e-mail é enviado por causa dessa exportação
