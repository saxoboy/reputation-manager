import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'Rol inválido' })
  @IsNotEmpty({ message: 'Rol es requerido' })
  role: UserRole;
}
