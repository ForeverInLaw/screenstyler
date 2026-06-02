import { isSqliteMode } from './client';
import * as pgSchema from './schema';
import * as sqliteSchema from './schema-sqlite';

export const activeSchema = isSqliteMode() ? sqliteSchema : pgSchema;

// The runtime schema is chosen by mode, but the two dialects produce distinct
// (incompatible) table types. Collapse to the pg type so callers see a single
// concrete table — mirrors the Db type collapse in client.ts.
export const users = activeSchema.users as unknown as typeof pgSchema.users;
export const sessions = activeSchema.sessions as unknown as typeof pgSchema.sessions;
export const accounts = activeSchema.accounts as unknown as typeof pgSchema.accounts;
export const verifications = activeSchema.verifications as unknown as typeof pgSchema.verifications;
export const projects = activeSchema.projects as unknown as typeof pgSchema.projects;
