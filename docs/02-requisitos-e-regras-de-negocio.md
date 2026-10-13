# Requisitos e Regras de Negócio

## 1. Prioridade dos requisitos

- **P0:** essencial para o MVP;
- **P1:** importante, mas pode ser entregue após o fluxo principal;
- **P2:** evolução futura.

## 2. Conta e usuário

### RF-001 — Conta do usuário (P0)

O sistema deve associar os dados a uma conta autenticada.

### RF-002 — Isolamento de dados (P0)

Um usuário não pode consultar, alterar ou excluir dados pertencentes a outro usuário.

### RF-003 — Preferências pessoais (P0)

O usuário pode configurar preferências, incluindo:

- Fuso horário;
- Preferência de template global;
- Horário de lembrete;
- Preferências de dashboard.

## 3. Pilares

### RF-010 — Criar pilar (P0)

O usuário pode criar um pilar com nome e, opcionalmente, descrição, cor, ícone e posição de exibição.

### RF-011 — Editar pilar (P0)

O usuário pode alterar os dados de um pilar.

### RF-012 — Reordenar pilares (P1)

O usuário pode definir a ordem em que os pilares aparecem.

### RF-013 — Arquivar ou excluir pilar (P0)

O usuário pode arquivar um pilar para removê-lo das telas principais sem apagar seu histórico.

A exclusão definitiva deve tratar os dados dependentes de forma explícita e apresentar confirmação.

## 4. Metas e próximos passos

### RF-020 — Criar meta (P0)

Cada meta deve poder conter:

- Título;
- Descrição;
- Pilar principal;
- Pilares relacionados, opcionalmente;
- Horizonte ou classificação temporal definida pelo usuário;
- Data inicial e data-alvo, opcionais;
- Estado;
- Métrica de sucesso, opcional;
- Tags, opcionais.

### RF-021 — Horizonte configurável (P0)

O sistema não deve impor durações fixas para curto, médio e longo prazo. O usuário define os nomes e/ou intervalos que deseja usar.

### RF-022 — Criar próximo passo (P0)

Um próximo passo pode estar associado a uma meta e conter descrição, prazo, estado e prioridade.

### RF-023 — Evolução da meta (P1)

O usuário pode registrar atualizações de progresso, notas ou valores de uma métrica associada à meta.

## 5. Hábitos

### RF-030 — Criar hábito personalizado (P0)

Cada usuário pode criar seus próprios hábitos. O sistema não depende de uma lista fixa de hábitos predefinidos.

Campos configuráveis podem incluir:

- Nome;
- Descrição;
- Pilar ou pilares;
- Meta relacionada, opcional;
- Tipo de acompanhamento;
- Frequência;
- Unidade, quando aplicável;
- Meta numérica, quando aplicável;
- Data de início e data de término;
- Lembrete opcional;
- Estado ativo ou arquivado.

### RF-031 — Frequência configurável (P0)

O hábito deve permitir frequências como:

- Diária;
- Dias específicos da semana;
- Quantidade de vezes por semana;
- Quantidade de vezes em um período configurável;
- Registro sem frequência fixa.

### RF-032 — Tipos de acompanhamento (P0)

Proposta de tipos iniciais:

- Conclusão: feito/não feito;
- Quantidade numérica, por exemplo, litros de água;
- Duração;
- Escala ou avaliação;
- Registro livre;
- Tipo especializado, como treino, leitura ou medicamento.

A lista definitiva de tipos poderá evoluir conforme o desenho da interface e do modelo de dados.

### RF-033 — Registro retroativo de hábito (P0)

O usuário pode registrar ou corrigir um acompanhamento associado a uma data passada.

### RF-034 — Contexto opcional (P1)

O usuário pode incluir observações em um registro de hábito.

## 6. Registros especializados

### RF-040 — Água (P0)

Para hábitos configurados como acompanhamento de água, o usuário pode registrar quantidades numéricas ao longo do dia. O sistema deve somar os registros e compará-los com a meta configurada.

A unidade deve ser explícita, por exemplo, ml ou litros.

### RF-041 — Leitura (P0)

O registro de leitura pode incluir:

- Livro;
- Capítulo;
- Páginas lidas;
- Data;
- Nota opcional.

Os campos não devem ser obrigatórios se o usuário quiser apenas marcar a leitura como concluída.

### RF-042 — Treino (P0)

O usuário pode marcar a realização do treino e, opcionalmente, registrar:

- Modalidade;
- Duração;
- Intensidade;
- Observações;
- Exercícios realizados.

### RF-043 — Exercícios e evolução (P1)

Para cada exercício, o usuário pode registrar dados adequados à modalidade, como:

- Nome do exercício;
- Séries;
- Repetições;
- Carga;
- Distância;
- Tempo;
- Observações.

O sistema deve preservar unidades e permitir consultar registros anteriores para acompanhar evolução. Não deve presumir que uma única métrica serve para todos os exercícios.

### RF-044 — Medicamentos (P0)

O usuário pode cadastrar uma lista de medicamentos com informações como nome, horário ou horários de referência e estado ativo.

