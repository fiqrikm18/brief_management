import { ApiProperty } from '@nestjs/swagger';

export class CreateBriefSwaggerDto {
  @ApiProperty({
    example: 'Acme Corp',
    description: 'Client name',
  })
  clientName: string;

  @ApiProperty({
    example: 'contact@acme.com',
    format: 'email',
    description: 'Client email address',
  })
  clientEmail: string;

  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Company name',
  })
  companyName: string;

  @ApiProperty({
    example: 'We need a corporate website with CMS and contact form.',
    minLength: 10,
    description: 'Project requirements',
  })
  requirements: string;

  @ApiProperty({
    example: '$5,000 - $10,000',
    description: 'Budget range',
  })
  budgetRange: string;

  @ApiProperty({
    example: '2025-03-31T00:00:00.000Z',
    format: 'date-time',
    description: 'Target timeline',
  })
  targetTimeline: string;
}
