import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my profile' })
  async getMyProfile(@CurrentUser() user: CurrentUserType) {
    return this.profilesService.getProfileByUserId(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my profile' })
  async updateMyProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.id, dto);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get profile by username' })
  @ApiBearerAuth()
  async getProfile(
    @Param('username') username: string,
    // Делаем Guard опциональным или извлекаем юзера вручную, если хотим public access
    // Но для простоты используем Guard, если токен передан.
    // В NestJS это требует Custom Guard, но пока предположим, что endpoint публичный,
    // но если клиент передает хедер, мы его парсим.
    // Для базовой версии: просто метод публичный, isFollowing будет false, если нет токена.
    // Если нужно строго проверять подписку - лучше требовать авторизацию.
  ) {
    // В данном случае передаем undefined как ID текущего юзера для публичного доступа
    // Либо реализуем логику "Optional Auth".
    // Оставим пока без проверки isFollowing для анонимов.
    return this.profilesService.getProfileByUsername(username);
  }

  // --- Follow Endpoints ---

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  async followUser(
    @Param('username') username: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.profilesService.followUser(user.id, username);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollowUser(
    @Param('username') username: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.profilesService.unfollowUser(user.id, username);
  }

  @Get(':username/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiQuery({ name: 'page', required: false })
  async getFollowers(
    @Param('username') username: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.profilesService.getFollowers(username, page);
  }

  @Get(':username/following')
  @ApiOperation({ summary: 'Get who user is following' })
  @ApiQuery({ name: 'page', required: false })
  async getFollowing(
    @Param('username') username: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.profilesService.getFollowing(username, page);
  }
}
