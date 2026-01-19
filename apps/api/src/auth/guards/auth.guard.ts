import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { auth } from '../auth.config';

/**
 * AuthGuard - Verifica que el usuario esté autenticado
 *
 * Uso:
 * @UseGuards(AuthGuard)
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) { ... }
 */
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Better Auth verifica la sesión usando cookies
      const session = await auth.api.getSession({
        headers: request.headers as Record<string, string>,
      });

      if (!session || !session.user) {
        throw new UnauthorizedException('No autenticado');
      }

      // Adjuntar usuario y sesión al request
      request['user'] = session.user;
      request['session'] = session.session;

      return true;
    } catch (error) {
      console.error('AuthGuard error:', error);
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
  }
}
