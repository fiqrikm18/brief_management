import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    format: 'email',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    minLength: 1,
    maxLength: 128,
    description: 'User password',
  })
  password: string;
}
