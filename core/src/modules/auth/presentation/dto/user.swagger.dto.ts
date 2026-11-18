import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User identifier',
  })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    format: 'email',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}

export class MeDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User identifier',
  })
  userId: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    format: 'email',
    description: 'User email address',
  })
  email: string;
}
