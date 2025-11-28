import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePracticeDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la práctica es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La dirección no puede exceder 200 caracteres' })
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  phone?: string;

  @IsOptional()
  @IsString()
  googlePlaceId?: string;
}
