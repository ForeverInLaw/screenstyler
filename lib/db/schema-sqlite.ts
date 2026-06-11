import { randomUUID } from 'node:crypto';
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    email: text('email').notNull(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    name: text('name'),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
  }),
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    tokenIdx: uniqueIndex('sessions_token_idx').on(t.token),
    userIdIdx: index('sessions_user_id_idx').on(t.userId),
  }),
);

export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    accountId: text('account_id').notNull(),
    password: text('password'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
    scope: text('scope'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    providerAccountIdx: uniqueIndex('accounts_provider_account_idx').on(
      t.providerId,
      t.accountId,
    ),
    userIdIdx: index('accounts_user_id_idx').on(t.userId),
  }),
);

export const verifications = sqliteTable(
  'verifications',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    identifierIdx: index('verifications_identifier_idx').on(t.identifier),
  }),
);

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    doc: text('doc', { mode: 'json' }).notNull(),
    sourceImageKey: text('source_image_key'),
    thumbnailKey: text('thumbnail_key'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    // Note: SQLite/drizzle-orm doesn't support .desc() in index().on() like the
    // PostgreSQL dialect does. The raw SQL migration uses DESC on updated_at;
    // the runtime query uses .desc() in the ORDER BY, so the index direction
    // discrepancy is harmless for local deployments.
    userUpdatedIdx: index('projects_user_updated_idx').on(t.userId, t.updatedAt),
  }),
);
