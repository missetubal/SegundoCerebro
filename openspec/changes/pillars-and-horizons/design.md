## Context

Estado atual (após a Fatia 1, capabilities `user-preferences` e `data-isolation`):

- `src/db/schema.ts`: tabelas do Auth.js e `user_preference` (`user_id` PK/FK cascade, `timezone`, `journal_template`, timestamps). Migração única `drizzle/0000_*`.
- Dados: `src/db/<entidade>.ts` com `import 'server-only'` e `userId` como primeiro parâmetro; `getPreferences` faz get-or-create com `on conflict do nothing`.
- Identidade: `requireUserId()` em `src/lib/session.ts` (redireciona para `/signin`). Server Actions com `useActionState`, `zod`, mensagens neutras em pt-BR e `refresh()` de `next/cache`.
- Páginas: shell estático + componente async dentro de `<Suspense>` (`cacheComponents: true`). Acessar `params` fora de `<Suspense>` quebra o prerender (`node_modules/next/dist/docs/01-app/02-guides/building.md`).
- Testes: Vitest contra a branch Neon de teste; `createUserFixtures()` com cleanup por cascade; actions testadas mockando `@/auth`, `next/cache` e `next/navigation`.
- Driver `neon-http`: sem transação interativa; só statements isolados ou `db.batch`.
- Referência visual: protótipo Base44 (`/pilares`, `/pilares/:id`, "Rótulos" em `/metas`). Lista: linha com alça de arrastar, ícone em bloco colorido, nome, "N metas · N hábitos", ações Abrir / editar (lápis) / arquivar. Detalhe: link "← Pilares", sobretítulo "PILAR", nome, abas e contadores; estado "Pilar não encontrado" com "Voltar para pilares".

