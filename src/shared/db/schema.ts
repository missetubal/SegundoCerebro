import { sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
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
