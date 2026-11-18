import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/user.decorator.js';
import { UsersService } from '../application/users.service.js';
import {
  AuthGuard,
  type AuthenticatedUser,
} from '../../../common/guards/auth.guard.js';
import { UserResponseDto } from './dto/user-response.swagger.dto.js';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.usersService.findById(user.id);

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return profile;
  }
}
