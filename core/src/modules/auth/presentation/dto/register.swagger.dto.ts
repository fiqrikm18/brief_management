import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
    description: 'User full name',
  })
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: 255,
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    minLength: 8,
    maxLength: 128,
    description: 'User password',
  })
  password: string;
}
