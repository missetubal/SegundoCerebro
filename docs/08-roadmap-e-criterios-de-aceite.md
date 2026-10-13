# Roadmap e Critérios de Aceite

## Fase 0 — Definição

- Validar decisões em aberto;
- Escolher stack e provedores;
- Especificar fluxos e protótipos;
- Definir o formato das especificações SDD;
- Definir critérios de segurança e privacidade.

## Fase 1 — Fundação

- Aplicação web responsiva;
- Autenticação;
- Preferências do usuário;
- Modelo de dados com `user_id`;
- Testes de isolamento de dados;
- Cadastro e edição de pilares.

### Critérios de aceite

- Usuário autenticado só consegue acessar os próprios dados;
- Pilares podem ser criados, editados e arquivados;
- Fuso horário e template global podem ser configurados.

## Fase 2 — Metas e hábitos

- Criar e editar metas;
- Criar próximos passos;
- Criar hábitos personalizados;
- Configurar frequências e tipos de acompanhamento;
- Associar hábitos a pilares e metas.

### Critérios de aceite

- O usuário consegue criar um hábito sem depender de uma lista fixa;
- A frequência pode ser configurada;
- O sistema distingue um registro ausente de um registro marcado como não realizado.

## Fase 3 — Check-in e registros especializados

- Check-in diário;
- Registro retroativo;
- Template minimalista e detalhado;
- Gratidão, aprendizados e reflexão opcionais;
- Água;
- Leitura;
- Treinos e exercícios;
- Medicamentos e registros de tomada.

### Critérios de aceite

- O usuário consegue registrar um dia anterior;
- O texto e as métricas ficam associados à data correta;
- Campos opcionais não impedem o salvamento;
- Registros quantitativos armazenam unidade;
- O sistema não interpreta nem recomenda condutas médicas.

## Fase 4 — Dashboard e revisões

- Dashboard personalizável;
- Histórico;
- Gráficos iniciais;
- Revisões semanais;
- Revisões mensais.

### Critérios de aceite

- O usuário consegue escolher os elementos destacados;
- Os gráficos indicam período e unidade;
- Revisões podem ser salvas e atualizadas;
- Dias sem registro não aparecem como valores iguais a zero.

## Fase 5 — Notificações e exportação

- Lembrete por e-mail;
- Horário selecionado pelo usuário;
- Uso do fuso configurado;
- Registro de entrega;
- Exportação JSON e CSV quando apropriado.

### Critérios de aceite

- Usuário pode ativar ou desativar lembretes;
- Horários são interpretados corretamente no fuso do usuário;
- O envio não é duplicado para a mesma ocorrência;
- Exportações contêm apenas dados do usuário autenticado.

## Fase 6 — Evolução futura

Possibilidades a avaliar:

- Notificações push;
- Aplicação mobile;
- RAG sobre registros pessoais;
- Insights com IA;
- Visualizações de relações entre pilares;
- Mais canais de notificação;
- Recursos para produto multiusuário.

## Testes recomendados

### Testes unitários

- Validações de frequência;
- Cálculo de somas e metas quantitativas;
- Regras de data e fuso;
- Estados de hábitos e medicamentos.

### Testes de integração

- CRUD de pilares, metas e hábitos;
- Registro retroativo;
- Exportação;
- Envio e registro de notificações.

### Testes end-to-end

- Primeiro uso;
- Check-in rápido;
- Check-in retroativo;
- Criação de hábito personalizado;
- Revisão semanal;
- Configuração do dashboard;
- Exportação de dados.

### Testes de segurança

- Tentativas de acessar recursos de outro usuário;
- Validação de autorização em identificadores manipulados;
- Proteção de arquivos exportados;
- Verificação de exposição de dados sensíveis nos logs.