import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreatePostDto,
  ) {
    return await this.postsService.create(user.id, dto);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global feed (subscriptions + own posts)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeed(
    @CurrentUser() user: CurrentUserType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.postsService.getFeed(user.id, page, limit);
  }

  @Get('user/:username')
  @UseGuards(JwtAuthGuard) // Добавляем Guard, чтобы получить ID текущего пользователя
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts by user profile' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUserPosts(
    @Param('username') username: string,
    @CurrentUser() user: CurrentUserType, // Получаем юзера для проверки лайков
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return await this.postsService.getPostsByUsername(
      username,
      user?.id, // Передаем ID, если пользователь авторизован
      page,
      limit,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single post details' })
  async getOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType, // Получаем юзера
  ) {
    return await this.postsService.findOne(id, user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update post content or assets' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdatePostDto,
  ) {
    return await this.postsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete post' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return await this.postsService.remove(id, user.id);
  }

  // --- НОВЫЙ МЕТОД ДЛЯ ЛАЙКОВ ---
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on post' })
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return await this.postsService.toggleLike(user.id, id);
  }
}
