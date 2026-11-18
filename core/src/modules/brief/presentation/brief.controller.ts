import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BriefService } from '../application/brief.service.js';
import {
  type CreateBriefDto,
  createBriefSchema,
} from './dto/create-brief.dto.js';
import { CreateBriefSwaggerDto } from './dto/create-brief.swagger.dto.js';
import { ValidationPipe } from '../../../common/pipes/validation.pipe.js';
import { BriefResponseDto, BriefListResponseDto } from './dto/brief.response.swagger.dto.js';
import { BriefFilterQueryDto } from './dto/brief-filter.query.dto.js';
import { UpdatePipelineStatusDto } from './dto/pipeline-status.swagger.dto.js';
import { RetryAiDto } from './dto/pipeline-status.swagger.dto.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';

@Controller('briefs')
@ApiTags('briefs')
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project brief' })
  @ApiBody({ type: CreateBriefSwaggerDto })
  @ApiResponse({
    status: 201,
    description: 'Brief created successfully',
    type: BriefResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async submitBrief(
    @Body(new ValidationPipe(createBriefSchema))
    dto: CreateBriefDto,
  ) {
    return await this.briefService.createBrief({
      ...dto,
      targetTimeline: new Date(dto.targetTimeline),
    });
  }
}

@Controller('internal/briefs')
@ApiTags('internal-briefs')
@ApiBearerAuth()
export class InternalBriefController {
  constructor(private readonly briefService: BriefService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List project briefs with optional filters' })
  @ApiQuery({
    name: 'category',
    enum: [
      'Branding',
      'Website',
      'Mobile App',
      'AI Automation',
      'Social Media',
      'Lainnya',
    ],
    required: false,
    description: 'Filter by service category',
  })
  @ApiQuery({
    name: 'priority',
    enum: ['High', 'Medium', 'Low'],
    required: false,
    description: 'Filter by priority',
  })
  @ApiQuery({
    name: 'aiStatus',
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    required: false,
    description: 'Filter by AI processing status',
  })
  @ApiQuery({
    name: 'pipelineStatus',
    enum: ['NEW', 'CONTACTED', 'PROPOSAL', 'WON', 'LOST'],
    required: false,
    description: 'Filter by pipeline status',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of briefs',
    type: BriefListResponseDto,
  })
  @ApiBearerAuth('access-token')
  async getBriefs(@Query() filters: BriefFilterQueryDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const { data, total } = await this.briefService.getBriefs({
      category: filters.category,
      priority: filters.priority,
      aiStatus: filters.aiStatus,
      pipelineStatus: filters.pipelineStatus,
      page,
      limit,
    });

    return {
      data,
      page,
      limit,
      total,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get brief detail by ID' })
  @ApiParam({ name: 'id', description: 'Brief identifier', type: String })
  @ApiResponse({
    status: 200,
    description: 'Brief detail',
    type: BriefResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Brief not found' })
  @ApiBearerAuth('access-token')
  async getBriefDetail(@Param('id') id: string) {
    const brief = await this.briefService.getBriefDetail(id);

    if (!brief) {
      throw new NotFoundException('Brief not found');
    }

    return brief;
  }

  @Patch(':id/pipeline-status')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update brief pipeline status' })
  @ApiParam({ name: 'id', description: 'Brief identifier', type: String })
  @ApiBody({ type: UpdatePipelineStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Pipeline status updated',
    type: BriefResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Brief not found' })
  @ApiBearerAuth('access-token')
  async updatePipelineStatus(
    @Param('id') id: string,
    @Body() body: UpdatePipelineStatusDto,
  ) {
    return await this.briefService.updatePipelineStatus(
      id,
      body.pipelineStatus,
    );
  }

  @Post(':id/retry-ai')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Retry AI processing for a brief' })
  @ApiParam({ name: 'id', description: 'Brief identifier', type: String })
  @ApiBody({ type: RetryAiDto })
  @ApiResponse({
    status: 200,
    description: 'AI processing retried',
    type: BriefResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Brief not found' })
  @ApiBearerAuth('access-token')
  async retryAiProcessing(
    @Param('id') briefId: string,
    @Body() body: RetryAiDto,
  ) {
    return await this.briefService.retryAiProcessing(briefId, body.aiProvider);
  }

  @Get(':id/ai-job')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get latest AI processing job status for a brief' })
  @ApiParam({ name: 'id', description: 'Brief identifier', type: String })
  @ApiResponse({
    status: 200,
    description: 'AI job status',
  })
  @ApiResponse({ status: 404, description: 'Brief not found' })
  @ApiBearerAuth('access-token')
  async getAIJob(@Param('id') briefId: string) {
    const job = await this.briefService.getAIJobByBriefId(briefId);

    if (!job) {
      throw new NotFoundException('AI job not found');
    }

    return {
      id: job.id,
      briefId: job.briefId,
      provider: job.provider,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }
}
