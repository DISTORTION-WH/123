// apps/core_microservice/src/chats/dto/toggle-reaction.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleReactionDto {
  @ApiProperty({ example: '❤️', description: 'Emoji reaction' })
  @IsString()
  @IsNotEmpty()
  reaction: string;
}
