import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUser as CurrentUserType,
} from '../decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.id, dto);
  }

  @Get('post/:postId')
  @UseGuards(JwtAuthGuard) // Опционально, чтобы видеть isLiked
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getByPost(
    @Param('postId') postId: string,
    @CurrentUser() user: CurrentUserType,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    // Если user не авторизован (в зависимости от гарда), user будет undefined или null
    return this.commentsService.getCommentsByPost(
      postId,
      user?.id,
      page,
      limit,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete comment' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.commentsService.delete(id, user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on comment' })
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.commentsService.toggleLike(user.id, id);
  }
}
