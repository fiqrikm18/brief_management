import { Body, Controller, Post } from '@nestjs/common';
import { BriefService } from '../application/brief.service.js';
import {
  type CreateBriefDto,
  createBriefSchema,
} from './dto/create-brief.dto.js';
import { ValidationPipe } from '../../../common/pipes/validation.pipe.js';

@Controller('briefs')
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Post()
  async submitBrief(
    @Body(new ValidationPipe(createBriefSchema))
    dto: CreateBriefDto,
  ) {
    return await this.briefService.createBrief({
      ...dto,
      targetTimeline: new Date(dto.targetTimeline), // Konversi string dari Zod DTO ke Date untuk Drizzle
    });
  }
}

@Controller('internal/briefs')
export class InternalBriefController {
  constructor(private readonly briefService: BriefService) {}
}
