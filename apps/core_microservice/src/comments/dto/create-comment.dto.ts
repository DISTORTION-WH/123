import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Great post!',
    description: 'Content of the comment',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiProperty({ example: 'uuid-of-post', description: 'Post ID' })
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @ApiPropertyOptional({
    example: 'uuid-of-parent-comment',
    description: 'Parent Comment ID (if reply)',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
