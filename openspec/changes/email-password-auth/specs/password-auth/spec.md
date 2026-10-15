## Purpose

Permite criar conta e entrar no Segundo Cérebro com e-mail e senha, guardando a senha de forma segura e limitando tentativas de adivinhação, sem prejudicar o login com Google.

## ADDED Requirements

### Requirement: Cadastro com e-mail e senha
O sistema SHALL permitir criar uma conta informando nome, e-mail e senha. O nome MUST ter de 1 a 80 caracteres após remover espaços nas extremidades. O e-mail MUST ter formato válido e ser guardado sem espaços nas extremidades e em minúsculas. A senha MUST ter de 8 a 128 caracteres e não sofre nenhuma transformação. Ao concluir o cadastro, o usuário MUST estar autenticado e ser levado para a área logada.

#### Scenario: Cadastro bem-sucedido
- **WHEN** um visitante se cadastra com nome "Ana", e-mail " Ana@Exemplo.com " e uma senha de 12 caracteres
- **THEN** a conta é criada com o e-mail "ana@exemplo.com"
- **AND** o visitante entra na área logada como "Ana"

#### Scenario: Senha curta
- **WHEN** um visitante tenta se cadastrar com uma senha de 7 caracteres
- **THEN** nenhuma conta é criada
- **AND** o sistema informa que a senha precisa ter pelo menos 8 caracteres

#### Scenario: E-mail inválido
- **WHEN** um visitante tenta se cadastrar com o e-mail "ana@"
- **THEN** nenhuma conta é criada
- **AND** o sistema pede um e-mail válido

### Requirement: Cadastro com e-mail já existente
O sistema MUST impedir o cadastro com um e-mail que já pertence a outra conta, comparando sem diferenciar maiúsculas de minúsculas. A recusa MUST usar a mesma mensagem para contas com senha e contas Google, orientando a entrar com e-mail e senha ou com Google, sem revelar qual método a conta existente usa. Nenhum dado da conta existente MUST ser alterado.

#### Scenario: E-mail de conta com senha
- **WHEN** já existe uma conta com senha para "ana@exemplo.com" e um visitante tenta se cadastrar com "ANA@exemplo.com"
- **THEN** nenhuma conta é criada
- **AND** o sistema orienta a entrar com e-mail e senha ou com Google

#### Scenario: E-mail de conta Google
- **WHEN** já existe uma conta Google para "bia@exemplo.com" e um visitante tenta se cadastrar com esse e-mail
- **THEN** nenhuma conta é criada nem recebe senha
- **AND** o sistema mostra a mesma mensagem do cenário de conta com senha

### Requirement: Login com e-mail e senha
O sistema SHALL autenticar o usuário que informar o e-mail (sem diferenciar maiúsculas de minúsculas) e a senha corretos de uma conta com senha, levando-o para a área logada. Quando o e-mail não existe, a conta não tem senha ou a senha está errada, o sistema MUST exibir a mesma mensagem genérica, sem indicar qual dado está incorreto.

#### Scenario: Credenciais corretas
- **WHEN** a usuária com conta "ana@exemplo.com" entra com esse e-mail e a senha correta
- **THEN** ela é levada para a área logada com a própria conta

#### Scenario: Senha errada ou e-mail desconhecido
- **WHEN** alguém entra com a senha errada para "ana@exemplo.com", ou com o e-mail inexistente "zz@exemplo.com"
- **THEN** o login é recusado nos dois casos com a mesma mensagem "E-mail ou senha incorretos."

#### Scenario: Conta só Google tentando senha
- **WHEN** alguém tenta entrar com senha usando o e-mail de uma conta que só usa Google
- **THEN** o login é recusado com a mesma mensagem genérica

### Requirement: Limite de tentativas de senha
O sistema MUST recusar tentativas de login com senha para um e-mail que acumulou 5 tentativas com senha incorreta nos últimos 15 minutos, mesmo que a nova senha esteja correta, até que a janela de 15 minutos deixe de conter 5 falhas. A recusa MUST usar uma mensagem neutra pedindo para tentar mais tarde. O limite MUST afetar apenas o login com senha daquele e-mail; o login com Google MUST continuar funcionando.

#### Scenario: Bloqueio após falhas
- **WHEN** ocorrem 5 tentativas com senha errada para "ana@exemplo.com" em 10 minutos e, em seguida, uma tentativa com a senha correta
- **THEN** a sexta tentativa é recusada com a mensagem para tentar mais tarde

#### Scenario: Outros e-mails não são afetados
- **WHEN** "ana@exemplo.com" está bloqueado e a usuária de "bia@exemplo.com" entra com a senha correta
- **THEN** o login de "bia@exemplo.com" funciona normalmente

#### Scenario: Janela expirada
- **WHEN** as 5 falhas de "ana@exemplo.com" têm mais de 15 minutos
- **THEN** o login com a senha correta funciona

### Requirement: Armazenamento seguro da senha
O sistema MUST guardar a senha apenas como hash gerado por função de derivação lenta com salt aleatório por senha. A senha em texto puro MUST não ser gravada no banco, em logs ou em mensagens de erro, e o hash MUST não ser enviado ao navegador nem incluído na sessão.

#### Scenario: Banco sem senha em texto
- **WHEN** uma conta é criada com a senha "correct horse battery"
- **THEN** nenhum campo do banco contém "correct horse battery"
- **AND** duas contas com a mesma senha têm hashes diferentes

### Requirement: Convivência com login Google
O login com Google SHALL continuar funcionando para contas Google. Uma conta criada com senha MUST não ser acessada por login Google com o mesmo e-mail; nesse caso o sistema MUST recusar o login Google e orientar a entrar com e-mail e senha.

#### Scenario: Conta Google continua entrando
- **WHEN** um usuário com conta Google clica em "Entrar com Google"
- **THEN** ele entra na mesma conta e vê os mesmos dados de antes

#### Scenario: Google com e-mail de conta com senha
- **WHEN** existe conta com senha para "ana@exemplo.com" e alguém tenta entrar com Google usando esse e-mail
- **THEN** o login Google é recusado
- **AND** a página de login orienta a entrar com e-mail e senha

### Requirement: Sessão identifica o usuário em todas as formas de login
Após entrar por qualquer método, a sessão MUST identificar o usuário pelo mesmo identificador interno usado no isolamento de dados, de modo que todas as regras de `data-isolation` continuem valendo. Sair MUST encerrar a sessão no navegador.

#### Scenario: Dados isolados após login com senha
- **WHEN** a usuária "ana@exemplo.com" entra com senha e abre suas preferências
- **THEN** vê apenas os próprios dados

#### Scenario: Sair
- **WHEN** a usuária clica em "Sair" e depois acessa a área logada
- **THEN** é levada para a página de login
