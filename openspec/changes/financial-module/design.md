## Context

Ver `proposal.md` para o motivo. Contratos em `specs/finance-*/spec.md`.

Estado observado:

- Não há tabela, rota nem feature de finanças. Tags, revisão e exportação global estão só em `docs/`, sem spec e sem schema.
- Dados pessoais seguem `src/features/<nome>/{domain,application,infra,presentation}` mais `server.ts`. Repositório com `import 'server-only'`, `userId` vindo de `requireUserId()`, `ownedBy` / `deleteOwned`. Actions com `useActionState`, zod no domain, `refresh()` de `next/cache`.
- Driver `neon-http`: sem transação interativa. Escrita em várias tabelas usa `db.batch`.
- `next.config.ts` liga `cacheComponents`. Páginas de `/app` leem a sessão dentro de `Suspense`. Não existe upload nem cliente de arquivo.
- Valores de hábito usam `integer`. Não há tipo monetário.
- A UI chama o agrupamento de “área”. Esta change não liga conta, cartão ou lançamento a `area`.

## Goals / Non-Goals

**Goals:**

- Uma feature `src/features/finance`, com dinheiro, agregação, dedupe e posição em funções puras testáveis sem banco.
- Migração só aditiva. Tabelas novas. `goal`, `habit` e a home sem coluna nova.
- Anexo em Blob privado. A rota de download só emite URL assinada de no máximo 15 minutos.
- Confirmação e desfazer de importação atômicos via `db.batch`.
- Teste de isolamento A/B para cada entidade nova, no banco de teste já usado pelas outras features.

**Non-Goals:**

- Biblioteca de gráficos, criptografia de campo, antivírus externo, reutilizar mapa de CSV, cotação e qualquer escrita em meta, hábito ou home.

## Decisions

### 1. Uma feature, rotas finas

`src/features/finance/**` com o mesmo corte das features atuais. Client seguro em `index.ts`. Servidor em `server.ts`.

Rotas:

- `/app/finance` visão geral
- `/app/finance/accounts`, `/new`, `/[id]/edit`
- `/app/finance/cards`, `/new`, `/[id]`, `/[id]/edit`
- `/app/finance/statements`, `/new`, `/[id]`, `/[id]/import`
- `/app/finance/transactions`, `/new`, `/[id]/edit`
- `/app/finance/categories`
- `/app/finance/spending`
- `/app/finance/investments`, `/new`, `/[id]`
- `GET /app/finance/statements/[id]/file` download
- `GET /app/finance/export` JSON

Instituição não tem página própria. O formulário de conta, cartão e ativo oferece as instituições do usuário e cria uma nova no mesmo submit quando o nome ainda não existe. Sugestões (“Nubank”, “Itaú”, “XP” e outras comuns) são constante de UI. Só grava depois do submit.

Navegação: item “Finanças” em `app-sidebar`, nos dois breakpoints, apontando para `/app/finance`.

Alternativa rejeitada: sete features. O lote de importação cruza fatura, lançamento e categoria; um módulo só evita ciclo de import.

### 2. Dinheiro em `bigint` de centavos

Colunas monetárias são `bigint` no Postgres e `bigint` no Drizzle (`mode: 'bigint'`). BRL, USD e EUR têm expoente 2. A borda com o formulário aceita decimal com vírgula ou ponto e converte para centavos. O que não fechar em centavo é erro de validação. Soma e saldo acontecem em `bigint`. Exibição com `Intl.NumberFormat('pt-BR')`.

`integer` do Postgres para no equivalente a cerca de 21 milhões na unidade da moeda. Carteira e saldo passam disso. `numeric` flutuaria a tentação de usar `number`. `bigint` fecha os dois.

Quantidade de ativo é `numeric(20, 8)`, sempre `string` no TypeScript. Preço e taxa continuam centavos. Não usar `Number` nessa conta.

