import { env } from 'cloudflare:workers';
export function getDB(): D1Database {
 const db = (env as unknown as {DB?: D1Database}).DB;
 if (!db) throw new Error('DATABASE_UNAVAILABLE');
 return db;
}
