## Why

Pilares são a estrutura central do Segundo Cérebro: metas e hábitos (próximas fatias) precisam se relacionar a eles, e cada meta precisa de um horizonte temporal definido pelo usuário (RF-021), sem durações fixas. Sem pilares e horizontes cadastrados, as fatias de metas e hábitos não têm onde se apoiar. O roadmap (Fase 1) exige criar, editar e arquivar pilares (RF-010 a RF-013).

## What Changes

- Nova entidade `pillar` por usuário: nome, descrição opcional, cor opcional, ícone opcional, `sort_order` e estado ativo/arquivado.
- Tela de pilares (`/app/pillars`, equivalente a `/pilares` do protótipo Base44): lista ordenada de pilares ativos com ícone em bloco colorido, ações Abrir, Editar e Arquivar; botão "Novo pilar"; seção de arquivados com Desarquivar.
- Reordenação de pilares ativos (mover para cima/para baixo).
- Detalhe do pilar (`/app/pillars/[id]`): cabeçalho com nome, ícone, cor, descrição e estado; ações editar, arquivar/desarquivar e excluir definitivamente com confirmação; espaço reservado para metas e hábitos do pilar (preenchido nas próximas fatias). Estado "Pilar não encontrado" para id inexistente ou de outro usuário.
- Criação e edição de pilar em páginas próprias (`/app/pillars/new`, `/app/pillars/[id]/edit`).
- Nova entidade `horizon` por usuário (nome e `sort_order`), sem duração fixa codificada.
- Horizontes padrão `Curto`, `Médio`, `Longo`, `Contínuo` criados automaticamente uma única vez por usuário; podem ser renomeados, reordenados e excluídos, e o usuário pode criar novos. Excluir todos não recria os padrões.
- Tela de horizontes (`/app/horizons`), equivalente aos "Rótulos" do protótipo; futuramente acessível também a partir da tela de metas.
- Links para Pilares e Horizontes na home `/app`.
- Testes de isolamento entre usuários para `pillar` e `horizon`.

## Capabilities

### New Capabilities
- `pillars`: cadastro, edição, ordenação, arquivamento, detalhe e exclusão de pilares do usuário.
- `goal-horizons`: horizontes temporais configuráveis pelo usuário, com padrões iniciais editáveis e apagáveis, a serem usados pelas metas.

### Modified Capabilities
<!-- Nenhuma: o requisito "Isolamento verificado por testes automatizados" de `data-isolation` já exige testes para cada nova entidade; os cenários específicos ficam nas specs novas. -->

## Impact

- Banco: novas tabelas `pillar` e `horizon` (FK `user_id` com `on delete cascade`); nova coluna `horizons_seeded_at` em `user_preference`. Migração Drizzle aditiva.
- Código: `src/db/schema.ts`, novos módulos de dados `src/db/pillars.ts` e `src/db/horizons.ts`, validação compartilhada, rotas `src/app/app/pillars/**` e `src/app/app/horizons/**` com Server Actions, links em `src/app/app/page.tsx`.
- Dependência nova: `lucide-react` para o conjunto fechado de ícones de pilar (mesma família visual do protótipo).
- Testes: novas suítes Vitest contra a branch Neon de teste.
- Fora do escopo: seleção de pilares sugeridos no onboarding, metas, hábitos, contadores "N metas · N hábitos" e abas do detalhe (dependem dessas entidades), arrastar para reordenar, sidebar/shell de navegação, API REST `/api/pillars`.
