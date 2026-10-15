## Context

- `src/auth.ts`: Auth.js v5 (`next-auth@5.0.0-beta.32`) com `DrizzleAdapter` e só o provider Google. Sem `session.strategy`, o Auth.js usa sessão no banco (`session`) porque há adapter.
- `requireUserId()` (`src/lib/session.ts`) lê `session.user.id`. Com sessão no banco, o wrapper do `next-auth` monta `session.user` a partir do usuário do adapter, que inclui `id`.
- O Auth.js recusa o provider `Credentials` com sessão no banco (`UnsupportedStrategy` em `@auth/core/lib/utils/assert.js`) e, com sessão JWT, o callback `session` padrão não copia o `id` (só `name`, `email`, `image`).
- `user.email` tem índice único sensível a maiúsculas; e-mails do Google chegam em minúsculas.
- Driver `neon-http`: sem transação interativa; `db.batch([...])` executa os statements numa transação.
- Sem `proxy`/middleware: cada página da área logada chama `requireUserId()`.

Motivação em `proposal.md`; requisitos em `specs/password-auth/spec.md`.

## Goals / Non-Goals

**Goals:**
- Adicionar login com senha sem quebrar o Google nem o isolamento por `userId`.
- Manter o hash fora do objeto de usuário que o adapter carrega.
- Resistir a força bruta básica sem infraestrutura nova.

**Non-Goals:**
- Verificação de e-mail, recuperação e troca de senha, vincular senha a conta Google, vincular Google a conta criada com senha.
- Revogação de sessão no servidor (JWT expira sozinho).
- Remover a tabela `session` (fica para uma limpeza depois de confirmar que nada a usa).

## Decisions

### 1. Sessão JWT para todos os providers
`session: { strategy: 'jwt' }`. Callback `session` copia `token.sub` (o id do usuário que o Auth.js grava no token em todo login) para `session.user.id`. O adapter continua ativo para criar/ligar usuários e contas Google.
- Alternativa: manter sessão no banco e criar a linha de `session` manualmente no `authorize`/`jwt.encode`. Rejeitada: contorno não suportado, frágil a atualizações da beta.
- Consequência: cookies de sessão antigos (token opaco do banco) deixam de ser válidos; todos entram de novo uma vez.

### 2. Tabela `user_password` separada
`user_password(user_id text PK FK→user cascade, password_hash text not null, created_at, updated_at)`.
- O adapter faz `select *` em `user`; uma coluna `password_hash` em `user` circularia por callbacks e objetos de sessão. Tabela separada mantém o hash restrito ao módulo de credenciais.
- "Conta com senha" = existe linha em `user_password`.

### 3. Hash com `scrypt` do `node:crypto`
Formato `scrypt$<N>$<r>$<p>$<salt base64>$<hash base64>`, `N = 2^15`, `r = 8`, `p = 1`, salt de 16 bytes, chave de 64 bytes, `maxmem` ajustado; comparação com `timingSafeEqual`. Parâmetros no próprio hash permitem endurecer depois sem invalidar senhas antigas.
- Alternativas: `bcrypt`/`argon2` (bindings nativos, atrito no build da Vercel) e `bcryptjs` (dependência nova, limite de 72 bytes). Rejeitadas.
- E-mail desconhecido ou conta sem senha: o `authorize` verifica contra um hash fixo de mentira para manter o tempo de resposta parecido.

### 4. Limite de tentativas em `login_failure`
`login_failure(id, email text, created_at timestamptz)`, índice `(email, created_at)`.
- Antes de verificar a senha: `count(*) where email = $1 and created_at > now() - interval '15 minutes'`; com 5 ou mais, recusa com `RateLimitedSignin`.
- Senha incorreta (ou e-mail sem conta com senha): insere uma falha. Na mesma chamada, apaga falhas com mais de 1 dia (limpeza oportunista).
- Login correto não apaga falhas anteriores (evita que quem acerta de vez em quando zere a contagem do atacante).
- Alternativa: regra de rate limit no Vercel Firewall. Complementar, não substitui: limita por IP, não por e-mail. Fica como recomendação de operação.

