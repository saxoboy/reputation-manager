import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { auth } from './auth.config';

/**
 * Middleware para manejar todas las rutas de Better Auth
 * Redirige todas las peticiones a /api/auth/* al handler de Better Auth
 */
@Injectable()
export class BetterAuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response) {
    // Better Auth maneja todas las rutas bajo /api/auth/*
    // El handler de Better Auth necesita un objeto Request Web estándar
    const request = new Request(
      `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      {
        method: req.method,
        headers: req.headers as HeadersInit,
        body:
          req.method !== 'GET' && req.method !== 'HEAD'
            ? JSON.stringify(req.body)
            : undefined,
      }
    );

    const response = await auth.handler(request);

    // Copiar headers de la respuesta de Better Auth a Express
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Establecer status code
    res.status(response.status);

    // Enviar el body
    const body = await response.text();
    res.send(body);
  }
}
