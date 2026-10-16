# Experiência e Fluxos

## 1. Princípios de UX

- O check-in deve ser acessível em qualquer momento do dia.
- O usuário pode escolher uma data anterior.
- O fluxo rápido deve reduzir o esforço de journaling.
- Campos opcionais não devem parecer obrigatórios.
- O sistema deve apresentar progresso sem linguagem punitiva.
- O usuário escolhe o que fica em destaque.
- A interface deve ser utilizável em telas pequenas e grandes.

## 2. Navegação principal proposta

A estrutura final de navegação ainda deve ser validada com wireframes. Uma proposta:

- Início / Dashboard;
- Check-in;
- Áreas;
- Metas;
- Hábitos;
- Revisões;
- Histórico;
- Configurações.

## 3. Fluxo de primeiro uso

1. Criar conta e autenticar.
2. Definir fuso horário ou confirmar o detectado.
3. Escolher template minimalista ou detalhado.
4. Selecionar áreas sugeridas ou criar áreas próprias.
5. Criar metas e hábitos — todos opcionais no onboarding.
6. Escolher componentes prioritários do dashboard.
7. Configurar lembretes por e-mail, se desejar.

O onboarding não deve obrigar o usuário a cadastrar todos as áreas, metas ou hábitos antes de usar o sistema.

## 4. Fluxo de check-in rápido

1. Abrir “Check-in”.
2. Confirmar ou selecionar a data.
3. Registrar os hábitos que deseja atualizar.
4. Escrever uma nota geral opcional.
5. Salvar.

A ausência de dados em outros hábitos não deve impedir o salvamento.

## 5. Fluxo de check-in detalhado

Além do fluxo rápido, pode apresentar:

- Registro geral do dia;
- Hábitos aplicáveis;
- Dados quantitativos;
- Gratidão;
- Aprendizados;
- Reflexão livre;
- Tags ou associações, quando habilitadas.

As seções de gratidão, aprendizados e reflexão devem poder ser expandidas individualmente.

## 6. Fluxo retroativo

1. Abrir o calendário ou seletor de data.
2. Selecionar um dia anterior.
3. Ver os registros já existentes para essa data.
4. Criar ou editar o check-in e os registros de hábitos.
5. Salvar mantendo a data original do evento.

A interface deve indicar claramente que se está editando uma data passada.

## 7. Fluxo de criação de hábito

1. Inserir o nome do hábito.
2. Selecionar tipo de acompanhamento.
3. Definir frequência.
4. Relacionar a uma ou mais áreas, se desejar.
5. Relacionar a uma meta, se desejar.
6. Configurar unidade e meta numérica, quando aplicável.
7. Configurar lembrete, opcionalmente.
8. Salvar.

### Exemplos de configuração

- Dormir: duração em horas, com meta numérica;
- Treinar: número de vezes por semana; detalhes opcionais por sessão;
- Água: quantidade numérica por entrada e meta diária;
- Leitura: conclusão, livro, capítulo e páginas;
- Medicamentos: lista de itens e registros associados a horários definidos pelo usuário.

Os exemplos não devem ser hábitos fixos do sistema. Cada usuário pode criar, renomear e configurar seus próprios hábitos.

## 8. Fluxo de treino

1. Marcar que houve treino.
2. Opcionalmente, selecionar modalidade e registrar duração ou intensidade.
3. Adicionar exercícios.
4. Para cada exercício, preencher apenas os dados relevantes.
5. Salvar a sessão.

O sistema deve facilitar a comparação entre registros anteriores do mesmo exercício sem inferir recomendações de treino.

## 9. Fluxo de medicamentos

1. Cadastrar um medicamento e as informações que o usuário deseja registrar.
2. Definir horários de referência, se desejar.
3. Receber lembrete conforme configuração.
4. Marcar tomada como realizada, não realizada ou pendente.
5. Corrigir o registro retroativamente, se necessário.

A linguagem da interface deve deixar claro que o sistema é um organizador e não uma ferramenta de orientação médica.

## 10. Fluxo de revisão semanal ou mensal

1. Selecionar a revisão semanal ou mensal.
2. Confirmar o período apresentado.
3. Responder às perguntas guiadas.
4. Consultar dados relacionados ao período, se disponíveis.
5. Salvar a revisão.
6. Opcionalmente, atualizar metas ou próximos passos.

As perguntas devem ser revisáveis e não podem transformar resultados de hábitos em avaliações moralizantes.

## 11. Configuração do dashboard

O usuário pode selecionar os componentes que deseja destacar. Exemplos de componentes possíveis:

- Check-in mais recente;
- Hábitos do dia;
- Progresso dos hábitos por período;
- Metas ativas;
- Próximos passos;
- Áreas;
- Revisão pendente;
- Gráficos escolhidos pelo usuário.

A seleção, ordem e apresentação devem ser armazenadas nas preferências do usuário.

## 12. Estados vazios e dias sem registro

Quando não houver dados, a interface deve:

- Explicar o que pode ser registrado;
- Permitir começar sem preencher tudo;
- Evitar mostrar métricas como zero quando a informação está ausente;
- Distinguir “não registrado” de “registrado como não realizado”.

## 13. Acessibilidade e responsividade

- Formulários devem ter rótulos claros;
- Navegação deve ser utilizável por teclado;
- Contraste e estados de foco devem ser adequados;
- Gráficos precisam de alternativa textual ou tabular;
- Botões de ação devem ser utilizáveis em telas pequenas.