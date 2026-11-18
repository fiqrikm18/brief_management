import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersService } from './application/users.service.js';
import { UsersRepository } from './domain/repositories/users.repository.js';
import { DrizzleUsersRepository } from './infrastructure/repositories/drizzle-users.repository.js';
import { UserController } from './presentation/user.controller.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),

        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  providers: [
    UsersService,
    {
      provide: UsersRepository,
      useClass: DrizzleUsersRepository,
    },
  ],
  controllers: [UserController],
  exports: [UsersService],
})
export class UsersModule {}
