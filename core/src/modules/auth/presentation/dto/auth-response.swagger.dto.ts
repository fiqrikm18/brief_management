import { ApiProperty } from '@nestjs/swagger';

import { UserDto } from './user.swagger.dto.js';

export class AuthResponseDto {
  @ApiProperty({ type: UserDto, description: 'Registered user' })
  user: UserDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;
}
