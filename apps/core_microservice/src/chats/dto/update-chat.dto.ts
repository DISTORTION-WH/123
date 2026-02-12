import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChatDto {
  @ApiPropertyOptional({ example: 'New Chat Name', description: 'Chat name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Description...',
    description: 'Chat description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
