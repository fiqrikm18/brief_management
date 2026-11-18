import { ApiProperty } from '@nestjs/swagger';

export class MissingInfoResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Missing info item identifier',
  })
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'AI result identifier',
  })
  aiResultId: string;

  @ApiProperty({
    example: 'Target audience demographics',
    description: 'Missing information item text',
  })
  itemText: string;
}
