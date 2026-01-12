import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(2200) // Стандартное ограничение Instagram для описания
  content?: string;

  @IsArray()
  @IsUUID('4', { each: true }) // Проверяем, что каждый элемент массива — это UUID
  @IsOptional()
  fileIds?: string[];
}
