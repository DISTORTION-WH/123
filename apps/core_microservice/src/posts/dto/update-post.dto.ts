import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'Updated content',
    description: 'New content',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  content?: string;

  @ApiPropertyOptional({ example: false, description: 'Archive post' })
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({
    description: 'New list of asset IDs',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds?: string[];
}
