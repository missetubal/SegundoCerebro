# PRD — Segundo Cérebro

## 1. Objetivo do produto

Criar uma aplicação web que ajude pessoas a organizar e acompanhar diferentes pilares da vida, conectando metas, hábitos, próximos passos, registros diários e revisões periódicas.

O sistema deve ser útil inicialmente para uma única pessoa, mas ter uma estrutura de dados preparada para múltiplos usuários.

## 2. Objetivos do MVP

1. Permitir que o usuário configure os pilares que deseja acompanhar.
2. Permitir a criação de metas com períodos definidos pelo usuário.
3. Permitir a criação de hábitos personalizados e o acompanhamento de sua frequência.
4. Facilitar o check-in diário e permitir o preenchimento de dias anteriores.
5. Registrar métricas quantitativas e reflexões qualitativas.
6. Permitir revisões semanais e mensais.
7. Deixar o usuário escolher o que deseja ver com mais destaque no dashboard.
8. Enviar lembretes por e-mail em horários escolhidos pelo usuário.
9. Permitir a exportação dos dados pessoais.

## 3. Não objetivos do MVP

- Fornecer aconselhamento médico ou alterar orientações sobre medicamentos;
- Automatizar decisões importantes com IA;
- Garantir correlações causais entre pilares;
- Criar uma rede social ou compartilhamento público;
- Implementar cobrança ou gestão comercial de assinaturas;
- Substituir aplicativos de saúde, finanças ou gerenciamento de tarefas especializados.

## 4. Conceitos principais

### Pilar

Uma área da vida criada e organizada pelo usuário, como Saúde ou Carreira.

### Meta

Um resultado desejado associado a um pilar. Cada meta possui um horizonte temporal definido pelo usuário, podendo ser de curto, médio ou longo prazo, ou outra classificação personalizada.

### Próximo passo

Uma ação concreta que contribui para uma meta. Pode ter prazo, estado e prioridade.

### Hábito

Uma prática recorrente criada pelo usuário, ligada a um ou mais pilares e, opcionalmente, a uma meta.

### Check-in diário

Um registro associado a uma data. Pode incluir texto livre geral, respostas estruturadas, conclusões de hábitos e métricas específicas.

### Revisão

Uma reflexão guiada referente a um período semanal ou mensal.

### Tag

Uma etiqueta transversal que pode ligar registros, hábitos, metas ou pilares diferentes.

## 5. Personas e necessidades

### Persona A — Pessoa que quer criar consistência

Precisa registrar hábitos de forma simples, inclusive quando esquece de preencher no dia correspondente.

### Persona B — Pessoa com vários projetos e áreas da vida

Precisa conectar metas, tarefas e hábitos a pilares diferentes, sem perder uma visão geral.

### Persona C — Pessoa reflexiva

Quer registrar pensamentos, gratidão, aprendizados e percepções, mas sem ser obrigada a preencher todos os campos diariamente.

### Persona D — Usuário avançado

Quer métricas, gráficos, filtros, exportação e, futuramente, insights gerados a partir do próprio histórico.

## 6. Requisitos funcionais de alto nível

- Gerenciar pilares;
- Gerenciar metas;
- Gerenciar próximos passos;
- Gerenciar hábitos e frequências;
- Fazer check-ins diários e retroativos;
- Registrar dados especializados para hábitos;
- Gerenciar medicamentos e registros de tomada;
- Configurar lembretes;
- Fazer revisões semanais e mensais;
- Configurar o dashboard;
- Consultar histórico e evolução;
- Exportar os dados.

Detalhes normativos estão em `02-requisitos-e-regras-de-negocio.md`.

## 7. Critérios de sucesso do MVP

- O usuário consegue criar e editar seus pilares, metas e hábitos sem intervenção técnica.
- É possível registrar um check-in em menos de cinco minutos usando o fluxo rápido.
- O usuário consegue preencher ou corrigir registros de dias anteriores.
- As métricas são exibidas com período e unidade claramente identificados.
- O usuário consegue configurar o conteúdo prioritário do dashboard.
- O sistema consegue enviar lembretes conforme as preferências configuradas.
- O usuário consegue exportar seus dados em um formato legível e reutilizável.

## 8. Premissas

- A aplicação será inicialmente web;
- A experiência será responsiva para uso em desktop e dispositivos móveis;
- O stack preferido é React, Next.js e Node.js;
- O desenvolvimento será conduzido com práticas de SDD e ferramentas como Cursor e Claude Code;
- A arquitetura terá isolamento de dados por usuário desde o início;
- E-mail é um canal aceitável para a primeira implementação de notificações.

## 9. Métricas de produto a considerar

As métricas abaixo são propostas para avaliação do produto, não requisitos de rastreamento invasivo:

- Frequência de check-ins por usuário;
- Percentual de check-ins iniciados e concluídos;
- Retorno após períodos sem atividade;
- Uso das revisões semanais e mensais;
- Quantidade de hábitos e metas ativos;
- Percentual de usuários que configuram o dashboard.

Métricas de uso devem ser documentadas e coletadas apenas com uma justificativa clara e política de privacidade adequada.