import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(user.id, createPostDto);
  }

  @Put(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a post' })
  async toggleLike(
    @Param('id') postId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.postsService.toggleLike(user.id, postId);
  }
}
