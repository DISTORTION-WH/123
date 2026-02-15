import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../decorators/current-user.decorator';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  async getMyProfile(@CurrentUser() user: CurrentUserData) {
    return this.profilesService.getProfileByUserId(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', 'uploads'),
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async uploadAvatar(
    @CurrentUser() user: CurrentUserData,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const avatarUrl = `/uploads/${file.filename}`;
    return this.profilesService.updateAvatar(user.id, avatarUrl);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/followers')
  async getMyFollowers(@CurrentUser() user: CurrentUserData) {
    return await this.profilesService.getFollowers(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/following')
  async getMyFollowing(@CurrentUser() user: CurrentUserData) {
    return await this.profilesService.getFollowing(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/friends')
  async getMyFriends(@CurrentUser() user: CurrentUserData) {
    return await this.profilesService.getFriends(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/follow-requests')
  async getFollowRequests(@CurrentUser() user: CurrentUserData) {
    return await this.profilesService.getFollowRequests(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('search')
  async searchProfiles(
    @CurrentUser() user: CurrentUserData,
    @Query('q') query: string,
  ) {
    return this.profilesService.searchProfiles(query, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':username/follow')
  async followUser(
    @CurrentUser() user: CurrentUserData,
    @Param('username') username: string,
  ) {
    return await this.profilesService.followUser(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':username/follow')
  async unfollowUser(
    @CurrentUser() user: CurrentUserData,
    @Param('username') username: string,
  ) {
    return await this.profilesService.unfollowUser(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('me/followers/:username')
  async removeFollower(
    @CurrentUser() user: CurrentUserData,
    @Param('username') username: string,
  ) {
    return await this.profilesService.removeFollower(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('follow-requests/:username/accept')
  async acceptFollowRequest(
    @CurrentUser() user: CurrentUserData,
    @Param('username') username: string,
  ) {
    return await this.profilesService.acceptFollowRequest(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('follow-requests/:username')
  async rejectFollowRequest(
    @CurrentUser() user: CurrentUserData,
    @Param('username') username: string,
  ) {
    return await this.profilesService.rejectFollowRequest(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/blocked')
  @ApiOperation({ summary: 'Get list of blocked users' })
  async getBlockedUsers(@CurrentUser() user: CurrentUserData) {
    return await this.profilesService.getBlockedUsers(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':username/block')
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(
    @CurrentUser() user: CurrentUserData,
    @Param('username') username: string,
  ) {
    return await this.profilesService.blockUser(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':username/block')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(
    @CurrentUser() user: CurrentUserData,
    @Param('username') username: string,
  ) {
    return await this.profilesService.unblockUser(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('me')
  async deleteProfile(@CurrentUser() user: CurrentUserData) {
    return await this.profilesService.softDeleteProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/restore')
  async restoreProfile(@CurrentUser() user: CurrentUserData) {
    return await this.profilesService.restoreProfile(user.id);
  }

  @Get(':username')
  async getProfileByUsername(@Param('username') username: string) {
    const profile = await this.profilesService.getProfileByUsername(username);
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  @Get(':username/followers')
  async getProfileFollowers(@Param('username') username: string) {
    return await this.profilesService.getFollowersByUsername(username);
  }

  @Get(':username/following')
  async getProfileFollowing(@Param('username') username: string) {
    return await this.profilesService.getFollowingByUsername(username);
  }
}
