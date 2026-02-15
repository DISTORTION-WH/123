import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'chupapi munyanio', description: 'Message content' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'reply to message id' })
  @IsUUID()
  @IsOptional()
  replyToMessageId?: string;

  @ApiPropertyOptional({ description: 'Array of uploaded asset ids' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  fileIds?: string[];

  @ApiPropertyOptional({ description: 'id of the post being shared' })
  @IsUUID()
  @IsOptional()
  postId?: string;
}
