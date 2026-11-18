import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import postgres from 'postgres';

import { createDatabase } from './database.types.js';
import type { Database } from './database.types.js';

export const DATABASE = Symbol('DATABASE');

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly db: Database;

  private readonly client: postgres.Sql;

  constructor(config: ConfigService) {
    this.client = postgres(config.getOrThrow<string>('DATABASE_URL'), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    this.db = createDatabase(this.client);
  }

  async onApplicationShutdown() {
    await this.client.end();
  }
}

export const databaseProvider = {
  provide: DATABASE,
  useFactory: (database: DatabaseService) => database.db,
  inject: [DatabaseService],
};
