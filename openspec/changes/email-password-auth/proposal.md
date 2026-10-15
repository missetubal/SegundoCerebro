## Why

Hoje só é possível entrar com Google. Quem não usa ou não quer vincular uma conta Google não consegue usar o Segundo Cérebro, e agentes/testes automatizados não conseguem autenticar sem uma conta Google real. Login com e-mail e senha amplia o acesso sem depender de um provedor externo.

## What Changes

- Nova página de cadastro (`/signup`) com nome, e-mail e senha; ao concluir, o usuário entra direto em `/app`.
- Formulário de e-mail e senha na página `/signin`, ao lado do botão "Entrar com Google", com link para o cadastro.
- Senha guardada apenas como hash lento com salt, numa tabela separada da tabela de usuários.
- Mensagem de erro de login genérica (não diz se o e-mail existe ou se a senha está errada).
- Limite de tentativas: após 5 falhas de senha para o mesmo e-mail em 15 minutos, novas tentativas com senha para esse e-mail são recusadas até a janela passar.
- E-mail já ligado a uma conta Google não pode se cadastrar com senha; o usuário é orientado a entrar com Google. Sem verificação de e-mail, liberar isso permitiria que qualquer pessoa tomasse uma conta Google conhecendo só o e-mail.
- Conta criada com senha tentando entrar com Google é bloqueada, com orientação para entrar com e-mail e senha.
- **BREAKING** Sessões passam de registros no banco para sessão JWT criptografada em cookie (exigência do Auth.js para login com credenciais). Todos os usuários logados precisam entrar de novo uma vez após o deploy.

## Capabilities

### New Capabilities
- `password-auth`: cadastro e login com e-mail e senha, armazenamento seguro da senha, limite de tentativas e convivência com o login Google.

### Modified Capabilities
<!-- Nenhuma: `data-isolation` ("Identidade vem apenas da sessão") continua valendo sem mudança de requisito; muda só o mecanismo de sessão. -->

## Impact

- Banco: novas tabelas `user_password` e `login_failure`. Tabela `session` deixa de ser usada (mantida nesta entrega; remoção numa limpeza futura).
- Código: `src/auth.ts` (provider `Credentials`, `session.strategy = 'jwt'`, callback que expõe `session.user.id`), novo módulo de senha e de credenciais em `src/db/`, `src/app/signin/*`, nova rota `src/app/signup/*`.
- Sem novas dependências (hash com `node:crypto` `scrypt`). Sem novas variáveis de ambiente (`AUTH_SECRET` já existe e passa a criptografar o JWT).
- Fora do escopo: verificação de e-mail, "esqueci a senha", troca de senha, vincular senha a conta Google, vincular Google a conta criada com senha, remoção da tabela `session`.
