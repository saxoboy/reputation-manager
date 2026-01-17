import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceUsersService } from './workspace-users.service';
import { PrismaService } from '@reputation-manager/database';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('WorkspaceUsersService', () => {
  let service: WorkspaceUsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    workspaceUser: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceUsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<WorkspaceUsersService>(WorkspaceUsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users in a workspace', async () => {
      const workspaceId = 'ws-1';
      const mockUsers = [
        {
          id: 'wu-1',
          userId: 'user-1',
          workspaceId: 'ws-1',
          role: 'OWNER',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            name: 'Dr. Pérez',
            email: 'perez@example.com',
            image: null,
          },
        },
        {
          id: 'wu-2',
          userId: 'user-2',
          workspaceId: 'ws-1',
          role: 'DOCTOR',
          createdAt: new Date(),
          user: {
            id: 'user-2',
            name: 'Dr. García',
            email: 'garcia@example.com',
            image: null,
          },
        },
      ];

      mockPrisma.workspaceUser.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll(workspaceId);

      // El servicio no retorna userId ni joinedAt, solo filtramos esos campos
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'wu-1',
        role: 'OWNER',
        user: {
          id: 'user-1',
          name: 'Dr. Pérez',
          email: 'perez@example.com',
        },
      });
      expect(prisma.workspaceUser.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    });
  });

  describe('invite', () => {
    it('should allow OWNER to invite any role', async () => {
      const workspaceId = 'ws-1';
      const requesterId = 'user-owner';
      const dto = { email: 'newdoc@example.com', role: 'DOCTOR' as const };

      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-new',
        email: dto.email,
      });
      mockPrisma.workspaceUser.findFirst.mockResolvedValueOnce(null); // No existe
      mockPrisma.workspaceUser.create.mockResolvedValue({
        userId: 'user-new',
        workspaceId,
        role: 'DOCTOR',
      });

      const result = await service.invite(workspaceId, requesterId, dto);

      expect(result).toBeDefined();
      expect(prisma.workspaceUser.create).toHaveBeenCalled();
    });

    it('should allow DOCTOR to invite DOCTOR or RECEPTIONIST', async () => {
      const workspaceId = 'ws-1';
      const requesterId = 'user-doctor';
      const dto = {
        email: 'reception@example.com',
        role: 'RECEPTIONIST' as const,
      };

      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'DOCTOR',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-new',
        email: dto.email,
      });
      mockPrisma.workspaceUser.findFirst.mockResolvedValueOnce(null);
      mockPrisma.workspaceUser.create.mockResolvedValue({
        userId: 'user-new',
        workspaceId,
        role: 'RECEPTIONIST',
      });

      const result = await service.invite(workspaceId, requesterId, dto);

      expect(result).toBeDefined();
    });

    it('should prevent DOCTOR from inviting OWNER', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'DOCTOR',
      });

      await expect(
        service.invite('ws-1', 'user-doctor', {
          email: 'owner@example.com',
          role: 'OWNER',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent inviting user that does not exist', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'OWNER',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.invite('ws-1', 'user-owner', {
          email: 'notfound@example.com',
          role: 'DOCTOR',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent inviting user already in workspace', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-exists',
        email: 'exists@example.com',
      });
      mockPrisma.workspaceUser.findFirst.mockResolvedValueOnce({
        userId: 'user-exists',
      }); // Ya existe

      await expect(
        service.invite('ws-1', 'user-owner', {
          email: 'exists@example.com',
          role: 'DOCTOR',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRole', () => {
    it('should allow OWNER to change any role', async () => {
      const workspaceId = 'ws-1';
      const requesterId = 'user-owner';
      const targetUserId = 'user-target';
      const dto = { role: 'DOCTOR' as const };

      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'RECEPTIONIST',
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(2); // 2 OWNERs
      mockPrisma.workspaceUser.update.mockResolvedValue({
        userId: targetUserId,
        workspaceId,
        role: 'DOCTOR',
      });

      const result = await service.updateRole(
        workspaceId,
        requesterId,
        targetUserId,
        dto
      );

      expect(result).toBeDefined();
    });

    it('should prevent non-OWNER from changing roles', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'DOCTOR',
      });

      await expect(
        service.updateRole('ws-1', 'user-doctor', 'user-target', {
          role: 'RECEPTIONIST',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent changing last OWNER role', async () => {
      const workspaceId = 'ws-1';
      const requesterId = 'user-owner';
      const targetUserId = 'user-owner'; // Mismo usuario

      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(1); // Solo 1 OWNER

      await expect(
        service.updateRole(workspaceId, requesterId, targetUserId, {
          role: 'DOCTOR',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should allow OWNER to remove any user', async () => {
      const workspaceId = 'ws-1';
      const requesterId = 'user-owner';
      const targetUserId = 'user-target';

      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'DOCTOR',
      });
      mockPrisma.workspaceUser.delete.mockResolvedValue({
        userId: targetUserId,
        workspaceId,
      });

      await service.remove(workspaceId, requesterId, targetUserId);

      expect(prisma.workspaceUser.delete).toHaveBeenCalled();
    });

    it('should allow DOCTOR to remove RECEPTIONIST', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'DOCTOR',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'RECEPTIONIST',
      });
      mockPrisma.workspaceUser.delete.mockResolvedValue({});

      await service.remove('ws-1', 'user-doctor', 'user-receptionist');

      expect(prisma.workspaceUser.delete).toHaveBeenCalled();
    });

    it('should allow self-removal', async () => {
      const userId = 'user-self';
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'DOCTOR',
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(2); // Otros OWNERs
      mockPrisma.workspaceUser.delete.mockResolvedValue({});

      await service.remove('ws-1', userId, userId);

      expect(prisma.workspaceUser.delete).toHaveBeenCalled();
    });

    it('should prevent removing last OWNER', async () => {
      const userId = 'user-owner';
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(1); // Solo 1 OWNER

      await expect(service.remove('ws-1', userId, userId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should prevent DOCTOR from removing OWNER', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'DOCTOR',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });

      await expect(
        service.remove('ws-1', 'user-doctor', 'user-owner')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent RECEPTIONIST from removing anyone', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'RECEPTIONIST',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'DOCTOR',
      });

      await expect(
        service.remove('ws-1', 'user-receptionist', 'user-doctor')
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
