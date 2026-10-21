## Purpose

Permite anexar a fatura ou o extrato a um cartão ou conta do próprio usuário, consultar o arquivo em privado e apagar o anexo sem perder lançamento, salvo confirmação explícita.

## ADDED Requirements

### Requirement: Anexar arquivo a uma fatura
O sistema SHALL permitir criar uma fatura ligada a exatamente um cartão ou exatamente uma conta do próprio usuário, com mês de referência `YYYY-MM`, início e fim de período e um arquivo. O início MUST ser anterior ou igual ao fim. A data de vencimento e o total informado MUST ser opcionais. O total informado, quando existir, MUST ser um inteiro de centavos na mesma moeda do cartão ou da conta. O arquivo MUST ser PDF, CSV, OFX, QFX, JPEG, PNG ou WebP e MUST ter no máximo 10 MiB. Arquivo vazio, tipo fora dessa lista ou acima do limite MUST recusar a criação inteira. A fatura MUST nascer no estado anexada. Cartão, conta ou `userId` de outro usuário MUST ser tratados como inexistentes. Conta ou cartão arquivado MUST NOT receber fatura nova.

#### Scenario: Anexo válido
- **WHEN** o usuário anexa um PDF de 1 MiB ao próprio cartão, com mês de referência e período coerente
- **THEN** a fatura aparece para esse cartão no estado anexada
- **AND** o arquivo fica disponível só para esse usuário

#### Scenario: Arquivo recusado
- **WHEN** o arquivo passa de 10 MiB ou não é PDF, CSV, OFX, QFX, JPEG, PNG nem WebP
- **THEN** nenhuma fatura é criada
- **AND** a mensagem não reproduz o conteúdo do arquivo

### Requirement: Listar faturas por cartão e por mês
O sistema SHALL listar as faturas do usuário por cartão ou conta e por mês de referência, mostrando o estado anexada, importada ou revisada. O usuário MUST poder marcar uma fatura importada como revisada. Marcar como revisada MUST NOT alterar lançamentos. Ausência de fatura num mês MUST ser uma lista vazia, sem linguagem de falha.

#### Scenario: Estados na lista
- **WHEN** o cartão tem uma fatura anexada em 2026-03 e outra importada em 2026-04
- **THEN** a lista mostra os dois meses com esses estados

#### Scenario: Mês sem fatura
- **WHEN** o usuário filtra um mês em que não há fatura
- **THEN** a lista fica vazia
- **AND** o texto não trata o mês vazio como erro

### Requirement: Ver e baixar só o próprio arquivo
O sistema SHALL permitir que o dono visualize e baixe o arquivo da própria fatura por um acesso temporário que expira em no máximo 15 minutos. O sistema MUST NOT publicar URL permanente nem aceitar acesso anônimo. Usuário que não é o dono MUST receber o mesmo tratamento de item inexistente, mesmo que conheça o identificador da fatura ou do arquivo.

#### Scenario: Dono baixa o arquivo
- **WHEN** o dono pede o download da própria fatura
- **THEN** recebe o arquivo que anexou
- **AND** o acesso concedido deixa de valer em no máximo 15 minutos

#### Scenario: Outro usuário pede o arquivo
- **WHEN** o usuário B pede o arquivo de uma fatura do usuário A
- **THEN** B não recebe o arquivo
- **AND** a fatura de A permanece inalterada

### Requirement: Excluir anexo sem apagar lançamento
O sistema SHALL oferecer duas ações distintas. Excluir só o anexo MUST remover o arquivo e MUST preservar a fatura e todos os lançamentos. Excluir o anexo e os lançamentos importados MUST exigir confirmação explícita dessa segunda ação e MUST remover o arquivo e os lançamentos criados por importação daquela fatura. Lançamento manual, mesmo ligado à fatura, MUST permanecer. Nenhuma das duas ações MUST apagar lançamento de outra fatura ou de outro usuário.

#### Scenario: Excluir só o arquivo
- **WHEN** o usuário exclui o anexo sem a confirmação de apagar lançamentos
- **THEN** o arquivo deixa de estar disponível
- **AND** os lançamentos importados continuam na lista

#### Scenario: Excluir arquivo e importação
- **WHEN** o usuário confirma a exclusão do anexo e dos lançamentos importados
- **THEN** o arquivo e os lançamentos daquela importação são removidos
- **AND** um lançamento manual da mesma fatura continua existindo

### Requirement: Total informado para conferência
O sistema SHALL guardar o total informado, quando o usuário o enviar, junto da fatura e da moeda. A leitura da fatura MUST mostrar esse total separado da soma dos lançamentos. A ausência de total MUST ser exibida como total não informado, sem inventar zero.

#### Scenario: Total guardado
- **WHEN** o usuário informa R$ 250,00 ao anexar a fatura
- **THEN** o detalhe mostra R$ 250,00 como total informado

#### Scenario: Sem total
- **WHEN** o usuário anexa a fatura sem total
- **THEN** o detalhe indica que o total não foi informado
- **AND** não mostra R$ 0,00 no lugar

### Requirement: Conteúdo financeiro fora de log e de e-mail
Operações de fatura MUST NOT enviar e-mail. O registro técnico de sucesso ou falha MUST NOT incluir o conteúdo do arquivo, descrição de lançamento nem valor. A mensagem mostrada ao usuário pode dizer que o arquivo foi recusado, sem citar linhas ou valores extraídos.

#### Scenario: Falha de upload
- **WHEN** o anexo é recusado
- **THEN** a mensagem ao usuário não contém linhas do arquivo nem valores
- **AND** nenhum e-mail é enviado

### Requirement: Isolamento das faturas
Toda leitura, criação e exclusão de fatura ou anexo MUST usar somente o usuário da sessão. Registro de outro usuário MUST ser tratado como inexistente.

#### Scenario: Lista isolada
- **WHEN** os usuários A e B têm faturas e A abre a lista
- **THEN** A vê apenas as próprias faturas
