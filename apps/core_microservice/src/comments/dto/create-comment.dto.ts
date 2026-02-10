import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Nice post!', description: 'Content of the comment' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'uuid-of-post', description: 'ID of the post' })
  @IsUUID()
  @IsNotEmpty()
  postId: string;
}
