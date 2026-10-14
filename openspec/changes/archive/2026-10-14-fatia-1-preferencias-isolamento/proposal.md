## Why

A Fatia 0 entregou login Google e a tabela `user_preference`, mas nada lê ou grava preferências, e não existe nenhuma garantia testada de que um usuário não acessa dados de outro. Todas as fatias seguintes (pilares, hábitos, check-in, medicamentos) dependem de um fuso horário confiável por usuário e de um padrão único de acesso a dados filtrado por `user_id` — por isso isso vem antes de qualquer entidade de domínio.

## What Changes

- Preferências do usuário passam a existir sempre: na primeira leitura, se não houver linha em `user_preference`, ela é criada com os defaults (`America/Sao_Paulo`, `minimal`). Cobre usuários já existentes (criados na Fatia 0) sem migração de dados.
- Nova tela `/app/preferences` para ver e alterar o fuso horário (IANA), com sugestão do fuso detectado no navegador. O template global aparece como `minimal`, só leitura nesta fase.
- Gravação via Server Action com validação do fuso (`Intl`), sempre usando o `userId` da sessão no servidor; qualquer identificador vindo do cliente é ignorado.
- Padrão de acesso a dados: funções em `src/db/` que recebem `userId` obrigatório e filtram por ele; helper `requireUserId()` que obtém o usuário da sessão ou redireciona para `/signin`.
- Link para preferências a partir de `/app`.
- Infra de testes: Vitest + banco de teste separado (branch Neon de teste), com testes de isolamento entre dois usuários.

Fora desta change: endpoints REST `GET/PATCH /api/preferences` (docs/06), escolha do template `detailed`, horário de lembrete e preferências de dashboard (RF-003 parcial), onboarding guiado.

## Capabilities

### New Capabilities
- `user-preferences`: preferências globais do usuário (fuso horário e template global) — criação com defaults, leitura, alteração validada do fuso.
- `data-isolation`: regras de acesso a dados por usuário — identidade sempre da sessão, toda leitura/escrita filtrada por `user_id`, e testes automatizados que provam o isolamento.

### Modified Capabilities

(nenhuma — não há specs existentes em `openspec/specs/`)

## Impact

- Código: `src/db/` (nova camada de acesso a preferências), `src/lib/` ou similar (`requireUserId`), `src/app/app/preferences/` (página + Server Action), `src/app/app/page.tsx` (link).
- Schema: sem mudança — `user_preference` já existe com os campos necessários.
- Dependências novas (dev): `vitest`; possivelmente `zod` para validação de entrada.
- Infra: `.env.test` apontando para a branch Neon `dev`, com migrações aplicadas.
- Scripts: `npm test`.
