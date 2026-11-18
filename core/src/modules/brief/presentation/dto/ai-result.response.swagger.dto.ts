import { ApiProperty } from '@nestjs/swagger';

import { MissingInfoResponseDto } from './missing-info.response.swagger.dto.js';

export class AiResultResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'AI result identifier',
  })
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Associated brief identifier',
  })
  briefId: string;

  @ApiProperty({
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
    description: 'AI processing status',
  })
  aiStatus: string;

  @ApiProperty({
    example: 'Client needs a modern corporate website with CMS.',
    nullable: true,
    description: 'AI-generated summary',
  })
  aiSummary: string | null;

  @ApiProperty({
    enum: ['Branding', 'Website', 'Mobile App', 'AI Automation', 'Social Media', 'Lainnya'],
    example: 'Website',
    nullable: true,
    description: 'Service category',
  })
  serviceCategory: string | null;

  @ApiProperty({
    enum: ['High', 'Medium', 'Low'],
    example: 'High',
    nullable: true,
    description: 'Priority level',
  })
  priority: string | null;

  @ApiProperty({
    example: 'Client has urgent launch deadline.',
    nullable: true,
    description: 'Priority reason',
  })
  priorityReason: string | null;

  @ApiProperty({
    example: 'AI processing failed due to timeout.',
    nullable: true,
    description: 'Error message if failed',
  })
  aiErrorMessage: string | null;

  @ApiProperty({
    type: [MissingInfoResponseDto],
    description: 'Missing information items',
  })
  missingInfos: MissingInfoResponseDto[];

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
