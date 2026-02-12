import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'My wonderful trip!', description: 'Post content' })
  @IsString()
  @MaxLength(2200)
  content: string;

  @ApiPropertyOptional({
    example: ['uuid-1', 'uuid-2'],
    description: 'Array of uploaded asset IDs',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds?: string[];
}
