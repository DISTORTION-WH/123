import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(user.id, createPostDto);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user feed' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFeed(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postsService.getFeed(user.id, Number(page), Number(limit));
  }

  @Get('user/:username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts by username' })
  getUserPosts(
    @Param('username') username: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.postsService.getPostsByUsername(username, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  getOne(@Param('id') id: string) {
    // TODO: Pass current user ID if token is present (optional auth)
    return this.postsService.findOne(id);
  }

  @Put(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a post' })
  async toggleLike(
    @Param('id') postId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.postsService.toggleLike(user.id, postId);
  }
}
