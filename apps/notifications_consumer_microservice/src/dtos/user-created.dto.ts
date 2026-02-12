import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class UserCreatedDto {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
