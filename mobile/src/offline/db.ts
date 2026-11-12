/**
 * Base de dados local (SQLite) usada para o modo offline (Fase 5).
 *  - `outbox`: operações de avaliação feitas sem ligação, à espera de sincronização.
 *  - `cache`: última cópia das leituras do estudante (cadeiras, elegibilidade, avaliações).
 * Nada aqui é fonte de verdade: o servidor decide sempre (período pela hora do servidor, versões, duplicados).
 */
import * as SQLite from 'expo-sqlite';

let promessa: Promise<SQLite.SQLiteDatabase> | null = null;

export function obterDb(): Promise<SQLite.SQLiteDatabase> {
  promessa ??= (async () => {
    const db = await SQLite.openDatabaseAsync('avaliaprof.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        op TEXT NOT NULL,
        clientId TEXT,
        evaluationId TEXT,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        code TEXT,
        message TEXT,
        createdAt INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS outbox_user ON outbox(userId, id);
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        value TEXT NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
    return db;
  })();
  // Se a abertura falhar, a próxima chamada tenta de novo.
  promessa.catch(() => { promessa = null; });
  return promessa;
}
