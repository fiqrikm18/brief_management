import type { User, CreateUserData } from '../entities/user.entity.js';

export abstract class UsersRepository {
  abstract create(data: CreateUserData): Promise<User>;

  abstract findById(id: string): Promise<User | null>;

  abstract findByEmail(email: string): Promise<User | null>;
}
