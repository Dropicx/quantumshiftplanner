import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    client = postgres(connectionString);
    db = drizzle(client, { schema });
  }

  return db;
}

export async function closeDatabase() {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}

export { schema };
export * from './schema';