### 5. Provider `Credentials` e erros
- `authorize(credentials)`: `zod` valida e normaliza (`trim().toLowerCase()` no e-mail); checa o limite; busca `user` por `lower(email)` com `left join user_password`; verifica hash; retorna `{ id, name, email, image }` ou `null`.
- `null` vira `CredentialsSignin` (mensagem genérica). Limite estourado lança subclasse `RateLimitedSignin extends CredentialsSignin` com `code = 'rate_limited'`.
- Login pela página: Server Action chama `signIn('credentials', { email, password, redirectTo: '/app' })`; captura `AuthError` e devolve mensagem por `code`; relança erros de redirect.
- Google com e-mail de conta com senha: o adapter já lança `OAuthAccountNotLinked` (não usamos `allowDangerousEmailAccountLinking`). `pages.error = '/signin'` faz o Auth.js voltar para `/signin?error=OAuthAccountNotLinked`, e a página exibe a orientação.

### 6. Cadastro
- `/signup` com Server Action: `zod` (nome 1–80, e-mail válido normalizado, senha 8–128).
- Consulta por `lower(email)`: se existe e tem senha → orientar login com senha; se existe sem senha → orientar Google.
- Cria `user` e `user_password` com `db.batch` (transacional). Violação de unicidade em corrida (`23505`) → mesma mensagem de "já existe conta com senha".
- Depois chama `signIn('credentials', …)` para entrar direto em `/app`.
### 7. Módulos
- `src/lib/password.ts`: `hashPassword`, `verifyPassword` (puro, testável).
- `src/lib/validation/credentials.ts`: schemas de cadastro e login.
- `src/db/credentials.ts` (`server-only`): `createPasswordUser`, `findPasswordUserByEmail`, `countRecentLoginFailures`, `recordLoginFailure`.
- `src/lib/credentials-authorize.ts` (`server-only`): função `authorizeCredentials(input)` usada pelo provider, testável sem o Auth.js.
- `src/auth.ts`: provider, estratégia, callbacks, `pages.error`.
- UI: `src/app/signin/*` (formulário client + action), `src/app/signup/*`.

### 8. Testes
- Unidade: `password.test.ts` (verifica certo/errado, salts diferentes, formato inválido), schemas.
- Banco de teste: `credentials.test.ts` (criação em batch, e-mail case-insensitive, Google-only sem senha), `credentials-authorize.test.ts` (sucesso, genérico, bloqueio na 6ª, janela expirada simulando `created_at` antigo, isolamento por e-mail).
- Actions: cadastro e login com `@/auth` mockado (`signIn` lança redirect ou `AuthError`).

## Risks / Trade-offs

- [JWT não pode ser revogado no servidor] → expira em 30 dias (padrão). Excluir usuário não derruba sessões abertas até a expiração; aceitável para app pessoal nesta fase.
- [Todos deslogam no deploy] → comunicar; efeito único.
- [Cadastro revela se um e-mail já tem conta] → decisão do produto (orientar o usuário); login continua genérico.
- [Atacante pode travar o login com senha de alguém por 15 min] → afeta só o login com senha daquele e-mail; Google segue funcionando; janela curta.
- [`scrypt` com `N = 2^15` custa ~50–100 ms e ~32 MB por verificação] → aceitável em Fluid Compute; parâmetros ajustáveis via formato do hash.
- [Sem verificação de e-mail, alguém pode cadastrar um e-mail que não é seu] → o dono real ainda não consegue usar Google com esse e-mail (bloqueio do adapter). Mitigação real depende da futura verificação de e-mail; registrar como follow-up.

## Migration Plan

1. Schema + `npm run db:generate` (`user_password`, `login_failure`); `npm run db:migrate:test`; testes.
2. `npm run db:migrate` no banco real antes do deploy (aditivo).
3. Deploy: sessões antigas deixam de valer; usuários entram de novo.
4. Rollback: reverter o código volta à sessão no banco (usuários entram de novo outra vez); tabelas novas são inofensivas.
