import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';

export function createDatabase(client: postgres.Sql) {
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
