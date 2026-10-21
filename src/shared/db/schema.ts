import { sql } from 'drizzle-orm';
import {
  bigint,
  char,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const users = pgTable(
  'user',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name'),
    email: text('email'),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
  },
  (table) => [
    uniqueIndex('user_email_lower_idx').on(sql`lower(${table.email})`),
  ],
);

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const userPasswords = pgTable('user_password', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** One row per limited key (e.g. `login:ip:1.2.3.4`); atomic upsert increments count within the window. */
export const rateLimits = pgTable(
  'rate_limit',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull().default(0),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (rateLimit) => [
    index('rate_limit_window_started_at_idx').on(rateLimit.windowStartedAt),
  ],
);

export const userPreferences = pgTable('user_preference', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  journalTemplate: text('journal_template').notNull().default('minimal'),
  horizonsSeededAt: timestamp('horizons_seeded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const areas = pgTable(
  'area',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color'),
    icon: text('icon'),
    sortOrder: integer('sort_order').notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (area) => [
    uniqueIndex('area_user_name_unique').on(
      area.userId,
      sql`lower(${area.name})`,
    ),
    index('area_user_sort_idx').on(area.userId, area.sortOrder),
  ],
);

export const horizons = pgTable(
  'horizon',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (horizon) => [
    uniqueIndex('horizon_user_name_unique').on(
      horizon.userId,
      sql`lower(${horizon.name})`,
    ),
    index('horizon_user_sort_idx').on(horizon.userId, horizon.sortOrder),
  ],
);

export const goals = pgTable(
  'goal',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    primaryAreaId: text('primary_area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'restrict' }),
    horizonId: text('horizon_id')
      .notNull()
      .references(() => horizons.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('active'),
    startDate: date('start_date'),
    targetDate: date('target_date'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (goal) => [
    index('goal_user_status_idx').on(goal.userId, goal.status),
    index('goal_user_primary_area_idx').on(goal.userId, goal.primaryAreaId),
  ],
);

export const nextSteps = pgTable(
  'next_step',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalId: text('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: text('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (nextStep) => [index('next_step_goal_idx').on(nextStep.goalId)],
);

export const habits = pgTable(
  'habit',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    trackingType: text('tracking_type').notNull(),
    frequencyKind: text('frequency_kind').notNull(),
    weekdays: integer('weekdays').array(),
    targetValue: integer('target_value'),
    unit: text('unit'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (habit) => [index('habit_user_archived_idx').on(habit.userId, habit.archivedAt)],
);

export const habitAreas = pgTable(
  'habit_area',
  {
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    areaId: text('area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'cascade' }),
  },
  (habitArea) => [
    primaryKey({ columns: [habitArea.habitId, habitArea.areaId] }),
  ],
);

export const dailyCheckIns = pgTable(
  'daily_check_in',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date').notNull(),
    generalNote: text('general_note'),
    mood: integer('mood'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (checkIn) => [
    uniqueIndex('daily_check_in_user_date_unique').on(
      checkIn.userId,
      checkIn.entryDate,
    ),
  ],
);

export const habitLogs = pgTable(
  'habit_log',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date').notNull(),
    completionStatus: text('completion_status'),
    value: integer('value'),
    unit: text('unit'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (log) => [
    uniqueIndex('habit_log_user_habit_date_unique').on(
      log.userId,
      log.habitId,
      log.entryDate,
    ),
    index('habit_log_user_date_idx').on(log.userId, log.entryDate),
  ],
);

export const medications = pgTable(
  'medication',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    instructions: text('instructions'),
    frequencyKind: text('frequency_kind').notNull(),
    weekdays: integer('weekdays').array(),
    times: text('times').array().notNull(),
    startsOn: date('starts_on').notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (medication) => [
    index('medication_user_archived_idx').on(
      medication.userId,
      medication.archivedAt,
    ),
  ],
);

export const medicationLogs = pgTable(
  'medication_log',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    medicationId: text('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date').notNull(),
    scheduledTime: text('scheduled_time').notNull(),
    status: text('status').notNull(),
    takenAt: timestamp('taken_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (log) => [
    uniqueIndex('medication_log_user_med_date_time_unique').on(
      log.userId,
      log.medicationId,
      log.entryDate,
      log.scheduledTime,
    ),
    index('medication_log_user_date_idx').on(log.userId, log.entryDate),
  ],
);

function timestamps() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  };
}

export const financialInstitutions = pgTable(
  'financial_institution',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    ...timestamps(),
  },
  (institution) => [
    uniqueIndex('financial_institution_user_name_unique').on(
      institution.userId,
      sql`lower(${institution.name})`,
    ),
  ],
);

export const financialAccounts = pgTable(
  'financial_account',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    institutionId: text('institution_id')
      .notNull()
      .references(() => financialInstitutions.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    accountType: text('account_type').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    openingBalanceMinor: bigint('opening_balance_minor', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps(),
  },
  (account) => [
    index('financial_account_user_archived_idx').on(
      account.userId,
      account.archivedAt,
    ),
    check(
      'financial_account_currency',
      sql`${account.currency} in ('BRL', 'USD', 'EUR')`,
    ),
  ],
);

export const creditCards = pgTable(
  'credit_card',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    institutionId: text('institution_id')
      .notNull()
      .references(() => financialInstitutions.id, { onDelete: 'restrict' }),
    nickname: text('nickname').notNull(),
    brand: text('brand'),
    last4: text('last4'),
    creditLimitMinor: bigint('credit_limit_minor', { mode: 'bigint' }),
    closingDay: integer('closing_day').notNull(),
    dueDay: integer('due_day').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps(),
  },
  (card) => [
    index('credit_card_user_archived_idx').on(card.userId, card.archivedAt),
    check(
      'credit_card_days',
      sql`${card.closingDay} between 1 and 31 and ${card.dueDay} between 1 and 31`,
    ),
    check(
      'credit_card_last4',
      sql`${card.last4} is null or ${card.last4} ~ '^[0-9]{4}$'`,
    ),
    check(
      'credit_card_currency',
      sql`${card.currency} in ('BRL', 'USD', 'EUR')`,
    ),
    check(
      'credit_card_limit_non_negative',
      sql`${card.creditLimitMinor} is null or ${card.creditLimitMinor} >= 0`,
    ),
  ],
);

export const statements = pgTable(
  'statement',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').references(() => financialAccounts.id, {
      onDelete: 'restrict',
    }),
    creditCardId: text('credit_card_id').references(() => creditCards.id, {
      onDelete: 'restrict',
    }),
    referenceMonth: date('reference_month').notNull(),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    dueDate: date('due_date'),
    declaredTotalMinor: bigint('declared_total_minor', { mode: 'bigint' }),
    currency: char('currency', { length: 3 }).notNull(),
    status: text('status').notNull().default('attached'),
    ...timestamps(),
  },
  (statement) => [
    index('statement_user_month_idx').on(
      statement.userId,
      statement.referenceMonth,
    ),
    check(
      'statement_one_owner',
      sql`(${statement.accountId} is null) <> (${statement.creditCardId} is null)`,
    ),
    check(
      'statement_period',
      sql`${statement.periodStart} <= ${statement.periodEnd}`,
    ),
    check(
      'statement_currency',
      sql`${statement.currency} in ('BRL', 'USD', 'EUR')`,
    ),
  ],
);

export const statementAttachments = pgTable(
  'statement_attachment',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    statementId: text('statement_id')
      .notNull()
      .references(() => statements.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    checksum: text('checksum').notNull(),
    ...timestamps(),
  },
  (attachment) => [
    uniqueIndex('statement_attachment_statement_unique').on(
      attachment.statementId,
    ),
  ],
);

export const importBatches = pgTable(
  'import_batch',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    statementId: text('statement_id')
      .notNull()
      .references(() => statements.id, { onDelete: 'cascade' }),
    sourceFormat: text('source_format').notNull(),
    status: text('status').notNull().default('preview'),
    rowCount: integer('row_count').notNull().default(0),
    importedCount: integer('imported_count').notNull().default(0),
    ignoredCount: integer('ignored_count').notNull().default(0),
    mappingConfig: jsonb('mapping_config'),
    draftRows: jsonb('draft_rows'),
    ...timestamps(),
  },
  (batch) => [index('import_batch_statement_idx').on(batch.statementId)],
);

export const transactionCategories = pgTable(
  'transaction_category',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    icon: text('icon'),
    parentId: text('parent_id'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps(),
  },
  (category) => [
    uniqueIndex('transaction_category_user_name_unique').on(
      category.userId,
      sql`lower(${category.name})`,
    ),
    index('transaction_category_user_archived_idx').on(
      category.userId,
      category.archivedAt,
    ),
    foreignKey({
      columns: [category.parentId],
      foreignColumns: [category.id],
      name: 'transaction_category_parent_fk',
    }).onDelete('restrict'),
  ],
);

export const transactions = pgTable(
  'transaction',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').references(() => financialAccounts.id, {
      onDelete: 'restrict',
    }),
    creditCardId: text('credit_card_id').references(() => creditCards.id, {
      onDelete: 'restrict',
    }),
    statementId: text('statement_id').references(() => statements.id, {
      onDelete: 'restrict',
    }),
    importBatchId: text('import_batch_id').references(() => importBatches.id, {
      onDelete: 'restrict',
    }),
    transactionDate: date('transaction_date').notNull(),
    postedDate: date('posted_date'),
    description: text('description').notNull(),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    direction: text('direction').notNull(),
    type: text('type').notNull(),
    categoryId: text('category_id').references(() => transactionCategories.id, {
      onDelete: 'restrict',
    }),
    installmentNumber: integer('installment_number'),
    installmentTotal: integer('installment_total'),
    dedupeHash: text('dedupe_hash').notNull(),
    externalId: text('external_id'),
    notes: text('notes'),
    ...timestamps(),
  },
  (row) => [
    index('transaction_user_date_idx').on(row.userId, row.transactionDate),
    index('transaction_user_account_idx').on(row.userId, row.accountId),
    index('transaction_user_card_idx').on(row.userId, row.creditCardId),
    index('transaction_import_batch_idx').on(row.importBatchId),
    index('transaction_user_dedupe_idx').on(row.userId, row.dedupeHash),
    index('transaction_user_external_idx').on(row.userId, row.externalId),
    check(
      'transaction_one_owner',
      sql`(${row.accountId} is null) <> (${row.creditCardId} is null)`,
    ),
    check('transaction_amount_positive', sql`${row.amountMinor} > 0`),
    check(
      'transaction_currency',
      sql`${row.currency} in ('BRL', 'USD', 'EUR')`,
    ),
    check(
      'transaction_direction',
      sql`(${row.type} = 'expense' and ${row.direction} = 'outflow')
        or (${row.type} = 'income' and ${row.direction} = 'inflow')
        or (${row.type} = 'refund' and ${row.direction} = 'inflow')
        or (${row.type} in ('invoice_payment', 'transfer'))`,
    ),
    check(
      'transaction_installments',
      sql`(${row.installmentNumber} is null and ${row.installmentTotal} is null)
        or (
          ${row.installmentNumber} is not null
          and ${row.installmentTotal} is not null
          and ${row.installmentTotal} >= 1
          and ${row.installmentNumber} between 1 and ${row.installmentTotal}
        )`,
    ),
  ],
);

