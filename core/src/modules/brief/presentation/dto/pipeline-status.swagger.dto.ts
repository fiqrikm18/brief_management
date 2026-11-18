import { ApiProperty } from '@nestjs/swagger';

export type PipelineStatusDto =
  | 'NEW'
  | 'CONTACTED'
  | 'PROPOSAL'
  | 'WON'
  | 'LOST';

export class UpdatePipelineStatusDto {
  @ApiProperty({
    enum: ['NEW', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST'],
    example: 'CONTACTED',
    description: 'New pipeline status',
  })
  pipelineStatus: PipelineStatusDto;
}

export class RetryAiDto {
  @ApiProperty({
    enum: ['google', 'openai'],
    example: 'google',
    description: 'AI provider to use',
    required: false,
  })
  aiProvider?: 'google' | 'openai';
}
