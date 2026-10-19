## Purpose

Mostra na home, no primeiro bloco, o que falta hoje — check-in, hábitos sem registro e medicamentos pendentes — com caminho para o check-in de hoje e para um dia anterior, em linguagem sem culpa.

## ADDED Requirements

### Requirement: Check-in de hoje visível ao abrir
A home do usuário autenticado SHALL mostrar o estado do check-in de hoje no fuso das preferências. Se existe check-in nessa data, o estado MUST ser registrado. Se não existe, o estado MUST ser ainda sem registro. Ausência MUST NOT ser exibida como falha, atraso ou punição. O bloco MUST oferecer um link para `/app/check-in` sem query de data, correspondente a hoje.

#### Scenario: Check-in já salvo
- **WHEN** o usuário abre `/app` e já existe check-in na data de hoje no fuso dele
- **THEN** o primeiro bloco indica que o check-in de hoje está registrado

#### Scenario: Ainda sem check-in
- **WHEN** o usuário abre `/app` e não existe check-in hoje
- **THEN** o bloco indica que o check-in de hoje ainda está sem registro
- **AND** não usa as palavras falha, atraso, atrasado ou "você não fez"
- **AND** o link de hoje aponta para `/app/check-in`

### Requirement: Hábitos pendentes de hoje
A home SHALL listar os hábitos ativos aplicáveis a hoje que ainda não têm registro nesse dia. Hábito com registro feito ou não realizado MUST NOT entrar nessa lista. A lista MUST mostrar o nome de cada pendente, até cinco nomes, e, se houver mais, um indicativo de quantos faltam com caminho para o check-in. Se não há hábito aplicável, ou se todos já têm registro, o bloco MUST dizer isso de forma neutra e MUST NOT mostrar zero como falha.

#### Scenario: Só o que não tem registro
- **WHEN** hoje tem três hábitos aplicáveis, um feito, um não realizado e um sem registro
- **THEN** a lista de pendentes contém só o hábito sem registro

#### Scenario: Nenhum hábito no dia
- **WHEN** nenhum hábito ativo se aplica a hoje
- **THEN** o bloco não trata o dia como falha
- **AND** não exibe uma contagem punitiva de zero

### Requirement: Medicamentos pendentes de hoje
A home SHALL listar as ocorrências de medicamento de hoje que estão pendentes (sem log), com nome e horário de referência, até cinco itens, e o restante indicado com caminho para o check-in. Ocorrência já marcada como realizada ou não realizada MUST NOT aparecer como pendente. Se o usuário não tem medicamento ativo que gere ocorrência hoje, o bloco MUST explicar que dá para cadastrar e MUST linkar para `/app/medications`, sem tratar a ausência de cadastro como falta ou falha. A copy MUST NOT aconselhar dose, tratamento ou horário médico.

#### Scenario: Tomada ainda sem marca
- **WHEN** hoje tem uma ocorrência às `08:00` sem log e outra já realizada
- **THEN** a lista de pendentes mostra só a das `08:00`, com o nome do medicamento

#### Scenario: Sem medicamento cadastrado
- **WHEN** o usuário não tem medicamento que gere ocorrência hoje
- **THEN** o bloco não conta isso como pendência nem como falha
- **AND** oferece caminho para cadastrar em `/app/medications`

### Requirement: Atalho para dia anterior
A home SHALL oferecer um segundo link, distinto do check-in de hoje, para preencher um dia anterior. O destino MUST ser `/app/check-in?date=` com a data de ontem no fuso do usuário. Os dois links MUST estar no mesmo bloco do resumo de hoje.

#### Scenario: Ontem não é o link de hoje
- **WHEN** hoje no fuso do usuário é `2026-10-19` e ele vê a home
- **THEN** um link vai para `/app/check-in`
- **AND** o outro vai para `/app/check-in?date=2026-10-18`

### Requirement: Resumo no primeiro olhar, mobile-first
O resumo de hoje — estado do check-in, hábitos pendentes, medicamentos pendentes e os dois links — MUST aparecer antes de metas, áreas e próximos passos. Num viewport de 390px de largura, esse resumo MUST ser o primeiro conteúdo após a saudação e MUST ser legível sem rolagem horizontal. Alvos de toque dos dois links MUST ser utilizáveis nesse viewport. A pessoa MUST conseguir identificar o que falta hoje a partir só desse bloco, sem abrir outra página.

#### Scenario: Celular mostra o que falta primeiro
- **WHEN** o usuário abre `/app` num viewport de 390px de largura, com check-in ausente, um hábito sem registro e uma tomada pendente
- **THEN** esses três fatos e os dois links aparecem antes dos cards de metas e áreas
- **AND** não há rolagem horizontal

### Requirement: Isolamento do resumo
O resumo SHALL usar somente dados do usuário da sessão. Hábitos, check-in e medicamentos de outra pessoa MUST NOT aparecer, mesmo na mesma data.

#### Scenario: Home de A ignora B
- **WHEN** B tem check-in, hábito sem registro e medicamento pendente hoje, e A abre a home
- **THEN** A vê só o próprio estado
- **AND** nomes e horários de B não aparecem
