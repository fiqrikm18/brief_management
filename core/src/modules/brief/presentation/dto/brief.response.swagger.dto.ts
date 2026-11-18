import { ApiProperty } from '@nestjs/swagger';

import { AiResultResponseDto } from './ai-result.response.swagger.dto.js';

export class BriefResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Brief identifier',
  })
  id: string;

  @ApiProperty({ example: 'Acme Corp', description: 'Client name' })
  clientName: string;

  @ApiProperty({
    example: 'contact@acme.com',
    format: 'email',
    description: 'Client email address',
  })
  clientEmail: string;

  @ApiProperty({ example: 'Acme Corporation', description: 'Company name' })
  companyName: string;

  @ApiProperty({
    example: 'We need a corporate website with CMS and contact form.',
    description: 'Project requirements',
  })
  requirements: string;

  @ApiProperty({ example: '$5,000 - $10,000', description: 'Budget range' })
  budgetRange: string;

  @ApiProperty({
    example: '2025-03-31T00:00:00.000Z',
    format: 'date-time',
    description: 'Target timeline',
  })
  targetTimeline: Date;

  @ApiProperty({
    enum: ['NEW', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST'],
    example: 'NEW',
    description: 'Pipeline status',
  })
  pipelineStatus: string;

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

  @ApiProperty({
    type: AiResultResponseDto,
    nullable: true,
    description: 'AI processing result',
  })
  aiResult: AiResultResponseDto | null;
}

export class BriefListResponseDto {
  @ApiProperty({
    type: [BriefResponseDto],
    description: 'List of briefs',
  })
  data: BriefResponseDto[];

  @ApiProperty({ example: 1, description: 'Current page' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 42, description: 'Total items' })
  total: number;
}
