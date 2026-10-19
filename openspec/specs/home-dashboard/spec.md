# home-dashboard Specification

## Purpose

Mostra na home o que falta no dia corrente — check-in, hábitos e medicamentos — com atalho para o check-in de hoje e para um dia anterior, em layout mobile-first e linguagem sem culpa.

## Requirements

### Requirement: Status do dia na home
A home do usuário autenticado MUST mostrar, para a data de hoje no fuso das preferências, três fatos: se o check-in desse dia existe, quais hábitos aplicáveis ao dia ainda não têm log, e quais ocorrências de medicamento do dia estão pendentes. Check-in feito MUST ser a existência do registro do dia. Hábito em aberto MUST ser hábito aplicável ao dia sem log. Medicamento em aberto MUST ser ocorrência do dia com status pendente. Item já marcado como realizado ou não realizado MUST NOT aparecer como pendente. A home MUST listar cada hábito em aberto pelo nome e cada medicamento em aberto pelo nome e pelo horário da agenda. A leitura MUST usar somente o usuário da sessão.

#### Scenario: Check-in ainda não existe
- **WHEN** o usuário abre a home e não há check-in na data de hoje
- **THEN** o check-in aparece como em aberto
- **AND** a tela não trata essa ausência como falha

#### Scenario: Check-in já salvo
- **WHEN** o usuário abre a home e já existe check-in na data de hoje
- **THEN** o check-in aparece como feito

#### Scenario: Hábito sem log
- **WHEN** um hábito se aplica a hoje e não tem log nessa data
- **THEN** o nome dele aparece entre os hábitos em aberto

#### Scenario: Hábito já registrado
- **WHEN** o hábito do dia já tem log, realizado ou não realizado
- **THEN** ele não aparece entre os pendentes

#### Scenario: Medicamento pendente
- **WHEN** uma ocorrência de hoje está pendente
- **THEN** a home mostra o nome e o horário dessa ocorrência entre os medicamentos em aberto

#### Scenario: Medicamento já marcado
- **WHEN** a ocorrência de hoje está realizada ou não realizada
- **THEN** ela não aparece entre os pendentes

#### Scenario: Nada pendente
- **WHEN** não há hábito nem medicamento em aberto hoje
- **THEN** a home diz que não há pendência para hoje
- **AND** não preenche o dia vazio como falha

### Requirement: Atalhos de check-in e dia anterior
A home MUST oferecer um link para o check-in de hoje e um link para registrar um dia anterior. O link de hoje MUST abrir o check-in na data de hoje. O link do dia anterior MUST abrir o check-in na data de ontem no fuso do usuário. Os dois links MUST permanecer visíveis esteja o dia feito ou em aberto.

#### Scenario: Abrir o check-in de hoje
- **WHEN** o usuário aciona o atalho de check-in de hoje
- **THEN** a tela de check-in abre na data de hoje

#### Scenario: Abrir o dia anterior
- **WHEN** o usuário aciona o atalho de dia anterior
- **THEN** a tela de check-in abre na data de ontem no fuso dele
- **AND** essa data fica explícita como diferente de hoje

### Requirement: Leitura imediata no celular
Em viewport estreito, o status do dia e os dois atalhos MUST aparecer antes de listas secundárias (metas, áreas, próximos passos) e MUST NOT ficar ao lado de uma coluna fixa de navegação que reduza o conteúdo a uma faixa ilegível. A navegação principal MUST continuar acessível nesse viewport.

#### Scenario: Celular mostra o que falta primeiro
- **WHEN** o usuário abre a home em viewport estreito
- **THEN** o status do check-in, os itens em aberto e os dois atalhos aparecem antes das seções de metas e áreas
- **AND** a navegação principal continua alcançável sem a coluna larga do desktop

### Requirement: Linguagem sem culpa
Todo texto visível desta home sobre ausência de registro MUST ser neutro. A interface MUST NOT usar palavras ou ênfase visual de falha, atraso, esquecimento ou cobrança para check-in em aberto, hábito sem log ou medicamento pendente. Medicamento na home MUST NOT incluir dose prescrita pelo sistema nem orientação de conduta.

#### Scenario: Dia em aberto
- **WHEN** o check-in, um hábito ou um medicamento está em aberto
- **THEN** o rótulo visível é neutro, como “em aberto” ou equivalente
- **AND** não há alerta de falha nem texto de cobrança

#### Scenario: Medicamento sem aconselhamento
- **WHEN** a home lista um medicamento pendente
- **THEN** mostra nome e horário
- **AND** não mostra dose prescrita nem recomenda conduta