Requisitos: `specs/pillars/spec.md` e `specs/goal-horizons/spec.md`. Motivação: `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Repetir o padrão da Fatia 1 (dados com `userId` obrigatório, Server Actions, testes de isolamento) para duas entidades com lista ordenada.
- Aproximar a UI do protótipo no que não depende de metas/hábitos (layout da lista, bloco de ícone colorido, cabeçalho do detalhe, estado não encontrado).
- Garantir atomicidade das operações críticas (seed único, inserção no fim da lista) com um único statement SQL.

**Non-Goals:**
- Arrastar para reordenar (a alça do protótipo vira botões subir/descer).
- Abas, contadores e listas de metas/hábitos no detalhe e na lista.
- Shell com sidebar/navegação inferior do protótipo (fatia própria).
- Endpoints REST, seed de pilares sugeridos (onboarding), vínculo meta↔horizonte/pilar.

## Decisions

### 1. Tabela `horizon` própria
`horizon(id, user_id, name, sort_order, created_at, updated_at)`. Metas futuras terão `horizon_id` com `on delete set null`: renomear reflete em todas as metas e excluir não apaga metas.
- Alternativa: array/JSON de labels em `user_preference`. Rejeitada: renomear exigiria reescrever o rótulo em cada meta e não há FK para manter consistência.

### 2. Schema
- `pillar(id text PK uuid, user_id text FK→user cascade, name text, description text null, color text null, icon text null, sort_order integer, archived_at timestamptz null, created_at, updated_at)`.
- Estado derivado de `archived_at` (`null` = ativo); guarda a data de arquivamento sem coluna extra. Alternativa `status text` rejeitada por duplicar informação.
- Índice único `(user_id, lower(name))` em `pillar` e em `horizon`. A camada de dados captura `23505` e devolve `{ ok: false, reason: 'duplicate_name' }`; checar antes de inserir teria corrida.
- Índice `(user_id, sort_order)`; `sort_order` sem unicidade (permite troca de par num statement).
- `user_preference.horizons_seeded_at timestamptz null`.

### 3. Cor e ícone como chaves de conjuntos fechados
- As chaves e rótulos pt-BR ficam em `src/lib/pillar-options.ts` (sem dependências de UI, usado pela validação); `src/lib/pillar-style.ts` mapeia chaves para estilos e componentes.
- `color` guarda uma chave de paleta (`blue`, `amber`, `emerald`, `rose`, `sky`, `violet`, `teal`, `orange`, `slate`), mapeada em `src/lib/pillar-style.ts` para classes Tailwind estáticas (fundo claro + cor do ícone, com variante dark), como os blocos do protótipo.
- `icon` guarda uma chave de um conjunto curado (~20: `briefcase`, `rocket`, `heart-pulse`, `users`, `wallet`, `sparkles`, `book-open`, `palette`, `home`, `dumbbell`, `graduation-cap`, `leaf`…) mapeada para componentes de `lucide-react`; sem ícone usa `compass` (ícone neutro do protótipo).
- Alternativas: hex livre (`<input type="color">`) e emoji livre. Rejeitadas: Tailwind não gera classes dinâmicas (exigiria `style` inline e cuidado com contraste/dark mode) e o protótipo usa ícones de traço, não emoji. Chaves desconhecidas vindas do banco (ex.: removidas do conjunto no futuro) caem no padrão neutro.
- Nova dependência `lucide-react`; importar ícones individualmente para tree-shaking.

### 4. Seed de horizontes com claim atômico
`listHorizons(userId)` chama `getPreferences(userId)` (garante a linha) e executa:

```sql
with claimed as (
  update user_preference set horizons_seeded_at = now()
  where user_id = $1 and horizons_seeded_at is null
  returning user_id
)
insert into horizon (id, user_id, name, sort_order)
select gen_random_uuid()::text, claimed.user_id, d.name, d.sort_order
from claimed cross join (values ('Curto',1),('Médio',2),('Longo',3),('Contínuo',4)) d(name, sort_order);
```

Só quem vence o `update` insere; é um statement, logo atômico. Excluir tudo depois não recria.
- Alternativas: seed no evento `createUser` (não cobre usuários existentes) e seed quando a tabela está vazia (recriaria após o usuário apagar tudo).

### 5. Ordem: append e troca em statement único
- Criar/desarquivar: `sort_order = coalesce((select max(sort_order) from pillar where user_id = $1 and archived_at is null), 0) + 1` dentro do `insert`/`update`. Horizontes: mesmo padrão sem filtro de arquivado.
- Mover: ler os ids ativos do usuário (ordem `sort_order, created_at, id`), trocar o item com o vizinho em memória (`moveInOrder` em `src/db/ordering.ts`) e renumerar a lista inteira com um único `update ... set sort_order = case id when ... end where user_id = $u and id in (...)`. Renumerar normaliza empates deixados por corridas (uma troca de par com valores iguais não mudaria nada). Sem vizinho → no-op.
- Alternativa: lexorank/fracionário. Rejeitada: complexidade desnecessária para dezenas de itens.

### 6. Camada de dados
- `src/db/pillars.ts`: `listPillars(userId)` → `{ active, archived }`; `getPillar(userId, id)`; `createPillar`; `updatePillar`; `movePillar(userId, id, 'up' | 'down')`; `archivePillar`; `unarchivePillar`; `deletePillar`.
- `src/db/horizons.ts`: `listHorizons` (com seed), `createHorizon`, `renameHorizon`, `moveHorizon`, `deleteHorizon`.
- Toda query filtra por `user_id`. Operações por id retornam `null`/`false` quando nada casa, sem distinguir inexistente de alheio. `updated_at = now()` em toda alteração.

### 7. Validação compartilhada
`src/lib/validation/pillar.ts` e `src/lib/validation/horizon.ts` (com helpers de formulário em `src/lib/validation/form.ts`) com `zod`: trim; nome 1–60 (pilar) / 1–40 (horizonte); descrição ≤ 500; `color`/`icon` como `z.enum` das chaves; string vazia vira `null`. Usado pelas actions; a camada de dados recebe dados validados.

### 8. Rotas e UI
- `/app/pillars`: cabeçalho "ESTRUTURA / Pilares" com subtítulo e botão "Novo pilar"; linhas no estilo do protótipo (bloco de ícone, nome, descrição curta no lugar dos contadores) com subir/descer, Abrir, Editar e Arquivar; `<details>` "Arquivados" com Desarquivar; estado vazio.
- `/app/pillars/new` e `/app/pillars/[id]/edit`: formulário client compartilhado (`PillarForm`) com nome, descrição, grade de cores (com "Sem cor") e grade de ícones (com "Sem ícone"), via radio buttons acessíveis. Após salvar, `redirect` para o detalhe.
- `/app/pillars/[id]`: "← Pilares", sobretítulo "PILAR", ícone, nome, descrição, selo "Arquivado" quando for o caso; ações Editar, Arquivar/Desarquivar, Excluir; card neutro "Metas e hábitos deste pilar aparecerão aqui."
- Páginas com `[id]` passam a promise `params` para um componente async dentro de `<Suspense>`; `notFound()` quando `getPillar` retorna `null`, com `not-found.tsx` do segmento exibindo "Pilar não encontrado" + "Voltar para pilares".
- `/app/horizons`: lista com renomear inline, subir/descer, excluir e formulário de criação; subtítulo "Curto, médio e longo prazo são rótulos seus — sem durações fixas no sistema."
- Server Actions em `actions.ts` de cada rota. Ações por item recebem `id` em campo oculto, nunca `userId`. Id inexistente/alheio → mesma mensagem "Item não encontrado".
- Exclusão: client component com `<dialog>` nativo; o `form` de exclusão só existe dentro do diálogo. Texto sugere arquivar como alternativa. Após excluir pilar, `redirect('/app/pillars')`.
- Links "Pilares" e "Horizontes" em `/app`.
- Consultar `node_modules/next/dist/docs/01-app/02-guides/forms.md` e `.../03-file-conventions/dynamic-routes.md` antes de implementar.

### 9. Testes
- `src/db/pillars.test.ts`, `src/db/horizons.test.ts`: ordem, append, mover (incl. limites), arquivar/desarquivar no fim, duplicado case-insensitive (incl. arquivado), seed único com `Promise.all`, excluir todos não recria, isolamento A/B incluindo operações por id de B executadas como A.
- `src/lib/validation/*.test.ts`: limites, trim, vazio→`null`, chaves inválidas.
- `actions.test.ts` por rota: validação, mensagens neutras, `id` de B com sessão de A não altera B, sem sessão redireciona.

## Risks / Trade-offs

- [Corrida em reordenação gera empate de `sort_order`] → desempate por `created_at, id`; a próxima movimentação renumera a lista. Aceitável para uso individual.
- [`lower(name)` não normaliza acentos] → aceitável; spec declara que acentos diferenciam.
- [Seed depende da linha em `user_preference`] → `listHorizons` chama `getPreferences` (get-or-create idempotente) antes.
- [Chave de cor/ícone removida do conjunto no futuro] → renderização cai no padrão neutro; validação só rejeita na escrita.
- [Exclusão de pilar hoje não tem dependentes; metas/hábitos terão] → a fatia de metas/hábitos MUST revisar a exclusão (bloquear, desvincular ou cascatear) e o texto de confirmação.
- [Botões subir/descer são menos fluidos que arrastar] → acessíveis e funcionam no mobile; arrastar pode ser adicionado depois sem mudar o modelo.

## Migration Plan

1. Alterar `src/db/schema.ts`, `npm run db:generate` (migração `0001_*`), revisar SQL (índices funcionais `lower(name)`).
2. `npm run db:migrate:test` e rodar testes.
3. `npm run db:migrate` no banco real antes do deploy. Migração aditiva (tabelas novas + coluna nullable); código anterior segue funcionando.
4. Rollback: reverter o código; tabelas e coluna novas são inofensivas para a versão anterior.
