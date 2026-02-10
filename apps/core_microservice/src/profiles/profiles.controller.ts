import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@CurrentUser() user: CurrentUserType) {
    return await this.profilesService.getMyProfile(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.profilesService.updateProfile(user.id, dto);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get public profile by username' })
  async getProfileByUsername(@Param('username') username: string) {
    return await this.profilesService.getProfileByUsername(username);
  }

  @Get(':username/followers')
  @ApiOperation({ summary: 'Get users following this profile' })
  async getFollowers(@Param('username') username: string) {
    return await this.profilesService.getFollowers(username);
  }

  // Исправлена опечатка: asyncyb -> async
  @Get(':username/following')
  @ApiOperation({ summary: 'Get users this profile is following' })
  async getFollowing(@Param('username') username: string) {
    return await this.profilesService.getFollowing(username);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user by username' })
  async followUser(
    @Param('username') username: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.profilesService.followProfile(user.id, username);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user by username' })
  async unfollowUser(
    @Param('username') username: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.profilesService.unfollowProfile(user.id, username);
  }
}
