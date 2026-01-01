import Database from 'better-sqlite3';
import { schema, schemaExtended } from './schema.js';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database('data/shortener.db');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const database = getDb();
  database.exec(schema);
  database.exec(schemaExtended);
  runMigrations(database);
}

function runMigrations(database: Database.Database): void {
  try {
    const hasAvatar = database.prepare("SELECT * FROM pragma_table_info('users') WHERE name = 'avatar'").get();
    if (!hasAvatar) {
      database.exec("ALTER TABLE users ADD COLUMN avatar TEXT");
    }
  } catch (e) {
  }
}

export function closeDb(): void {
  if (db) db.close();
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function execute(sql: string, params: unknown[] = []): Database.RunResult {
  return getDb().prepare(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
  return getDb().transaction(fn)();
}
