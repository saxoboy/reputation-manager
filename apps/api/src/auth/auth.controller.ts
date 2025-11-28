import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register
   * Registra un nuevo usuario
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Inicia sesión (manejado por Better Auth directamente vía middleware)
   * Este endpoint es principalmente para documentación
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login() {
    // Better Auth maneja esto automáticamente via su API
    return {
      message: 'Use el endpoint de Better Auth: POST /api/auth/sign-in/email',
    };
  }

  /**
   * GET /auth/me
   * Obtiene información del usuario actual
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async me(
    @CurrentUser() user: User,
    @Headers() headers: Record<string, string>
  ) {
    return this.authService.getSession(headers);
  }

  /**
   * POST /auth/logout
   * Cierra la sesión del usuario
   */
  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Headers() headers: Record<string, string>) {
    return this.authService.logout(headers);
  }
}
