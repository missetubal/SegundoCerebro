# Skill: Componentização Máxima, Componentes Burros e Hooks

## Objetivo

Organizar o código para maximizar a reutilização, a testabilidade e a separação de responsabilidades.

A implementação deve priorizar:

- Componentes pequenos e altamente reutilizáveis.
- Componentes de apresentação simples e previsíveis.
- Separação clara entre interface, estado, efeitos colaterais e regras de negócio.
- Uso de hooks customizados para encapsular lógica.
- Componentes independentes da origem dos dados.
- Código fácil de testar, manter e alterar.
- Aplicação consistente dessas regras independentemente da ferramenta utilizada para analisar ou modificar o projeto.

## Princípios fundamentais

### 1. Componentes devem ser o mais burros possível

Componentes visuais devem se concentrar em renderizar a interface com base nas propriedades recebidas.

Eles devem:

- Receber dados por meio de `props`.
- Receber ações por meio de callbacks.
- Renderizar estados visuais.
- Delegar eventos por meio de funções recebidas.
- Permanecer independentes de APIs, serviços, stores e regras de negócio.
- Ser reutilizáveis em diferentes contextos.
- Ser fáceis de testar com diferentes combinações de propriedades.

Eles não devem conhecer:

- De onde os dados vieram.
- Como os dados são persistidos.
- Qual serviço de API foi utilizado.
- Como a navegação funciona internamente.
- Qual regra de negócio determinou o estado atual.
- Qual biblioteca de gerenciamento de estado está sendo utilizada.

### 2. Separar apresentação de lógica

A lógica de negócio, estado e efeitos colaterais deve ficar fora dos componentes puramente visuais.

A separação recomendada é:

- **Componentes de apresentação:** renderizam a interface.
- **Hooks:** encapsulam estado, efeitos, transformações e handlers.
- **Containers ou páginas:** orquestram hooks e componentes.
- **Serviços:** realizam comunicação externa, como APIs e persistência.
- **Utilitários:** armazenam funções puras e reutilizáveis.
- **Modelos e tipos:** definem contratos de dados.

### 3. Preferir composição a componentes grandes

Em vez de criar um componente extenso com muitas condições e responsabilidades, divida a interface em componentes menores.

A divisão deve considerar:

- Responsabilidade visual.
- Reutilização.
- Complexidade.
- Independência de estado.
- Possibilidade de testes isolados.
- Clareza da estrutura da tela.

Não criar componentes artificiais apenas para reduzir a quantidade de linhas. A extração deve melhorar a responsabilidade, a legibilidade ou a reutilização.

## Regras para componentes

### Componentes de apresentação

Componentes de apresentação devem seguir estas regras:

- Não realizar chamadas de API.
- Não acessar diretamente serviços externos.
- Não conhecer detalhes de roteamento.
- Não acessar diretamente stores globais.
- Não conter regras de negócio complexas.
- Não conter efeitos colaterais.
- Não decidir como os dados devem ser buscados ou persistidos.
- Receber dados já preparados para exibição sempre que possível.
- Expor eventos por meio de callbacks sem conhecer sua implementação.
- Ter nomes que representem claramente sua responsabilidade visual.

O uso de estado local é aceitável apenas quando o estado for exclusivamente visual e interno ao componente, como:

- Controle de abertura de um menu.
- Estado visual de foco.
- Animações.
- Alternância de exibição.
- Estado temporário de interação sem relevância para o domínio da aplicação.

Mesmo nesses casos, evitar estado local quando ele puder ser controlado pelo componente pai sem aumentar a complexidade.

### Componentes controlados

Preferir componentes controlados quando o estado tiver importância para o fluxo da aplicação.

Um componente controlado deve:

- Receber o valor atual por propriedade.
- Receber uma função para alteração do valor.
- Não manter uma cópia independente do mesmo estado.
- Evitar divergência entre estado interno e estado externo.

### Componentes reutilizáveis

Componentes reutilizáveis devem:

