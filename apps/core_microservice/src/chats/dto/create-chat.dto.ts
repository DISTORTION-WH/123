import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  // IsUUID удален
} from 'class-validator';
import { ChatType } from '../../database/entities/chat.entity';

export class CreateChatDto {
  @ApiProperty({
    example: 'username_to_talk_with',
    description: 'Username of the user to start private chat with',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  targetUsername?: string;

  @ApiPropertyOptional({ enum: ChatType, example: ChatType.PRIVATE })
  @IsEnum(ChatType)
  @IsOptional()
  type?: ChatType;

  @ApiPropertyOptional({
    example: 'My Group Chat',
    description: 'Name for group chat',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Array of usernames to add to group chat',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participantUsernames?: string[];
}
