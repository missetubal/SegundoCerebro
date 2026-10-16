# API Proposta

## 1. Diretrizes

- A API deve autenticar o usuário em todas as operações pessoais.
- O usuário não deve poder definir livremente o proprietário dos registros.
- A autorização deve ocorrer no servidor.
- Validações devem acontecer na fronteira da API e também proteger as regras de domínio.
- A API deve documentar datas, fusos, unidades e estados.
- Os exemplos abaixo são conceituais; a convenção final pode ser REST, Server Actions ou outra abordagem consistente com a aplicação.

## 2. Recursos sugeridos

### Preferências

- `GET /api/preferences`
- `PATCH /api/preferences`

### Áreas

- `GET /api/areas`
- `POST /api/areas`
- `GET /api/areas/:id`
- `PATCH /api/areas/:id`
- `DELETE /api/areas/:id`

A exclusão pode ser substituída por arquivamento, conforme a regra de negócio adotada.

### Metas

- `GET /api/goals`
- `POST /api/goals`
- `GET /api/goals/:id`
- `PATCH /api/goals/:id`
- `DELETE /api/goals/:id`

### Próximos passos

- `GET /api/next-steps`
- `POST /api/next-steps`
- `PATCH /api/next-steps/:id`
- `DELETE /api/next-steps/:id`

### Hábitos e registros

- `GET /api/habits`
- `POST /api/habits`
- `GET /api/habits/:id`
- `PATCH /api/habits/:id`
- `DELETE /api/habits/:id`
- `GET /api/habit-logs?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/habit-logs`
- `PATCH /api/habit-logs/:id`
- `DELETE /api/habit-logs/:id`

### Check-ins

- `GET /api/check-ins?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/check-ins/:date`
- `PUT /api/check-ins/:date`
- `DELETE /api/check-ins/:date`

`PUT` pode ser adequado caso o produto decida ter um check-in por usuário e por data. Se houver múltiplos check-ins por dia, a API deverá usar identificadores próprios.

### Revisões

- `GET /api/reviews`
- `POST /api/reviews`
- `GET /api/reviews/:id`
- `PATCH /api/reviews/:id`

### Medicamentos

- `GET /api/medications`
- `POST /api/medications`
- `PATCH /api/medications/:id`
- `DELETE /api/medications/:id`
- `GET /api/medication-logs?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/medication-logs`
- `PATCH /api/medication-logs/:id`

### Exportação

- `POST /api/exports`
- `GET /api/exports/:id`

A implementação pode gerar o arquivo de forma síncrona no MVP, desde que o tamanho esperado seja compatível. Para volumes maiores, considerar geração assíncrona.

## 3. Exemplos conceituais

### Criar um hábito

```json
{
  "name": "Beber água",
  "trackingType": "quantity",
  "frequency": {
    "type": "daily"
  },
  "target": {
    "value": 2,
    "unit": "L",
    "period": "day"
  },
  "areaIds": ["area-id"],
  "goalId": null
}
```

### Criar um check-in

```json
{
  "entryDate": "2026-10-13",
  "generalNote": "Hoje consegui avançar no projeto.",
  "gratitude": null,
  "learnings": null,
  "freeReflection": null
}
```

### Registrar água

```json
{
  "habitId": "habit-id",
  "entryDate": "2026-10-13",
  "value": 500,
  "unit": "ml"
}
```

### Registrar leitura

```json
{
  "habitId": "habit-id",
  "entryDate": "2026-10-13",
  "completed": true,
  "reading": {
    "bookTitle": "Título do livro",
    "chapter": "3",
    "pagesRead": 12
  }
}
```

Os exemplos são ilustrativos; nomes, validações e formato final devem refletir o modelo implementado.

## 4. Erros

A API deve retornar erros consistentes para:

- Entrada inválida;
- Recurso não encontrado;
- Usuário não autorizado;
- Conflito de dados;
- Limite de requisições, se necessário;
- Erro interno.

Mensagens de erro não devem expor dados de outros usuários ou detalhes internos sensíveis.