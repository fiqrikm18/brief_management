import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../application/auth.service.js';
import { registerSchema } from './dto/register.dto.js';
import type { RegisterInput } from './dto/register.dto.js';
import { RegisterDto } from './dto/register.swagger.dto.js';
import { ValidationPipe } from '../../../common/pipes/validation.pipe.js';
import { loginSchema } from './dto/login.dto.js';
import type { LoginInput } from './dto/login.dto.js';
import { LoginDto } from './dto/login.swagger.dto.js';
import { AuthResponseDto } from './dto/auth-response.swagger.dto.js';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(
    @Body(new ValidationPipe(registerSchema))
    body: RegisterInput,
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and receive a JWT access token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(
    @Body(new ValidationPipe(loginSchema))
    body: LoginInput,
  ) {
    return this.authService.login(body);
  }
}
