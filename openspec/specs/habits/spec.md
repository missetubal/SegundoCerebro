# habits Specification

## Purpose

Permite ao usuário criar hábitos genéricos sem catálogo fixo, ligados a áreas via HabitArea, e listar os hábitos ativos aplicáveis ao dia corrente.

## Requirements

### Requirement: Criar hábito sem catálogo fixo
O sistema SHALL permitir que o usuário autenticado crie um hábito com nome livre obrigatório (1 a 80 caracteres após trim), sem depender de uma lista predefinida de hábitos do sistema. O hábito MUST nascer ativo. Exemplos válidos incluem nomes como "Meditar" e "Água".

#### Scenario: Hábito de conclusão
- **WHEN** o usuário cria o hábito "Meditar" com tracking_type conclusão, frequência diária e ao menos uma área
- **THEN** o hábito fica ativo e aparece nas listagens do usuário
- **AND** nenhum target nem unidade é exigido ou gravado

#### Scenario: Hábito de quantidade
- **WHEN** o usuário cria o hábito "Água" com tracking_type quantidade, target 2000, unidade "ml", frequência diária e ao menos uma área
- **THEN** o hábito fica ativo com target e unidade gravados

#### Scenario: Nome vazio
- **WHEN** o usuário tenta criar um hábito com nome contendo apenas espaços
- **THEN** nenhum hábito é criado
- **AND** o sistema exibe uma mensagem neutra pedindo um nome

### Requirement: Tipos de acompanhamento nesta fatia
O sistema SHALL aceitar apenas dois tracking_type nesta fatia: conclusão (booleano feito/não feito) e quantidade (valor numérico + unidade). Para quantidade, `target_value` positivo e `unit` não vazia MUST ser obrigatórios. Para conclusão, target e unit MUST ser ausentes. Tipos especializados (treino, leitura, medicamento) MUST não estar disponíveis nesta fatia.

#### Scenario: Quantidade sem unidade
- **WHEN** o usuário tenta criar um hábito de quantidade sem unidade
- **THEN** nenhum hábito é criado
- **AND** o sistema exibe uma mensagem neutra pedindo a unidade

#### Scenario: Conclusão com target
- **WHEN** a requisição de conclusão envia target ou unit
- **THEN** nenhum hábito é criado
- **AND** o sistema rejeita a combinação com mensagem neutra

### Requirement: Frequência simples
O sistema SHALL permitir apenas frequências simples nesta fatia: diário, ou dias específicos da semana (um ou mais dias). A configuração MUST ser validada: diário não carrega lista de dias; dias da semana MUST ter ao menos um dia válido (segunda a domingo). Frequências avançadas (N vezes por semana, sem frequência fixa) ficam fora desta fatia.

#### Scenario: Dias da semana
- **WHEN** o usuário cria um hábito com frequência nos dias segunda, quarta e sexta
- **THEN** o hábito fica gravado com esses três dias

#### Scenario: Dias da semana vazios
- **WHEN** o usuário escolhe frequência por dias da semana sem marcar nenhum dia
- **THEN** nenhum hábito é criado
- **AND** o sistema pede ao menos um dia

### Requirement: Vínculo com áreas via HabitArea
Cada hábito MUST estar ligado a uma ou mais áreas do próprio usuário através da relação HabitArea (não HabitPillar). Áreas arquivadas ou de outro usuário MUST não ser aceitas na criação ou edição. Remover a última área MUST ser rejeitado. Textos de UI MUST usar o termo "área".

#### Scenario: Múltiplas áreas
- **WHEN** o usuário cria "Meditar" ligado às áreas "Saúde" e "Mente"
- **THEN** o hábito fica associado às duas áreas
- **AND** a UI exibe os vínculos como áreas

#### Scenario: Sem área
- **WHEN** o usuário tenta criar um hábito sem nenhuma área
- **THEN** nenhum hábito é criado
- **AND** o sistema pede ao menos uma área

#### Scenario: Área alheia
- **WHEN** a requisição inclui o id de uma área do usuário B sob a sessão de A
- **THEN** nenhum hábito é criado
- **AND** o vínculo é tratado como inválido

### Requirement: Listar hábitos ativos do dia
O sistema SHALL listar os hábitos ativos do usuário que se aplicam ao dia corrente no fuso horário das preferências do usuário. Um hábito diário MUST entrar na lista todos os dias. Um hábito por dias da semana MUST entrar apenas quando o dia da semana corrente (no fuso do usuário) estiver na configuração. Hábitos arquivados MUST não aparecer. A lista MUST servir de base para o check-in futuro e MUST não exigir registros de check-in nesta fatia.

#### Scenario: Diário no dia corrente
- **WHEN** o usuário tem o hábito ativo diário "Meditar" e abre a lista do dia
- **THEN** "Meditar" aparece na lista

#### Scenario: Dia da semana que não casa
- **WHEN** o usuário tem um hábito ativo só às segundas e o dia corrente no fuso dele é terça
- **THEN** esse hábito não aparece na lista do dia

#### Scenario: Arquivado fora da lista
- **WHEN** o usuário arquiva "Água"
- **THEN** "Água" não aparece na lista de hábitos ativos do dia

#### Scenario: Isolamento da lista do dia
- **WHEN** A e B têm hábitos ativos para o mesmo dia e A consulta a lista
- **THEN** A recebe apenas os próprios hábitos

### Requirement: Editar e arquivar hábito
O sistema SHALL permitir editar nome, tracking_type, frequência, target/unit (conforme o tipo) e áreas vinculadas, e arquivar ou reativar um hábito. Arquivar MUST não apagar o hábito. Operações sobre id alheio MUST ser tratadas como item não encontrado.

#### Scenario: Arquivar
- **WHEN** o usuário arquiva "Meditar"
- **THEN** o hábito sai das listagens de ativos e da lista do dia
- **AND** permanece recuperável como arquivado

#### Scenario: Trocar de conclusão para quantidade
- **WHEN** o usuário edita "Meditar" para quantidade com target 10 e unit "min"
- **THEN** o hábito passa a exigir e exibir target e unit
