import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EditMessageDto {
  @ApiProperty({
    example: 'Updated text content',
    description: 'New message content',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
