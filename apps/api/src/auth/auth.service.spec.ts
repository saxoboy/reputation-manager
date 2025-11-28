/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@reputation-manager/database';
import { ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

// Mock de auth.config
jest.mock('./auth.config', () => ({
  auth: {
    api: {
      signUpEmail: jest.fn(),
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

import { auth } from './auth.config';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    workspace: {
      create: jest.fn(),
    },
    workspaceUser: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('debería registrar un usuario exitosamente', async () => {
      const mockUser = {
        id: 'user-123',
        email: registerDto.email,
        name: registerDto.name,
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockWorkspace = {
        id: 'workspace-123',
        name: `Workspace de ${registerDto.name}`,
        plan: 'FREE',
        messageCredits: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth.api.signUpEmail as any).mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
      });
      mockPrismaService.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: mockUser,
        workspace: mockWorkspace,
        token: 'mock-token',
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(auth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          email: registerDto.email,
          password: registerDto.password,
          name: registerDto.name,
        },
      });
    });

    it('debería lanzar ConflictException si el email ya existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
      expect(auth.api.signUpEmail).not.toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('debería obtener la sesión y workspaces del usuario', async () => {
      const mockHeaders = { cookie: 'session=abc123' };
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        session: {
          id: 'session-123',
          userId: 'user-123',
          expiresAt: new Date(),
        },
      };

      const mockWorkspaces = [
        {
          workspace: {
            id: 'workspace-123',
            name: 'Test Workspace',
            plan: 'FREE',
            messageCredits: 50,
          },
          role: UserRole.OWNER,
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth.api.getSession as any).mockResolvedValue(mockSession);
      mockPrismaService.workspaceUser.findMany.mockResolvedValue(
        mockWorkspaces
      );

      const result = await service.getSession(mockHeaders);

      expect(result.user).toEqual(mockSession.user);
      expect(result.workspaces).toHaveLength(1);
      expect(result.workspaces[0].role).toBe(UserRole.OWNER);
    });
  });

  describe('logout', () => {
    it('debería cerrar sesión exitosamente', async () => {
      const mockHeaders = { cookie: 'session=abc123' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth.api.signOut as any).mockResolvedValue(undefined);

      const result = await service.logout(mockHeaders);

      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
      expect(auth.api.signOut).toHaveBeenCalledWith({
        headers: mockHeaders,
      });
    });
  });
});
