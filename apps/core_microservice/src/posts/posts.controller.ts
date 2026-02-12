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
  @UseGuards(JwtAuthGuard) // Добавил Guard, так как лента теперь персонализированная (нужен ID юзера)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global feed (all posts)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFeed(
    @CurrentUser() user: CurrentUserType, // Добавил получение текущего юзера
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // Исправлено: передаем user.id первым аргументом
    return await this.postsService.getFeed(user.id, page, limit);
  }

  @Get('user/:username')
  @ApiOperation({ summary: 'Get posts by user profile' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getUserPosts(
    @Param('username') username: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    // Исправлено: метод называется getPostsByUsername
    // Можно передать undefined вместо currentUserId, если это публичный эндпоинт,
    // или добавить декоратор @CurrentUser, если нужно проверять лайки.
    return await this.postsService.getPostsByUsername(
      username,
      undefined,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single post details' })
  async getOne(@Param('id') id: string) {
    // Исправлено: метод называется findOne
    return await this.postsService.findOne(id);
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
    // Исправлено: метод называется remove
    return await this.postsService.remove(id, user.id);
  }
}