Custo de compra: `roundHalfAwayFromZero(quantityScaled * unitPriceMinor / 10^8) + feesMinor`, com quantidade escalada em 10^8. Venda reduz o custo em `roundHalfAwayFromZero(costMinor * quantitySoldScaled / quantityScaled)` e não soma a taxa ao custo restante. Quantidade zero zera o custo. Provento não mexe em quantidade nem custo. Ajuste substitui quantidade e preço médio. Ordem: `operation_date`, depois `created_at`. Função pura em `domain/position.ts`.

### 3. Schema

Todas as tabelas: `id` texto (uuid), `user_id` com `on delete cascade`, `created_at`, `updated_at`. Nomes em inglês.

- `financial_institution`: `name`, `type` (`bank` | `broker` | `other`). Único `(user_id, lower(name))`.
- `financial_account`: `institution_id` (`restrict`), `name`, `account_type` (`checking` | `savings` | `wallet` | `payment` | `other`), `currency`, `opening_balance_minor` default 0, `archived_at`.
- `credit_card`: `institution_id` (`restrict`), `nickname`, `brand` nulo, `last4` nulo, `credit_limit_minor` nulo, `closing_day`, `due_day`, `currency`, `archived_at`. Check: dias entre 1 e 31; `last4` nulo ou quatro dígitos. Sem coluna de PAN, CVV ou senha. Zod rejeita essas chaves com `.strict()` nos objetos de entrada.
- `statement`: `account_id` ou `credit_card_id`, exatamente um (`restrict`). `reference_month` como `date` no dia 1. `period_start`, `period_end`, `due_date` nulo, `declared_total_minor` nulo, `currency`, `status` (`attached` | `imported` | `reviewed`).
- `statement_attachment`: um por fatura, `unique(statement_id)`. `storage_key`, `file_name`, `mime_type`, `size_bytes`, `checksum` (sha256). `on delete cascade` a partir da fatura.
- `import_batch`: `statement_id` (`cascade`), `source_format` (`csv` | `ofx`), `status` (`preview` | `confirmed` | `undone`), contagens, `mapping_config` jsonb versionado, `draft_rows` jsonb nulo. Sem texto livre de erro vindo do arquivo.
- `transaction_category`: `name`, `color`, `icon`, `parent_id` auto-FK `restrict`, `archived_at`. Único `(user_id, lower(name))`.
- `transaction`: exatamente uma conta ou um cartão (`restrict`). `statement_id` e `import_batch_id` nulos (`restrict`). `transaction_date`, `posted_date` nulo, `description`, `amount_minor` > 0, `currency`, `direction` (`outflow` | `inflow`), `type` (`expense` | `income` | `refund` | `invoice_payment` | `transfer`), `category_id` nulo (`restrict`), parcelas nulas em par, `dedupe_hash`, `external_id` nulo, `notes` nulo. Check: despesa é saída; receita e estorno são entrada. `dedupe_hash` e `external_id` têm índice, não unicidade, porque duplicata confirmada gera outra linha.
- `investment_asset`: `institution_id` (`restrict`), `name`, `ticker` nulo, `asset_class` (`stock` | `reit` | `etf` | `fixed_income` | `fund` | `crypto` | `other`), `currency`, `archived_at`.
- `investment_transaction`: `asset_id` (`cascade`), `operation_type` (`buy` | `sell` | `income` | `adjustment`), `operation_date`, `quantity`, `unit_price_minor`, `fees_minor`, `currency`, `notes` nulo.
- `investment_valuation`: `asset_id` (`cascade`), `valuation_date`, `unit_value_minor` ou `total_value_minor` (exatamente um), `source` fixo `manual`.

Índices de lista: `(user_id, transaction_date)`, `(user_id, account_id)`, `(user_id, credit_card_id)`, `(import_batch_id)`, `(user_id, archived_at)` nas entidades arquiváveis.

