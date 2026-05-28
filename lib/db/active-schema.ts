import { isSqliteMode } from './client';
import * as pgSchema from './schema';
import * as sqliteSchema from './schema-sqlite';

export const activeSchema = isSqliteMode() ? sqliteSchema : pgSchema;

export const users = activeSchema.users;
export const sessions = activeSchema.sessions;
export const accounts = activeSchema.accounts;
export const verifications = activeSchema.verifications;
export const projects = activeSchema.projects;
