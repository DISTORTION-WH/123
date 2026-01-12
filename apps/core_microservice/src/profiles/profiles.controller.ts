import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Интерфейс для типизации данных из токена
interface ICurrentUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@CurrentUser() user: ICurrentUser) {
    return await this.profilesService.getMyProfile(user.userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.profilesService.updateProfile(user.userId, dto);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get public profile by username' })
  async getProfileByUsername(@Param('username') username: string) {
    return await this.profilesService.getProfileByUsername(username);
  }
}
