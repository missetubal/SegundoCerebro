## 1. Base

- [x] 1.1 Instalar `@vercel/blob`, `papaparse` e `fast-xml-parser`. Verificar que `npm install` termina e que os três pacotes aparecem em `package.json`.
- [x] 1.2 Em `next.config.ts`, definir `serverActions.bodySizeLimit` como `12mb`. Verificar no arquivo que o limite ficou acima de 10 MiB.
- [x] 1.3 Adicionar em `src/shared/db/schema.ts` as tabelas de `design.md` (instituição, conta, cartão, fatura, anexo, lote, categoria, lançamento, ativo, operação e valor), com checks, FKs e índices descritos lá, e sem coluna de PAN, CVV ou senha. Rodar `npm run db:generate` e verificar que o SQL novo cria essas tabelas e não altera `goal`, `habit` nem tabelas da home.
- [x] 1.4 Aplicar com `npm run db:migrate:test` e verificar que `npm test` segue verde nas suítes que já existiam.
- [x] 1.5 Criar `src/features/finance` com `domain`, `application`, `infra`, `presentation`, `index.ts` e `server.ts`. Verificar que os arquivos existem e que o client barrel não reexporta repositório.

## 2. Domain

- [x] 2.1 Implementar dinheiro em `domain`: centavos `bigint` para BRL, USD e EUR, rejeição do que não fecha em centavo, soma de 10 e 20 centavos igual a 30. Verificar com teste de unidade que a soma não usa ponto flutuante.
- [x] 2.2 Implementar os schemas zod strict de instituição, conta, cartão, categoria, lançamento, fatura, ativo, operação e valor, com os limites e conjuntos fechados dos specs. Verificar com testes que PAN, CVV, senha, `userId` extra, últimos dígitos fora de quatro, moeda fora da lista e parcela incompleta falham sem gravar objeto parcial.
- [x] 2.3 Implementar agregação e saldo de conta em funções puras: despesa líquida, estorno em “Sem categoria”, pagamento e transferência fora do gasto e da receita, lançamento de cartão fora do saldo da conta. Verificar com testes os cenários de `finance-transactions` e `finance-spending`.
- [x] 2.4 Implementar `dedupe_hash` e a marca de duplicata por data, valor, descrição normalizada e por `external_id`. Verificar com teste que a duplicata é só uma marca e que a função não remove a linha.
- [x] 2.5 Implementar posição em `domain/position.ts` com a regra de arredondamento de `design.md`. Verificar com testes compra, venda parcial, venda acima da posição, provento, ajuste e quantidade zero.
- [x] 2.6 Implementar parsers de CSV e OFX no servidor, com o mapa de colunas obrigatório no CSV e a leitura de `STMTTRN` no OFX. Verificar com fixtures sintéticos de conta e de cartão, e com um PDF que não produz linha.

## 3. Contas e cartões

- [x] 3.1 Implementar repositório de instituição, conta e cartão: criar, listar, editar, arquivar, excluir conta só sem filhos, recusar troca de moeda com lançamento e calcular saldo. Verificar no banco de teste o saldo depois de uma despesa e a recusa de excluir conta com lançamento.
- [x] 3.2 Teste de isolamento A/B: A não lê nem altera instituição, conta ou cartão de B.
- [x] 3.3 Actions com `requireUserId()`, mensagens neutras em pt-BR e `refresh()`. Verificar com teste que `userId` do formulário é ignorado e que corpo com CVV não cria cartão.
- [x] 3.4 Páginas `/app/finance/accounts` e `/app/finance/cards`, com formulários e sugestão de instituição que só grava no submit. Verificar no browser criar conta com saldo inicial e cartão com final 1234, sem campo de número completo.

## 4. Lançamentos e categorias

- [x] 4.1 Implementar repositório de categoria e lançamento, inclusive troca de categoria em massa só com ids do usuário e recusa da ação inteira se algum id for alheio. Verificar no banco de teste que parcela 2 de 6 cria uma linha só.
- [x] 4.2 Teste de isolamento A/B de categoria e lançamento.
- [x] 4.3 Actions de lançamento e categoria. Verificar com teste que pagamento de fatura na conta, marcado como saída, não entra no total de despesas.
- [x] 4.4 Páginas `/app/finance/transactions` e `/app/finance/categories`, com busca, filtros e troca de categoria dos selecionados. Verificar no browser criar uma despesa, uma categoria e aplicar essa categoria a dois lançamentos.