- Ter uma API de propriedades simples.
- Evitar dependências específicas de uma página.
- Evitar nomes relacionados a regras de negócio quando sua função for genérica.
- Permitir customização por propriedades.
- Não depender de dados globais sem necessidade.
- Ser independentes de serviços e endpoints.
- Manter comportamento previsível.

## Regras para hooks

### Responsabilidade dos hooks

Hooks customizados devem concentrar a lógica que não pertence à apresentação.

Um hook pode conter:

- Estado.
- Efeitos colaterais.
- Chamadas a serviços.
- Regras de negócio.
- Validações.
- Transformação de dados.
- Controle de carregamento.
- Tratamento de erros.
- Paginação.
- Filtros.
- Ordenação.
- Debounce.
- Integração com stores.
- Integração com autenticação.
- Handlers relacionados a uma responsabilidade específica.

### Princípio da responsabilidade única

Cada hook deve ter uma responsabilidade clara.

Evitar hooks que:

- Busquem dados.
- Controlem formulários.
- Gerenciem notificações.
- Alterem navegação.
- Atualizem múltiplos domínios sem relação.
- Concentrem toda a lógica de uma tela sem uma divisão coerente.

Quando um hook começar a acumular responsabilidades diferentes, dividir sua implementação em hooks menores e compor esses hooks em um hook de mais alto nível.

### Retorno dos hooks

Hooks devem retornar uma interface clara e orientada ao uso.

Preferir retornar:

- Dados prontos para serem consumidos.
- Estados de carregamento.
- Estados de erro.
- Ações nomeadas.
- Handlers específicos.
- Informações derivadas necessárias para a interface.

Evitar expor detalhes internos de implementação quando eles não forem necessários para o consumidor.

Os nomes retornados devem ser claros e consistentes. Evitar nomes genéricos como `data`, `value` ou `action` quando nomes mais específicos forem possíveis.

### Hooks de domínio

Hooks relacionados ao domínio devem encapsular o comportamento daquele domínio sem depender da estrutura visual de uma tela específica.

Um hook de domínio pode ser utilizado por diferentes páginas e componentes, desde que a responsabilidade permaneça coerente.

Hooks não devem retornar elementos visuais. A responsabilidade por renderizar a interface pertence aos componentes.

## Containers, páginas e orquestração

Páginas e containers podem conter lógica de orquestração.

Eles devem:

- Utilizar hooks.
- Conectar dados aos componentes.
- Coordenar ações entre diferentes componentes.
- Definir o fluxo da tela.
- Interpretar estados de carregamento e erro.
- Decidir quais componentes devem ser exibidos.
- Passar somente as propriedades necessárias.

Eles não devem:

- Concentrar toda a implementação visual em um único arquivo.
- Repetir componentes visuais que poderiam ser reutilizados.
- Misturar chamadas de API diretamente com marcação extensa.
- Reimplementar a mesma lógica já existente em hooks.
- Passar objetos enormes quando propriedades específicas forem suficientes.

A página deve funcionar como uma camada de composição entre os hooks e os componentes de apresentação.

## Serviços e efeitos externos

Chamadas externas devem ser isoladas em serviços ou módulos apropriados.

Os componentes e hooks não devem conhecer detalhes desnecessários de:

- URLs.
- Métodos HTTP.
- Headers.
- Estrutura interna do cliente de API.
- Serialização de dados.
- Formato específico de persistência.
- Implementação de armazenamento local.

O hook pode consumir um serviço, coordenar seu resultado e expor uma interface adequada para a tela.

Serviços devem ser responsáveis por comunicação externa, não por renderização ou controle de componentes.

## Regras de estado

### Estado local

Usar estado local quando:

- O estado pertence exclusivamente ao componente.
- O estado não precisa ser compartilhado.
- O estado não representa uma regra de negócio relevante.
- O estado não precisa sobreviver à desmontagem do componente.
- Não houver benefício em elevá-lo para outro nível.

### Estado compartilhado

Usar uma solução compartilhada quando:

