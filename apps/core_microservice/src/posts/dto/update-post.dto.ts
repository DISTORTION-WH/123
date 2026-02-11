import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiPropertyOptional({ description: 'Archive the post (hide from feed)' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
