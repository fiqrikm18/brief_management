import { ApiProperty } from '@nestjs/swagger';

export class PipelineStatusDto {
  @ApiProperty({
    enum: ['NEW', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST'],
    example: 'NEW',
    description: 'Pipeline status value',
  })
  value: 'NEW' | 'CONTACTED' | 'PROPOSAL' | 'WON' | 'LOST';
}

export class BriefFilterQueryDto {
  @ApiProperty({
    enum: ['Branding', 'Website', 'Mobile App', 'AI Automation', 'Social Media', 'Lainnya'],
    example: 'Website',
    description: 'Filter by service category',
    required: false,
  })
  category?: string;

  @ApiProperty({
    enum: ['High', 'Medium', 'Low'],
    example: 'High',
    description: 'Filter by priority',
    required: false,
  })
  priority?: string;

  @ApiProperty({
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
    description: 'Filter by AI processing status',
    required: false,
  })
  aiStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';

  @ApiProperty({
    enum: ['NEW', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST'],
    example: 'NEW',
    description: 'Filter by pipeline status',
    required: false,
  })
  pipelineStatus?: 'NEW' | 'CONTACTED' | 'PROPOSAL' | 'WON' | 'LOST';

  @ApiProperty({ example: 1, description: 'Page number', required: false })
  page?: number;

  @ApiProperty({ example: 10, description: 'Items per page', required: false })
  limit?: number;
}
