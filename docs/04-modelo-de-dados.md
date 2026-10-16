# Modelo de Dados Proposto

## 1. Princípios

- Todas as entidades pessoais pertencem a um usuário;
- Usar identificadores estáveis;
- Preservar histórico quando houver arquivamento;
- Usar campos estruturados para dados que precisam ser consultados ou agregados;
- Usar JSON apenas quando a estrutura variar legitimamente;
- Guardar unidade junto a valores quantitativos;
- Separar a data do evento do momento de criação do registro.

Os campos abaixo são uma proposta lógica, não uma migração SQL definitiva.

## 2. Entidades

### User

Representa a conta autenticada.

Campos sugeridos:

- `id`
- `email`
- `created_at`
- `updated_at`

### UserPreference

Preferências globais.

Campos sugeridos:

- `id`
- `user_id`
- `timezone`
- `journal_template` — `minimal` ou `detailed`
- `dashboard_preferences`
- `created_at`
- `updated_at`

### Area

Campos sugeridos:

- `id`
- `user_id`
- `name`
- `description`
- `color`
- `icon`
- `sort_order`
- `status` — ativo ou arquivado
- `created_at`
- `updated_at`

### Goal

Campos sugeridos:

- `id`
- `user_id`
- `primary_area_id`
- `title`
- `description`
- `horizon_label`
- `start_date`
- `target_date`
- `status`
- `success_metric_name`
- `success_metric_target`
- `success_metric_unit`
- `created_at`
- `updated_at`
- `archived_at`

`horizon_label` deve permitir classificações configuradas pelo usuário. Não codificar durações fixas de curto, médio e longo prazo.

### GoalArea

Relação opcional entre uma meta e áreas adicionais.

Campos sugeridos:

- `goal_id`
- `area_id`

### NextStep

Campos sugeridos:

- `id`
- `user_id`
- `goal_id`
- `title`
- `description`
- `status`
- `priority`
- `due_date`
- `completed_at`
- `created_at`
- `updated_at`

### Habit

Campos sugeridos:

- `id`
- `user_id`
- `name`
- `description`
- `tracking_type`
- `frequency_config`
- `target_value`
- `unit`
- `start_date`
- `end_date`
- `reminder_config`
- `status`
- `created_at`
- `updated_at`
- `archived_at`

`frequency_config` pode ser estruturado em um objeto validado, com regras explícitas para cada tipo de frequência.

### HabitArea

Relação entre hábito e uma ou mais áreas.

Campos sugeridos:

- `habit_id`
- `area_id`

### HabitGoal

Relação opcional entre hábito e meta.

Campos sugeridos:

- `habit_id`
- `goal_id`

### HabitLog

Registro de acompanhamento de um hábito em uma data.

Campos sugeridos:

- `id`
- `user_id`
- `habit_id`
- `entry_date`
- `value`
- `unit`
- `completion_status`
- `notes`
- `created_at`
- `updated_at`

O modelo deve permitir mais de um registro no mesmo dia para hábitos como consumo de água.

### DailyCheckIn

Campos sugeridos:

- `id`
- `user_id`
- `entry_date`
- `general_note`
- `gratitude`
- `learnings`
- `free_reflection`
- `created_at`
- `updated_at`

Os campos opcionais podem ser nulos ou não persistidos até serem preenchidos.

### ReadingLog

Campos sugeridos:

- `id`
- `user_id`
- `habit_log_id`
- `book_title`
- `chapter`
- `pages_read`
- `notes`

### WorkoutSession

Campos sugeridos:

- `id`
- `user_id`
- `habit_log_id`
- `modality`
- `duration_minutes`
- `intensity`
- `notes`

### Exercise

Representa um exercício que o usuário deseja acompanhar.

Campos sugeridos:

- `id`
- `user_id`
- `name`
- `default_unit`
- `created_at`
- `updated_at`

### ExerciseLog

Campos sugeridos:

- `id`
- `user_id`
- `workout_session_id`
- `exercise_id`
- `sets`
- `repetitions`
- `load_value`
- `load_unit`
- `distance_value`
- `distance_unit`
- `duration_seconds`
- `notes`

Nem todos os campos se aplicam a todos os exercícios. A validação deve depender da modalidade e do formato de registro.

### Medication

Campos sugeridos:

- `id`
- `user_id`
- `name`
- `instructions` — texto informado pelo usuário, sem interpretação pelo sistema
- `schedule_config`
- `start_date`
- `end_date`
- `status`
- `created_at`
- `updated_at`

Não guardar informações além das necessárias sem uma justificativa e política de privacidade.

### MedicationLog

Campos sugeridos:

- `id`
- `user_id`
- `medication_id`
- `scheduled_for`
- `status` — realizado, não realizado ou pendente
- `taken_at`
- `notes`
- `created_at`
- `updated_at`

### Review

Campos sugeridos:

- `id`
- `user_id`
- `period_type` — semanal ou mensal
- `period_start`
- `period_end`
- `answers`
- `summary`
- `created_at`
- `updated_at`

`answers` pode ser JSON versionado, pois o conjunto de perguntas pode evoluir. A aplicação deve manter compatibilidade com revisões antigas.

### Tag

Campos sugeridos:

- `id`
- `user_id`
- `name`
- `created_at`

### TagAssignment

Relação entre uma tag e uma entidade compatível.

Campos sugeridos:

- `id`
- `user_id`
- `tag_id`
- `entity_type`
- `entity_id`

Se a implementação usar relações polimórficas, a integridade referencial deve ser tratada cuidadosamente.

### NotificationPreference

Campos sugeridos:

- `id`
- `user_id`
- `channel`
- `enabled`
- `local_time`
- `timezone`
- `notification_type`
- `created_at`
- `updated_at`

### NotificationDelivery

Registro de tentativas de envio.

Campos sugeridos:

- `id`
- `user_id`
- `notification_preference_id`
- `scheduled_for`
- `sent_at`
- `status`
- `provider_reference`
- `error_code`

## 3. Decisões a validar antes do schema final

- Se diário e check-in serão uma única entidade ou conceitos separados;
- Se um check-in por dia é suficiente ou se serão permitidos vários;
- Como versionar perguntas de revisão;
- Se registros de água e outros hábitos quantitativos podem ter múltiplas entradas por dia;
- Se exercícios serão cadastrados em uma biblioteca reutilizável por usuário;
- Como a exclusão de entidades será tratada;
- Se haverá armazenamento de histórico de alterações.