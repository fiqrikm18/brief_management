import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../../../../database/database.provider.js';
import type { Database } from '../../../../database/database.types.js';
import { users } from '../../../../database/schema/index.js';
import { UsersRepository } from '../../domain/repositories/users.repository.js';
import type {
  User,
  CreateUserData,
} from '../../domain/entities/user.entity.js';

@Injectable()
export class DrizzleUsersRepository implements UsersRepository {
  constructor(
    @Inject(DATABASE)
    private readonly db: Database,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }
}
