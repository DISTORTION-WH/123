import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Hello world!', description: 'Message content' })
  @IsString()
  @IsOptional() // Optional if sending only files
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'Reply to message ID' })
  @IsUUID()
  @IsOptional()
  replyToMessageId?: string;

  @ApiPropertyOptional({ description: 'Array of uploaded asset IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  fileIds?: string[];

  @ApiPropertyOptional({ description: 'ID of the post being shared' })
  @IsUUID()
  @IsOptional()
  postId?: string;
}
