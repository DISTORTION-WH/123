import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({
    example: 'username_to_add',
    description: 'Username of the user to add to the group',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
