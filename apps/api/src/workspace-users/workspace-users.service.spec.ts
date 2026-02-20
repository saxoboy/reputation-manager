import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceUsersService } from './workspace-users.service';
import { PrismaService } from '@reputation-manager/database';
import { EmailService } from '@reputation-manager/integrations';
import { ConfigService } from '@nestjs/config';
import { ConflictException, ForbiddenException } from '@nestjs/common';

describe('WorkspaceUsersService', () => {
  let service: WorkspaceUsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    workspace: {
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
    invitation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEmailService = {
    sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://localhost:4000'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceUsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
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
    it('should add user directly when they already have an account', async () => {
      const workspaceId = 'ws-1';
      const requesterId = 'user-owner';
      const dto = { email: 'newdoc@example.com', role: 'DOCTOR' as const };

      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
        user: { name: 'Owner', email: 'owner@example.com' },
      });
      mockPrisma.workspace.findUnique.mockResolvedValue({
        name: 'Test Workspace',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-new',
        email: dto.email,
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce(null); // no es miembro
      mockPrisma.workspaceUser.create.mockResolvedValue({
        id: 'wu-new',
        role: 'DOCTOR',
        createdAt: new Date(),
        user: {
          id: 'user-new',
          email: dto.email,
          name: 'New Doc',
          image: null,
        },
      });

      const result = await service.invite(workspaceId, requesterId, dto);

      expect(result).toBeDefined();
      expect(result.invited).toBe(false);
      expect(prisma.workspaceUser.create).toHaveBeenCalled();
    });

    it('should send invitation email when user does not have an account', async () => {
      const workspaceId = 'ws-1';
      const requesterId = 'user-owner';
      const dto = { email: 'nuevo@example.com', role: 'RECEPTIONIST' as const };

      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
        user: { name: 'Owner', email: 'owner@example.com' },
      });
      mockPrisma.workspace.findUnique.mockResolvedValue({
        name: 'Test Workspace',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null); // no tiene cuenta
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue({
        id: 'inv-1',
        token: 'abc123',
        email: dto.email,
        role: dto.role,
      });

      const result = await service.invite(workspaceId, requesterId, dto);

      expect(result.invited).toBe(true);
      expect(mockEmailService.sendInvitationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email }),
      );
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
        user: { name: 'Doctor', email: 'doctor@example.com' },
      });
      mockPrisma.workspace.findUnique.mockResolvedValue({ name: 'Clínica' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue({ id: 'inv-2' });

      const result = await service.invite(workspaceId, requesterId, dto);

      expect(result.invited).toBe(true);
    });

    it('should prevent DOCTOR from inviting OWNER', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValue({
        role: 'DOCTOR',
        user: { name: 'Doctor', email: 'doctor@example.com' },
      });

      await expect(
        service.invite('ws-1', 'user-doctor', {
          email: 'owner@example.com',
          role: 'OWNER',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent inviting user already in workspace', async () => {
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
        user: { name: 'Owner', email: 'owner@example.com' },
      });
      mockPrisma.workspace.findUnique.mockResolvedValue({ name: 'Clínica' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-exists',
        email: 'exists@example.com',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        userId: 'user-exists',
      }); // ya es miembro

      await expect(
        service.invite('ws-1', 'user-owner', {
          email: 'exists@example.com',
          role: 'DOCTOR',
        }),
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
        user: { id: targetUserId, email: 'target@example.com', name: 'Target' },
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(2);
      mockPrisma.workspaceUser.update.mockResolvedValue({
        id: 'wu-target',
        role: 'DOCTOR',
        user: { id: targetUserId, email: 'target@example.com', name: 'Target' },
      });

      const result = await service.updateRole(
        workspaceId,
        requesterId,
        targetUserId,
        dto,
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
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent changing last OWNER role', async () => {
      const workspaceId = 'ws-1';
      const requesterId = 'user-owner';
      const targetUserId = 'user-owner';

      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
        user: { id: targetUserId, email: 'owner@example.com', name: 'Owner' },
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(1);

      await expect(
        service.updateRole(workspaceId, requesterId, targetUserId, {
          role: 'DOCTOR',
        }),
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

      await service.remove(workspaceId, targetUserId, requesterId);

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

      await service.remove('ws-1', 'user-receptionist', 'user-doctor');

      expect(prisma.workspaceUser.delete).toHaveBeenCalled();
    });

    it('should allow self-removal', async () => {
      const userId = 'user-self';
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'DOCTOR',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'DOCTOR',
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(2);
      mockPrisma.workspaceUser.delete.mockResolvedValue({});

      await service.remove('ws-1', userId, userId);

      expect(prisma.workspaceUser.delete).toHaveBeenCalled();
    });

    it('should prevent removing last OWNER', async () => {
      const userId = 'user-owner';
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.findUnique.mockResolvedValueOnce({
        role: 'OWNER',
      });
      mockPrisma.workspaceUser.count.mockResolvedValue(1);

      await expect(service.remove('ws-1', userId, userId)).rejects.toThrow(
        ConflictException,
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
        service.remove('ws-1', 'user-owner', 'user-doctor'),
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
        service.remove('ws-1', 'user-doctor', 'user-receptionist'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
