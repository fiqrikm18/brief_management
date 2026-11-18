import { Inject, Injectable } from '@nestjs/common';

import { UsersRepository } from '../domain/repositories/users.repository.js';

import type {
  CreateUserData,
  PublicUser,
  User,
} from '../domain/entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository)
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(data: CreateUserData): Promise<PublicUser> {
    const user = await this.usersRepository.create(data);

    return this.toPublicUser(user);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.usersRepository.findById(id);

    return user ? this.toPublicUser(user) : null;
  }

  private toPublicUser(user: User): PublicUser {
    const { passwordHash, ...publicUser } = user;

    return publicUser;
  }
}
