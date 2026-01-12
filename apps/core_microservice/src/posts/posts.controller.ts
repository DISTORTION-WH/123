import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createPostDto: CreatePostDto,
  ) {
    // Мы типизировали user, теперь TS знает, что там есть поле id (или userId)
    // В ProfilesController используется user.id, поэтому здесь я тоже использую user.id
    return this.postsService.create(user.id, createPostDto);
  }
}