Moeda da conta, do cartão e do ativo não muda depois do primeiro lançamento ou operação. Isso é regra de aplicação, consultando a existência de filhos.

Excluir conta, ativo ou categoria com filhos é recusa. Cartão não tem exclusão. Arquivar esconde da lista principal e bloqueia filho novo.

### 4. Anexo privado

Adaptador `infra/blob-store.ts` em volta de `@vercel/blob`, acesso privado. A apply confere o nome da função de URL assinada no pacote instalado, com validade máxima de 900 segundos. Testes recebem um dublê. O client nunca vê `storage_key` nem o token.

Limite 10 MiB. `serverActions.bodySizeLimit` em `next.config.ts` sobe para `12mb`. Tipos: PDF, CSV, OFX, QFX, JPEG, PNG, WebP, casando extensão, MIME e, nas imagens e no PDF, magic bytes. CSV e OFX precisam ser texto sem byte nulo. Checksum sha256 antes do `put`.

Substituir arquivo: sobe o novo, apaga o blob antigo, atualiza a linha. Apagar anexo: apaga o blob e a linha; lançamentos ficam. A ação separada, com campo de confirmação explícito, apaga também os lançamentos cujo `import_batch` aponta para aquela fatura. Lançamento manual ligado à fatura fica.

Log de falha é uma string fixa (`finance statement upload failed`). Sem corpo, descrição ou valor.

### 5. Importação

Prévia persiste em `import_batch.status = preview` com `draft_rows`. Isso não é lançamento. Sair sem confirmar não cria `transaction`. Edits da revisão ficam no cliente e voltam no confirm.

CSV: `papaparse` no servidor. Separador vírgula ou ponto e vírgula. O usuário aponta data, descrição e valor (coluna com sinal ou par débito/crédito) a cada importação. O mapa vai para `mapping_config` do lote, nunca como padrão da instituição.

OFX 1.x (SGML) e 2.x (XML): normalizar o SGML para XML e ler com `fast-xml-parser`, só `BANKTRANLIST` e `CCSTMTTRN`. Campos: `DTPOSTED`, `DTUSER`, `TRNAMT`, `NAME`, `MEMO`, `FITID`, `TRNTYPE`. Data da compra: `DTUSER` se houver, senão `DTPOSTED`. `DTPOSTED` enche `posted_date`. Sem esses blocos, a prévia falha e o anexo continua.

Sinal sugerido, ainda editável: na conta, negativo vira despesa e positivo vira receita; no cartão, positivo vira despesa e negativo vira estorno; `TRNTYPE` de pagamento ou transferência ganha desses tipos. Moeda do arquivo diferente da conta ou do cartão marca a linha como incompatível e o confirm a recusa.

`dedupe_hash` = sha256 de tipo do instrumento, id, data, centavos e descrição normalizada (trim, minúsculas, espaços colapsados). Bate também `external_id` (`FITID`) no mesmo instrumento. Linha marcada entra incluída. Confirm insere outra linha e não dá `update` em lançamento existente.

Soma conferida = despesas incluídas menos estornos. Receita, pagamento e transferência saem em totais à parte. Diferença contra `declared_total_minor` não bloqueia. Sem total, a UI diz que não há o que comparar.

Confirm até 2000 linhas incluídas, num `db.batch`: inserts e a troca de status do lote para `confirmed`. Acima disso, ou se o batch falhar, zero lançamentos. Se entrou ao menos uma linha, a fatura vai para `imported`. `draft_rows` é limpo no confirm. Desfazer apaga os lançamentos daquele `import_batch_id`, marca o lote `undone` e, se não restar lote `confirmed` na fatura, devolve o estado para `attached`. Anexo fica.

PDF e imagem não passam do anexo. A ação de importar responde que o arquivo continua guardado.

Alternativas rejeitadas: guardar a prévia só no cliente (perda ao recarregar); `ofx-js` (dependência opaca no caminho de dados financeiros); mapa de colunas reutilizado (P1, fora do contrato).

