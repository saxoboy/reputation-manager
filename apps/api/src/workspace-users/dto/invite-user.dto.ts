import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class InviteUserDto {
  @IsEmail({}, { message: 'Email debe ser válido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @IsEnum(UserRole, { message: 'Rol inválido' })
  @IsNotEmpty({ message: 'Rol es requerido' })
  role: UserRole;
}