- O estado é utilizado por partes diferentes da aplicação.
- Vários componentes precisam alterar o mesmo dado.
- O estado precisa sobreviver à troca de telas.
- A duplicação do estado causaria inconsistência.
- O estado representa uma informação global ou de domínio.

O acesso ao estado compartilhado deve ser encapsulado sempre que possível em hooks específicos, evitando que muitos componentes conheçam a implementação interna da store.

### Estado derivado

Não duplicar no estado valores que podem ser calculados a partir de outros dados.

Preferir calcular valores derivados por meio de:

- Funções puras.
- Seletores.
- Memoização quando necessária.
- Hooks específicos para transformações relevantes.

Evitar manter estados duplicados que possam ficar inconsistentes.

## Regras de propriedades

As propriedades devem representar apenas o que o componente precisa para cumprir sua responsabilidade.

Preferir:

- Propriedades com nomes descritivos.
- Tipos explícitos.
- Callbacks com nomes relacionados à intenção.
- Valores já formatados quando a formatação não pertence ao componente.
- Interfaces pequenas e coesas.

Evitar:

- Passar objetos inteiros quando apenas alguns campos são usados.
- Passar dependências técnicas desnecessárias.
- Passar callbacks genéricos sem indicar sua intenção.
- Usar propriedades opcionais em excesso.
- Criar componentes que aceitam configurações complexas demais.

Quando muitas propriedades estiverem relacionadas, avaliar se elas representam uma abstração coerente ou se o componente precisa ser dividido.

## Regras de formatação e transformação

A apresentação deve receber dados no formato mais adequado para renderização.

A transformação deve ocorrer na camada apropriada:

- **Regras de negócio:** hooks ou serviços de domínio.
- **Formatação específica de tela:** hook ou camada de apresentação.
- **Formatação genérica e pura:** utilitários.
- **Renderização:** componente.

Evitar colocar cálculos extensos, filtros complexos ou transformação de dados diretamente no retorno visual do componente.

## Regras para eventos

Componentes devem emitir eventos sem decidir o que acontece depois.

Por exemplo, um botão pode informar que foi clicado, mas não deve saber se isso resultará em:

- Chamada de API.
- Navegação.
- Atualização de store.
- Abertura de modal.
- Exibição de notificação.

A decisão deve permanecer no container ou hook responsável pelo fluxo.

Handlers complexos devem ser extraídos para hooks ou funções nomeadas. Evitar lógica extensa diretamente nos atributos de eventos da interface.

## Regras para carregamento, erro e estados vazios

Cada fluxo assíncrono deve considerar explicitamente:

- Estado inicial.
- Carregamento.
- Sucesso com dados.
- Sucesso sem dados.
- Erro.
- Tentativa novamente, quando aplicável.
- Estado parcial, quando aplicável.

Os componentes visuais devem apenas renderizar esses estados com base nas propriedades recebidas.

A lógica para determinar esses estados deve ficar em hooks, containers ou camadas de domínio.

## Regras para reutilização

Antes de criar uma nova implementação:

- Verificar se já existe um componente semelhante.
- Verificar se já existe um hook com responsabilidade relacionada.
- Reutilizar funções utilitárias existentes.
- Evitar duplicação de regras de negócio.
- Preferir generalizar uma abstração existente quando isso não prejudicar sua clareza.
- Não criar abstrações genéricas sem uma necessidade real de reutilização.

Reutilização não deve resultar em componentes excessivamente configuráveis ou difíceis de entender.

## Estrutura recomendada

A estrutura pode variar conforme o projeto, mas deve preservar a separação de responsabilidades:

- `components`: componentes visuais e reutilizáveis.
- `hooks`: hooks compartilhados e hooks de domínio.
- `pages` ou `screens`: páginas e containers.
- `services`: comunicação com APIs e integrações externas.
- `utils`: funções puras e auxiliares.
- `types` ou `models`: tipos e contratos.
- `stores`: gerenciamento de estado compartilhado.
- `constants`: constantes e configurações estáticas.

