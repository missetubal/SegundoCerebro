## 1. Schema e migração

- [x] 1.1 Adicionar tabelas `pillar` e `horizon` (FK `user_id` cascade, índice único `(user_id, lower(name))`, índice `(user_id, sort_order)`) e coluna `horizons_seeded_at` em `user_preference` em `src/db/schema.ts`; rodar `npm run db:generate` e verificar que o SQL de `drizzle/0001_*` contém as tabelas, os índices funcionais e a coluna nullable
- [x] 1.2 Aplicar com `npm run db:migrate:test` e verificar que `npm test` continua verde (suítes da Fatia 1)

## 2. Validação e estilos de pilar

- [x] 2.1 Instalar `lucide-react` e verificar que `npm install` termina sem erro
- [x] 2.2 Criar `src/lib/pillar-style.ts` com chaves de cor (classes Tailwind estáticas claro/dark) e de ícone (componentes lucide, padrão `compass`), com fallback neutro para chave desconhecida; verificar com teste unitário o fallback
- [x] 2.3 Criar `src/lib/validation/pillar.ts` e `src/lib/validation/horizon.ts` (zod: trim, limites de nome 60/40, descrição ≤ 500, `color`/`icon` como enum das chaves, vazio → `null`); verificar com testes de limites, trim, vazio e chave inválida

## 3. Camada de dados de pilares

- [x] 3.1 Criar `src/db/pillars.ts` com `createPillar` (append no fim dos ativos em um statement, `duplicate_name` em `23505`), `listPillars` (`{ active, archived }` ordenados por `sort_order, created_at`) e `getPillar`; verificar com testes de ordem, append e nome duplicado com outra capitalização e contra pilar arquivado
- [x] 3.2 Adicionar `updatePillar` (sem mudar posição/estado, permite limpar cor/ícone, `updated_at`) e verificar com teste
- [x] 3.3 Adicionar `movePillar(userId, id, 'up' | 'down')` com renumeração da lista ativa em um statement; verificar com testes de mover para cima/baixo e no-op nos limites
- [x] 3.4 Adicionar `archivePillar`, `unarchivePillar` (volta no fim dos ativos) e `deletePillar`; verificar com testes
- [x] 3.5 Teste de isolamento: usuários A e B; `listPillars(A)` não traz B; `getPillar/update/move/archive/unarchive/delete` como A com id de B retornam "não encontrado" e B fica intacto; mesmo nome permitido entre usuários

## 4. Camada de dados de horizontes

- [x] 4.1 Criar `src/db/horizons.ts` com `listHorizons` (chama `getPreferences` e executa o seed por claim em `horizons_seeded_at` num único statement); verificar com testes: primeiro acesso traz Curto/Médio/Longo/Contínuo em ordem, `Promise.all` de duas chamadas gera exatamente 4, excluir todos e listar de novo retorna vazio
- [x] 4.2 Adicionar `createHorizon` (append), `renameHorizon`, `moveHorizon`, `deleteHorizon` com `duplicate_name`; verificar com testes de append, renomear mantendo posição, mover e duplicado case-insensitive
- [x] 4.3 Teste de isolamento: renomear "Curto" de A não altera o de B; operações como A com id de B não têm efeito

## 5. Server Actions

- [ ] 5.1 Criar `src/app/app/pillars/actions.ts` (criar, editar, mover, arquivar, desarquivar, excluir) com `requireUserId()`, validação, mensagens neutras em pt-BR ("Item não encontrado", nome duplicado com sugestão de desarquivar), `refresh()` ou `redirect`; verificar com `actions.test.ts`: entrada inválida não grava, id de B com sessão de A não altera B, `userId` no `FormData` é ignorado, sem sessão redireciona
- [ ] 5.2 Criar `src/app/app/horizons/actions.ts` (criar, renomear, mover, excluir) com o mesmo padrão; verificar com `actions.test.ts` equivalente

## 6. Interface de pilares

- [ ] 6.1 Criar `src/app/app/pillars/page.tsx` (shell estático + lista async em `<Suspense>`): cabeçalho, "Novo pilar", linhas com bloco de ícone colorido, subir/descer, Abrir, Editar, Arquivar, `<details>` "Arquivados" com Desarquivar e estado vazio; verificar no browser criar 3 pilares, reordenar, arquivar e desarquivar, com ordem mantida após recarregar
- [ ] 6.2 Criar `PillarForm` client (`useActionState`; nome, descrição, grade de cores e de ícones com "Sem cor"/"Sem ícone" em radio buttons) usado por `/app/pillars/new` e `/app/pillars/[id]/edit`; verificar no browser criação com cor/ícone, erro de nome vazio e de nome duplicado, e edição removendo ícone
- [ ] 6.3 Criar `/app/pillars/[id]/page.tsx` (params resolvidos dentro de `<Suspense>`, `notFound()` quando `getPillar` é `null`) e `not-found.tsx` com "Pilar não encontrado" + "Voltar para pilares"; verificar no browser detalhe ativo, detalhe arquivado (selo + Desarquivar) e id aleatório mostrando não encontrado
- [ ] 6.4 Criar diálogo de exclusão (`<dialog>` nativo, texto sugerindo arquivar) no detalhe; verificar no browser que cancelar não exclui e confirmar exclui e leva a `/app/pillars`

## 7. Interface de horizontes

- [ ] 7.1 Criar `src/app/app/horizons/page.tsx` com lista (renomear inline, subir/descer, excluir com confirmação), formulário de criação e estado vazio; verificar no browser que o primeiro acesso mostra os 4 padrões, renomear/reordenar/criar persistem e excluir todos não os recria após recarregar

## 8. Navegação e fechamento

- [ ] 8.1 Adicionar links "Pilares" e "Horizontes" em `src/app/app/page.tsx` (e remover "pilares" de "Em breve"); verificar navegação e que `/app/pillars`, `/app/pillars/<id>` e `/app/horizons` sem sessão redirecionam para `/signin`
- [ ] 8.2 Rodar `npm run lint`, `npm test` e `npm run build` e verificar os três verdes (sem erro de prerender nas rotas com `[id]`)
- [ ] 8.3 Aplicar `npm run db:migrate` no banco real e fazer smoke test manual: login, criar/editar/arquivar/excluir pilar, abrir horizontes (padrões criados), renomear um, sair