export const investmentAssets = pgTable(
  'investment_asset',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    institutionId: text('institution_id')
      .notNull()
      .references(() => financialInstitutions.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    ticker: text('ticker'),
    assetClass: text('asset_class').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps(),
  },
  (asset) => [
    index('investment_asset_user_archived_idx').on(
      asset.userId,
      asset.archivedAt,
    ),
    check(
      'investment_asset_currency',
      sql`${asset.currency} in ('BRL', 'USD', 'EUR')`,
    ),
  ],
);

export const investmentTransactions = pgTable(
  'investment_transaction',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assetId: text('asset_id')
      .notNull()
      .references(() => investmentAssets.id, { onDelete: 'cascade' }),
    operationType: text('operation_type').notNull(),
    operationDate: date('operation_date').notNull(),
    quantity: numeric('quantity', { precision: 20, scale: 8 }).notNull(),
    unitPriceMinor: bigint('unit_price_minor', { mode: 'bigint' }).notNull(),
    feesMinor: bigint('fees_minor', { mode: 'bigint' })
      .notNull()
      .default(sql`0`),
    currency: char('currency', { length: 3 }).notNull(),
    notes: text('notes'),
    ...timestamps(),
  },
  (operation) => [
    index('investment_transaction_asset_date_idx').on(
      operation.assetId,
      operation.operationDate,
      operation.createdAt,
    ),
    check(
      'investment_transaction_currency',
      sql`${operation.currency} in ('BRL', 'USD', 'EUR')`,
    ),
    check(
      'investment_transaction_fees_non_negative',
      sql`${operation.feesMinor} >= 0`,
    ),
  ],
);

export const investmentValuations = pgTable(
  'investment_valuation',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assetId: text('asset_id')
      .notNull()
      .references(() => investmentAssets.id, { onDelete: 'cascade' }),
    valuationDate: date('valuation_date').notNull(),
    unitValueMinor: bigint('unit_value_minor', { mode: 'bigint' }),
    totalValueMinor: bigint('total_value_minor', { mode: 'bigint' }),
    source: text('source').notNull().default('manual'),
    ...timestamps(),
  },
  (valuation) => [
    index('investment_valuation_asset_date_idx').on(
      valuation.assetId,
      valuation.valuationDate,
      valuation.createdAt,
    ),
    check(
      'investment_valuation_one_value',
      sql`(${valuation.unitValueMinor} is null) <> (${valuation.totalValueMinor} is null)`,
    ),
    check('investment_valuation_source', sql`${valuation.source} = 'manual'`),
  ],
);
