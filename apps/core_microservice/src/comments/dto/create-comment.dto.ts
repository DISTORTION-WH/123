import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great post!', description: 'Comment content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiProperty({ example: 'uuid-of-post', description: 'ID of the post' })
  @IsUUID()
  postId: string;

  @ApiPropertyOptional({
    example: 'uuid-of-parent-comment',
    description: 'ID of parent comment (if reply)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