O sistema pode lembrar e registrar que o usuário marcou uma tomada. Não deve recomendar, alterar ou inferir dose, tratamento ou horário médico.

### RF-045 — Registro de tomada (P0)

O usuário pode registrar uma tomada como realizada, não realizada ou pendente, associada à data e, quando aplicável, ao horário previsto.

O usuário deve poder corrigir um registro posteriormente. O sistema deve distinguir o horário previsto do horário em que o registro foi realizado, se ambos forem armazenados.

## 7. Check-in diário e journaling

### RF-050 — Check-in associado a uma data (P0)

Cada check-in pertence a uma data no fuso horário do usuário. O usuário pode preencher o registro em qualquer momento e selecionar uma data anterior.

### RF-051 — Registro geral do dia (P0)

O check-in inclui um campo livre geral para o dia. O modelo inicial não exige um texto separado para cada pilar.

### RF-052 — Check-in de hábitos (P0)

O check-in permite registrar o andamento dos hábitos aplicáveis à data, sem exigir que todos sejam preenchidos para salvar o registro.

### RF-053 — Seções opcionais (P0)

Gratidão, aprendizados e reflexão livre devem ser opcionais e expansíveis. O usuário não precisa preenchê-los todos os dias.

### RF-054 — Modo minimalista e detalhado (P0)

O usuário pode escolher globalmente entre um template minimalista e um detalhado.

A diferença exata entre os campos exibidos em cada template deverá ser definida no desenho do fluxo. A configuração global não impede que alguns campos sejam opcionais.

### RF-055 — Rascunho e atualização (P1)

O sistema deve evitar a perda de conteúdo em caso de navegação acidental ou falha de conexão, quando tecnicamente viável.

### RF-056 — Dias sem registro (P0)

O sistema pode mostrar dias sem check-in, mas não deve classificá-los automaticamente como falha ou aplicar punições.

## 8. Revisões

### RF-060 — Revisão semanal (P0)

O sistema oferece um fluxo guiado para revisar um período semanal. As perguntas devem apoiar reflexão sobre progresso, obstáculos e próximos passos.

### RF-061 — Revisão mensal (P0)

O sistema oferece um fluxo guiado para revisar um período mensal, com opção de registrar aprendizados e ajustar prioridades.

### RF-062 — Revisão editável (P1)

O usuário pode revisar ou atualizar uma revisão já registrada.

As perguntas e a definição de semanas, meses e limites de período devem ser especificadas no desenho funcional.

## 9. Dashboard e visualizações

### RF-070 — Dashboard configurável (P0)

O usuário pode escolher quais componentes são mais importantes e devem aparecer em destaque.

### RF-071 — Visualizações por pilar (P0)

O usuário pode consultar metas, hábitos e registros associados a um pilar.

### RF-072 — Histórico e gráficos (P1)

O sistema pode apresentar evolução ao longo do tempo, incluindo métricas e registros qualitativos.

Toda visualização deve indicar período, unidade, origem dos dados e limitações relevantes.

### RF-073 — Tags e relações transversais (P1)

O usuário pode utilizar tags para relacionar registros de diferentes pilares.

### RF-074 — Correlações entre pilares (P2)

O sistema poderá apresentar relações entre dados de pilares diferentes. Essas relações devem ser descritas como correlações observadas, não como causalidade comprovada.

## 10. Notificações

### RF-080 — Lembrete por e-mail (P0)

O usuário pode ativar ou desativar um lembrete e selecionar o horário desejado.

### RF-081 — Fuso horário (P0)

O horário do lembrete deve ser interpretado no fuso horário configurado pelo usuário.

### RF-082 — Múltiplos lembretes (P1)

A possibilidade de múltiplos lembretes diários ainda precisa de decisão funcional. O sistema deve evitar enviar lembretes duplicados.

### RF-083 — Preferências de notificação por tipo (P1)

No futuro, o usuário poderá configurar lembretes diferentes para check-in, hábitos ou medicamentos, caso isso seja definido como escopo.

## 11. Exportação

### RF-090 — Exportar dados (P0)

O usuário pode exportar seus dados em um formato reutilizável. Formatos iniciais recomendados:

- JSON para exportação estruturada completa;
- CSV para tabelas simples, quando adequado.

### RF-091 — Exportação completa (P0)

A exportação deve incluir os registros do próprio usuário e documentar a estrutura e os formatos utilizados.

### RF-092 — Exclusão de conta e dados (P1)

O fluxo de exclusão deve explicar quais dados serão removidos, quais podem permanecer por obrigação legal e por quanto tempo, conforme política definida.

## 12. Regras gerais

1. Datas e horários devem ser tratados com base no fuso do usuário.
2. Registros retroativos devem manter a data de referência e, quando necessário, o momento em que foram criados ou alterados.
3. Valores quantitativos devem armazenar unidade.
4. Hábitos arquivados não devem aparecer como ativos, mas o histórico deve continuar consultável.
5. Pilares, metas e hábitos devem pertencer a um usuário.
6. A ausência de um registro não deve ser interpretada automaticamente como “não realizado”.
7. A configuração padrão não deve impedir a personalização posterior.