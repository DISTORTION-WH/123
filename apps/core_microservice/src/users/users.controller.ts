import { Controller, Get, UseGuards } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { HTTP_STATUS } from '../constants/error-messages';
import {
  CurrentUser,
  CurrentUserData, // Используем интерфейс
} from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersService, UserSyncDto } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('current_user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user from JWT token' })
  @ApiResponse({
    status: HTTP_STATUS.OK,
    description: 'Current user retrieved successfully',
  })
  @ApiResponse({
    status: HTTP_STATUS.UNAUTHORIZED,
    description: 'Invalid or missing token',
  })
  @ApiResponse({ status: HTTP_STATUS.NOT_FOUND, description: 'User not found' })
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    // Исправлен тип
    return await this.usersService.getCurrentUser(user.id);
  }

  @EventPattern()
  async handleUserCreated(@Payload() data: unknown) {
    console.log('[UsersController] Received user sync event:', data);

    let userData: UserSyncDto;

    // Безопасный парсинг данных
    if (Buffer.isBuffer(data)) {
      const parsed = JSON.parse(data.toString()) as UserSyncDto;
      userData = parsed;
    } else {
      userData = data as UserSyncDto;
    }

    await this.usersService.syncUser(userData);
  }
}
