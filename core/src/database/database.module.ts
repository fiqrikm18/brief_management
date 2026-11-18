import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  DATABASE,
  databaseProvider,
  DatabaseService,
} from './database.provider.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService, databaseProvider],
  exports: [DATABASE],
})
export class DatabaseModule {}