A organização por domínio também é válida quando ajudar a manter próximos os componentes, hooks, serviços e tipos de uma mesma funcionalidade.

O critério principal deve ser a clareza da responsabilidade e a facilidade de encontrar cada parte do código.

## Processo de implementação e refatoração

Ao criar ou alterar uma funcionalidade:

1. Identificar a responsabilidade principal da funcionalidade.
2. Separar regras de negócio, efeitos externos e apresentação.
3. Identificar partes visuais que podem ser componentes independentes.
4. Extrair lógica reutilizável para hooks.
5. Isolar chamadas externas em serviços.
6. Definir propriedades claras para os componentes.
7. Compor os componentes em uma página ou container.
8. Verificar estados de carregamento, erro e ausência de dados.
9. Evitar duplicação de estado e lógica.
10. Revisar se cada arquivo possui uma responsabilidade clara.
11. Preservar o comportamento existente durante refatorações.
12. Fazer alterações incrementais e evitar mudanças não relacionadas.

## Critérios de qualidade

Uma implementação está adequada quando:

- Os componentes visuais podem ser testados passando apenas propriedades.
- A lógica principal pode ser testada sem renderizar a interface inteira.
- As chamadas externas estão isoladas.
- A página atua principalmente como composição.
- Os hooks têm responsabilidades claras.
- Não existem regras de negócio espalhadas pela interface.
- A mesma regra não está duplicada em vários componentes.
- Os componentes podem ser reutilizados em outros contextos.
- Os nomes revelam a intenção do código.
- As propriedades são simples e previsíveis.
- Os estados assíncronos estão tratados.
- A alteração de uma regra não exige modificar vários componentes visuais.

## Exceções

As regras podem ser flexibilizadas quando a aplicação da abstração aumentar a complexidade sem trazer benefício real.

Exceções aceitáveis incluem:

- Componentes muito pequenos com estado visual simples.
- Páginas simples em que separar um container criaria apenas camadas desnecessárias.
- Componentes fortemente acoplados a uma única funcionalidade e sem possibilidade real de reutilização.
- Lógica curta e exclusivamente visual.
- Prototipação ou código experimental, desde que a decisão seja consciente.

As exceções não devem ser usadas para manter componentes grandes, duplicação de regras ou lógica de negócio espalhada na apresentação.

## Diretriz para decisões ambíguas

Quando houver dúvida sobre onde colocar uma responsabilidade:

- Se for visual, colocar no componente.
- Se for estado ou efeito, colocar em um hook.
- Se for comunicação externa, colocar em um serviço.
- Se for uma regra pura e reutilizável, colocar em um utilitário.
- Se for composição de fluxo, colocar na página ou container.
- Se for estado compartilhado, encapsular em uma store e em hooks de acesso.
- Se uma responsabilidade puder ser testada sem a interface, mantê-la fora do componente visual.

A solução preferida é a que mantém os componentes menores, reduz o acoplamento e deixa explícita a responsabilidade de cada camada.

## Instruções para ferramentas de IA

Ao analisar, criar ou modificar código neste projeto:

1. Seguir as regras deste documento.
2. Priorizar componentes de apresentação simples e reutilizáveis.
3. Extrair lógica de estado, efeitos e regras de negócio para hooks.
4. Isolar chamadas externas em serviços.
5. Evitar criar componentes grandes e multifuncionais.
6. Evitar duplicação de lógica, estado e regras de negócio.
7. Preservar os padrões e convenções já existentes no projeto.
8. Não fazer mudanças não relacionadas à tarefa solicitada.
9. Antes de criar uma nova abstração, verificar se já existe algo reutilizável.
10. Ao refatorar, preservar o comportamento atual da aplicação.
11. Explicar brevemente quando uma exceção a estas regras for necessária.
12. Preferir soluções simples, testáveis e com baixo acoplamento.
13. Não adicionar complexidade apenas para seguir uma abstração de forma artificial.
14. Sempre considerar estados de carregamento, erro, vazio e sucesso.
15. Manter os componentes o mais burros possível sem prejudicar a clareza do código.