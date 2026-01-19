import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { WorkspaceGuard } from './workspace.guard';
import { PrismaService } from '@reputation-manager/database';
import { UserRole } from '@prisma/client';

describe('WorkspaceGuard', () => {
  let guard: WorkspaceGuard;

  const mockPrismaService = {
    workspaceUser: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceGuard,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<WorkspaceGuard>(WorkspaceGuard);

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(guard).toBeDefined();
  });

  it('debería permitir acceso si el usuario pertenece al workspace', async () => {
    const mockRequest = {
      user: { id: 'user-123' },
      params: { workspaceId: 'workspace-123' },
    };

    const mockWorkspaceUser = {
      workspace: {
        id: 'workspace-123',
        name: 'Test Workspace',
        plan: 'FREE',
        messageCredits: 50,
      },
      role: UserRole.OWNER,
    };

    mockPrismaService.workspaceUser.findUnique.mockResolvedValue(
      mockWorkspaceUser,
    );

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockRequest['workspace']).toEqual(mockWorkspaceUser.workspace);
    expect(mockRequest['workspaceRole']).toBe(UserRole.OWNER);
  });

  it('debería denegar acceso si el usuario no pertenece al workspace', async () => {
    const mockRequest = {
      user: { id: 'user-123' },
      params: { workspaceId: 'workspace-456' },
    };

    mockPrismaService.workspaceUser.findUnique.mockResolvedValue(null);

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('debería lanzar error si no hay workspaceId', async () => {
    const mockRequest = {
      user: { id: 'user-123' },
      params: {},
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
