import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  async create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return await this.commentsService.create(user.id, dto);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get comments for a post' })
  async findByPostId(@Param('postId') postId: string) {
    return await this.commentsService.findByPostId(postId);
  }
}
