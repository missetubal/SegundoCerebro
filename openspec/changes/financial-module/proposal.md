## Why

O Segundo Cérebro já organiza áreas, metas, hábitos e check-ins, mas não guarda contas, faturas nem a carteira. Gastos e investimentos ficam fora do app, e a área Finanças não tem dados próprios para consultar. Esta change entrega o núcleo manual e por arquivo, sem banco conectado e sem aconselhamento.

## What Changes

- Cadastro de instituições, contas e cartões. O cartão guarda só os 4 últimos dígitos. Número completo, CVV e senha não existem no modelo.
- Fatura ou extrato com arquivo privado (PDF, CSV, OFX ou imagem), período e total informado. O dono vê e baixa o arquivo. Dá para apagar só o anexo ou, com confirmação explícita, o anexo e os lançamentos daquela importação.
- Importação de CSV e OFX só depois de revisão. O usuário edita, ignora ou exclui linhas. Duplicados (mesma conta ou cartão, data, valor e descrição) são sinalizados e não somem sozinhos. A tela mostra a diferença entre o total informado e a soma importada. A importação inteira pode ser desfeita, removendo só os lançamentos dela.
- Lançamentos manuais e categorias do usuário. Dá para trocar a categoria de vários lançamentos de uma vez. Tipos: despesa, receita, estorno, pagamento de fatura e transferência. Pagamento de fatura e transferência não entram em gasto nem em receita. Estorno reduz o gasto da categoria. Data da compra e competência da fatura ficam separadas.
- Visão geral com gasto do mês, próximo vencimento de cartão, saldo por conta e patrimônio informado. Resumo do mês, gastos por categoria, conta e cartão, e lista com busca e filtros. Lançamento sem categoria aparece como "Sem categoria". Todo gráfico mostra período, moeda e origem, e tem tabela equivalente.
- Carteira manual: ativos, operações (compra, venda, provento, ajuste), posição calculada (quantidade e preço médio) e valor atual informado pelo usuário, com a data dessa atualização. Sem valor informado, a tela não trata custo médio como cotação.
- Exportação JSON só dos dados financeiros do próprio usuário, pronta para entrar numa exportação global que ainda não existe.
- Cada valor tem moeda explícita (BRL, USD ou EUR). Não há conversão. Totais e gráficos não misturam moedas.
- Instituição é cadastro do usuário, com nome livre. A interface pode sugerir nomes comuns, sem catálogo fechado.

Fora desta change: movimentar dinheiro, Open Finance, cotação automática, PDF que vira lançamento, IA, parcelamento projetado, reutilizar mapeamento de colunas, tags, metas com métrica calculada, cartões financeiros na home, resumo na revisão mensal, hábito ligado a gasto, orçamento, rentabilidade, renda fixa com vencimento e taxa, criptografia de campo, compartilhamento entre usuários e recomendação financeira.

## Capabilities

### New Capabilities

- `finance-accounts`: instituições, contas e cartões, com arquivamento, exclusão segura e proibição de dado sensível de cartão.
- `finance-statements`: fatura ou extrato, anexo privado, estados e exclusão do arquivo sem apagar lançamento, salvo confirmação explícita.
- `finance-import`: importação CSV e OFX com revisão, duplicados sinalizados, conferência do total e desfazer o lote.
- `finance-transactions`: lançamento manual, categorias e regras de agregação (pagamento e transferência fora do gasto; estorno reduz a categoria).
- `finance-spending`: resumo do período, quebras por categoria, conta e cartão, filtros e alternativa em tabela.
- `finance-investments`: ativos, operações, posição, valor informado com data e carteira por classe, instituição e ativo.
- `finance-export`: exportação JSON do módulo, só do usuário da sessão, sem URL permanente.

### Modified Capabilities

- Nenhuma. `goals`, `habits`, `home-dashboard`, `data-isolation`, `user-preferences` e `medications` não mudam de requisito. O isolamento A/B das entidades novas fica nas capabilities de finanças. Tags, revisão mensal e exportação global ainda não têm spec.

## Impact

- Banco: tabelas novas de finanças, migração Drizzle aditiva. `goal`, `habit` e a home não ganham coluna.
- Código: feature `src/features/finance/**`, rotas em `/app/finance/**`, item na navegação. Actions com `userId` só da sessão.
- Arquivo: Vercel Blob privado e URL assinada temporária. Sem armazenamento de arquivo hoje.
- Exportação global, dashboard, metas e hábitos continuam como estão. O JSON financeiro fica isolado até existir a exportação do app.
- Privacidade: descrição, valor e conteúdo de fatura fora de log e de e-mail. A revisão de LGPD antes de abrir o produto a outras pessoas continua pendente e não é implementada aqui.
