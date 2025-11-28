import { Test, TestingModule } from '@nestjs/testing';
import { PracticesService } from './practices.service';
import { PrismaService } from '@reputation-manager/database';

describe('PracticesService', () => {
  let service: PracticesService;
  let prisma: PrismaService;

  const mockPrisma = {
    practice: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PracticesService>(PracticesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all practices for a workspace', async () => {
      const workspaceId = 'ws-1';
      const mockPractices = [
        {
          id: 'practice-1',
          workspaceId,
          name: 'Consultorio Norte',
          address: 'Av. Principal 123',
          phone: '+593987654321',
          googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.practice.findMany.mockResolvedValue(mockPractices);

      const result = await service.findAll(workspaceId);

      expect(result).toEqual(mockPractices);
      expect(prisma.practice.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create a practice in the workspace', async () => {
      const workspaceId = 'ws-1';
      const dto = {
        name: 'Consultorio Centro',
        address: 'Calle 10 de Agosto',
        phone: '+593987654321',
        googlePlaceId: 'ChIJtest123',
      };
      const mockPractice = {
        id: 'practice-new',
        workspaceId,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.practice.create.mockResolvedValue(mockPractice);

      const result = await service.create(workspaceId, dto);

      expect(result).toEqual(mockPractice);
      expect(prisma.practice.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          workspaceId,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return practice if belongs to workspace', async () => {
      const practiceId = 'practice-1';
      const workspaceId = 'ws-1';
      const mockPractice = {
        id: practiceId,
        workspaceId,
        name: 'Consultorio Sur',
        address: 'Av. Amazonas',
        phone: '+593987654321',
        googlePlaceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.practice.findUnique.mockResolvedValue(mockPractice);

      const result = await service.findOne(practiceId, workspaceId);

      expect(result).toEqual(mockPractice);
      expect(prisma.practice.findUnique).toHaveBeenCalledWith({
        where: { id: practiceId },
      });
    });

    it('should throw error if practice not found', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue(null);

      await expect(service.findOne('practice-999', 'ws-1')).rejects.toThrow(
        'Práctica no encontrada'
      );
    });
  });

  describe('update', () => {
    it('should update practice if belongs to workspace', async () => {
      const practiceId = 'practice-1';
      const workspaceId = 'ws-1';
      const dto = { name: 'Nuevo Nombre', address: 'Nueva Dirección' };
      const mockUpdated = {
        id: practiceId,
        workspaceId,
        name: 'Nuevo Nombre',
        address: 'Nueva Dirección',
        phone: '+593987654321',
        googlePlaceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.practice.findUnique.mockResolvedValue({
        id: practiceId,
        workspaceId,
      });
      mockPrisma.practice.update.mockResolvedValue(mockUpdated);

      const result = await service.update(practiceId, workspaceId, dto);

      expect(result).toEqual(mockUpdated);
      expect(prisma.practice.update).toHaveBeenCalledWith({
        where: { id: practiceId },
        data: dto,
      });
    });

    it('should throw error if practice does not belong to workspace', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue(null);

      await expect(
        service.update('practice-1', 'ws-wrong', { name: 'Test' })
      ).rejects.toThrow('Práctica no encontrada');
    });
  });

  describe('remove', () => {
    it('should delete practice if belongs to workspace', async () => {
      const practiceId = 'practice-1';
      const workspaceId = 'ws-1';

      mockPrisma.practice.findUnique.mockResolvedValue({
        id: practiceId,
        workspaceId,
      });
      mockPrisma.practice.delete.mockResolvedValue({ id: practiceId });

      await service.remove(practiceId, workspaceId);

      expect(prisma.practice.delete).toHaveBeenCalledWith({
        where: { id: practiceId },
      });
    });

    it('should throw error if practice does not belong to workspace', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue(null);

      await expect(service.remove('practice-1', 'ws-wrong')).rejects.toThrow(
        'Práctica no encontrada'
      );
    });
  });
});