## 5. Faturas e arquivos

- [x] 5.1 Implementar `infra/blob-store.ts` com acesso privado e URL assinada de no máximo 900 segundos, conferindo o nome da função no `@vercel/blob` instalado. Testes usam dublê. Verificar com teste que a chave de armazenamento não volta na resposta do repositório para a UI.
- [x] 5.2 Implementar fatura e anexo: um arquivo, allowlist, 10 MiB, magic bytes, checksum, substituir arquivo, apagar só o anexo e apagar anexo mais lançamentos importados só com confirmação explícita. Verificar no banco de teste que apagar só o anexo preserva o lançamento importado e o lançamento manual.
- [x] 5.3 Rota `GET /app/finance/statements/[id]/file`, lendo o guia de Route Handlers em `node_modules/next/dist/docs/` antes de escrever. Sem sessão não entrega arquivo. Usuário B não baixa fatura de A. Verificar com teste do handler.
- [ ] 5.4 Páginas `/app/finance/statements`, `/new` e `/[id]`, com estado, total informado ou “não informado”, e as duas exclusões separadas. Verificar no browser anexar um PDF, baixar o mesmo arquivo e excluir só o anexo.

## 6. Importação

- [x] 6.1 Gravar prévia em `import_batch` sem criar `transaction`, e exigir mapa novo a cada CSV. Verificar com teste que sair sem confirmar não deixa lançamento e que a segunda importação não reaproveita o mapa sozinha.
- [x] 6.2 Confirm e desfazer no `db.batch`, com teto de 2000 linhas, moeda incompatível recusada, duplicata salva como linha nova e status da fatura. Verificar com testes a diferença contra o total informado, o pagamento fora da soma conferida, o desfazer que preserva lançamento manual e a falha que não grava parte.
- [ ] 6.3 Página `/app/finance/statements/[id]/import` com revisão editável, duplicatas marcadas e conferência. Verificar no browser importar um CSV, ignorar uma linha, confirmar e desfazer o lote.

## 7. Gastos e visão geral

- [x] 7.1 Montar o resumo por data da compra, as quebras por categoria, conta e cartão, e a visão geral (mês no fuso do usuário, saldo das contas, próximo vencimento, patrimônio só com valor informado). Verificar com teste que duas moedas não se somam e que “Sem categoria” aparece.
- [x] 7.2 Páginas `/app/finance` e `/app/finance/spending` com gráfico SVG e tabela dos mesmos números, período, moeda e origem visíveis. Verificar no browser que a tabela repete os valores do gráfico e que o mês vazio não usa linguagem de falha.

## 8. Investimentos

- [x] 8.1 Repositório de ativo, operação e valor, com posição calculada na leitura e valor atual pela data no fuso do usuário. Verificar no banco de teste que preço médio não aparece como valor atual quando não há informe.
- [x] 8.2 Teste de isolamento A/B de ativo, operação e valor.
- [x] 8.3 Actions e páginas `/app/finance/investments` e `/[id]`, agrupando por classe, instituição e ativo, sem texto de recomendação. Verificar no browser registrar uma compra e um valor manual e ver a data desse valor na carteira.

## 9. Exportação e encaixe

- [x] 9.1 `GET /app/finance/export` com JSON versão 1, sessão obrigatória, cartão só com `last4`, sem bytes, sem `storage_key` e sem dados de meta ou hábito. Verificar com teste que o JSON de A não contém conta de B e que a rota não envia e-mail.
- [x] 9.2 Item “Finanças” na sidebar, desktop e faixa estreita, apontando para `/app/finance`. Verificar no browser que o link abre a visão geral.

## 10. Fechamento

- [ ] 10.1 No browser, percorrer o aceite: conta e cartão sem número completo, anexo baixado, CSV revisado e salvo, duplicata sinalizada, diferença do total visível, desfazer, pagamento fora do gasto, gastos com tabela, posição do ativo com data do valor, e um segundo usuário sem ver esses dados. Repetir a visão geral em viewport estreita.
- [x] 10.2 Rodar `npm test` e deixar verdes as suítes de finanças no banco de teste, sem leitura do banco de uso real.