### 6. Agregação e telas

`domain/aggregation.ts` recebe lançamentos já filtrados por data da compra e devolve, por moeda, despesa líquida, receita e saldo do período. Despesa líquida = despesas − estornos. Pagamento e transferência não entram. Estorno sem categoria cai em “Sem categoria”. Saldo da conta = saldo inicial + entradas − saídas, pela `direction`. Lançamento de cartão não entra nesse saldo.

A visão geral usa o mês corrente no fuso de `user_preference`. Próximo vencimento: menor data a partir de hoje, com o dia do cartão limitado ao último dia do mês. Patrimônio: última `investment_valuation` com data menor ou igual a hoje; empate fica com a mais nova. Sem informe, não usa preço médio. Total só soma quem tem valor, na mesma moeda, e conta os que ficaram de fora.

Gráfico: barras em SVG no próprio componente, sem biblioteca. A tabela com os mesmos números renderiza junto. Origem visível: “lançamentos pela data da compra”.

Lista: `ilike` na descrição e filtros combináveis no repositório. Troca de categoria em massa: um `update` com `inArray` só dos ids do usuário; se algum id não for dele, a ação inteira não grava.

Copy sem conselho de compra, venda, crédito ou imposto. Mês ou busca vazios não usam linguagem de falha.

### 7. Exportação

`GET /app/finance/export` exige sessão e devolve `application/json` como anexo, corpo `{ version: 1, ... }`. Inclui as coleções do spec. Cartão só com `last4`. Fatura com metadados do arquivo, sem bytes, sem `storage_key`, sem URL. Não inclui `draft_rows`. Não inclui meta, hábito, check-in, medicamento nem preferência. Sem e-mail.

### 8. Privacidade operacional

Nenhuma action de finanças importa cliente de e-mail. Catch registra só código fixo. Zod de cartão é `.strict()` para recusar PAN, CVV, CVC, senha e PIN. Isolamento continua no `where` de `user_id`, nunca no id enviado pelo cliente.

## Risks / Trade-offs

- [OFX real varia por banco] → Fixtures sintéticos de conta e cartão cobrem o caminho feliz. Arquivo irreconhecível mantém o anexo e não cria lançamento. Ajuste de parser fica para um arquivo real, sem mudar o contrato.
- [Batch do Neon grande demais] → Teto de 2000 linhas incluídas. Acima disso nada é gravado.
- [Blob sem store no projeto] → Upload falha com mensagem neutra até o store privado existir. O resto do módulo funciona sem anexo.
- [URL assinada vaza se alguém copiar o link] → Validade de 15 minutos e blob privado. A URL não entra em log nem no JSON.
- [Sem antivírus] → Allowlist, magic bytes, teto de tamanho e arquivo não executado. Varredura externa fica fora.
- [`draft_rows` guarda descrição e valor] → Some no confirm e no desfazer. Não vai para log nem para a exportação.
- [Preço médio arredondado em centavos] → Regra única de metade para longe de zero, coberta por teste de domínio. Não é rentabilidade.
- [Home e metas não leem finanças] → O usuário abre “Finanças” pela navegação. Cartão na home e métrica de meta continuam fora.

## Migration Plan

1. Conectar Blob privado no projeto Vercel e disponibilizar a credencial que o `@vercel/blob` instalado exigir, em produção e no ambiente local. Sem isso, só o upload falha.
2. Gerar migração Drizzle aditiva. Nenhuma tabela existente muda. Sem backfill.
3. Subir o código. Rotas novas não alteram check-in, meta, hábito nem home.
4. Rollback do deploy: a versão anterior ignora as tabelas novas. Dados já gravados em finanças ficam nas tabelas e no Blob até uma limpeza manual. Dados do restante do app não são tocados.
5. Não apagar as tabelas novas no mesmo rollback.
