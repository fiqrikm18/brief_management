import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { RegisterInput } from '../presentation/dto/register.dto.js';
import { LoginInput } from '../presentation/dto/login.dto.js';
import { UsersService } from '../../user/application/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const existingUser = await this.usersService.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    const user = await this.usersService.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const accessToken = await this.generateToken(user.id, user.email);

    return {
      user,
      accessToken,
    };
  }

  async login(input: LoginInput) {
    const user = await this.usersService.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      input.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateToken(user.id, user.email);

    const { passwordHash, ...publicUser } = user;

    return {
      user: publicUser,
      accessToken,
    };
  }

  private async generateToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      email,
    });
  }
}
