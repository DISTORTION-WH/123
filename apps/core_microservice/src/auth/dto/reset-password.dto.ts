import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Reset token received via email',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'New password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
