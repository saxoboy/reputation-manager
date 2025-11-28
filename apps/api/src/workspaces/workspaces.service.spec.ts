import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '@reputation-manager/database';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: PrismaService;

  const mockPrisma = {
    workspace: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceUser: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserWorkspaces', () => {
    it('should return all workspaces for a user with their roles', async () => {
      const userId = 'user-123';
      const mockWorkspaceUsers = [
        {
          workspace: {
            id: 'ws-1',
            name: 'Consultorio Dr. Pérez',
            plan: 'STARTER',
            messageCredits: 500,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          role: 'OWNER',
          createdAt: new Date(),
        },
      ];

      mockPrisma.workspaceUser.findMany.mockResolvedValue(mockWorkspaceUsers);

      const result = await service.findUserWorkspaces(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'ws-1',
        name: 'Consultorio Dr. Pérez',
        role: 'OWNER',
      });
      expect(prisma.workspaceUser.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          workspace: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('create', () => {
    it('should create a workspace and assign user as OWNER', async () => {
      const userId = 'user-123';
      const dto = { name: 'Mi Consultorio' };
      const mockWorkspace = {
        id: 'ws-new',
        name: 'Mi Consultorio',
        plan: 'FREE',
        messageCredits: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        users: [{ role: 'OWNER' }],
      };

      mockPrisma.workspace.create.mockResolvedValue(mockWorkspace);

      const result = await service.create(userId, dto);

      expect(result).toMatchObject({
        id: 'ws-new',
        name: 'Mi Consultorio',
        plan: 'FREE',
        messageCredits: 50,
      });
      expect(prisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: dto.name,
            plan: 'FREE',
            messageCredits: 50,
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return workspace if user has access', async () => {
      const workspaceId = 'ws-1';
      const userId = 'user-123';
      const mockWorkspace = {
        id: 'ws-1',
        name: 'Consultorio',
        plan: 'STARTER',
        messageCredits: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
        users: [{ userId, role: 'OWNER' }],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.findOne(workspaceId, userId);

      expect(result).toMatchObject({
        id: 'ws-1',
        name: 'Consultorio',
      });
    });

    it('should throw error if workspace not found', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ws-999', 'user-123')).rejects.toThrow(
        'Workspace no encontrado'
      );
    });
  });

  describe('update', () => {
    it('should update workspace if user is OWNER', async () => {
      const workspaceId = 'ws-1';
      const userId = 'user-123';
      const dto = { name: 'Nuevo Nombre' };
      const mockUpdated = {
        id: 'ws-1',
        name: 'Nuevo Nombre',
        plan: 'STARTER',
        messageCredits: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'OWNER',
      });
      mockPrisma.workspace.update.mockResolvedValue(mockUpdated);

      const result = await service.update(workspaceId, userId, dto);

      expect(result).toEqual(mockUpdated);
    });

    it('should throw error if user is not OWNER', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'DOCTOR',
      });

      await expect(
        service.update('ws-1', 'user-123', { name: 'Test' })
      ).rejects.toThrow('Solo el OWNER puede actualizar el workspace');
    });
  });

  describe('remove', () => {
    it('should delete workspace if user is last OWNER', async () => {
      const workspaceId = 'ws-1';
      const userId = 'user-123';

      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(1); // Solo 1 OWNER
      mockPrisma.workspace.delete.mockResolvedValue({ id: 'ws-1' });

      await service.remove(workspaceId, userId);

      expect(prisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
    });

    it('should throw error if user is not OWNER', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'DOCTOR',
      });

      await expect(service.remove('ws-1', 'user-123')).rejects.toThrow(
        'Solo el OWNER puede eliminar el workspace'
      );
    });

    it('should throw error if there are other OWNERs', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(2); // 2 OWNERs

      await expect(service.remove('ws-1', 'user-123')).rejects.toThrow(
        'No puedes eliminar un workspace con otros usuarios'
      );
    });
  });
});
