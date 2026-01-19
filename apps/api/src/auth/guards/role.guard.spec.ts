import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard';
import { UserRole } from '@prisma/client';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RoleGuard(reflector);
  });

  it('debería estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debería permitir acceso si el usuario tiene el rol requerido', () => {
    const mockRequest = {
      workspaceRole: UserRole.OWNER,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.OWNER, UserRole.DOCTOR]);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('debería denegar acceso si el usuario no tiene el rol requerido', () => {
    const mockRequest = {
      workspaceRole: UserRole.RECEPTIONIST,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.OWNER]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debería permitir acceso si no hay roles requeridos', () => {
    const mockRequest = {
      workspaceRole: UserRole.RECEPTIONIST,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(result).toBe(true);
    expect(result).toBe(true);
  });
});
