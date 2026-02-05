import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyReportsService } from './weekly-reports.service';
import { PrismaService } from '@reputation-manager/database';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { ReportDay } from './dto';

describe('WeeklyReportsService', () => {
  let service: WeeklyReportsService;

  const mockPrisma = {
    weeklyReportConfig: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyReportsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: getQueueToken('weekly-reports'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WeeklyReportsService>(WeeklyReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return existing config', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const expectedConfig = {
        id: 'config-1',
        workspaceId,
        enabled: true,
        dayOfWeek: 'MONDAY',
        recipients: ['user@example.com'],
        lastSentAt: new Date('2026-02-03'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.weeklyReportConfig.findUnique.mockResolvedValue(
        expectedConfig,
      );

      // Act
      const result = await service.getConfig(workspaceId);

      // Assert
      expect(result).toEqual(expectedConfig);
      expect(mockPrisma.weeklyReportConfig.findUnique).toHaveBeenCalledWith({
        where: { workspaceId },
      });
    });

    it('should create config with defaults if not exists', async () => {
      // Arrange
      const workspaceId = 'new-workspace-id';
      const newConfig = {
        id: 'new-config-1',
        workspaceId,
        enabled: false,
        dayOfWeek: 'MONDAY',
        recipients: [],
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.weeklyReportConfig.findUnique.mockResolvedValue(null);
      mockPrisma.weeklyReportConfig.create.mockResolvedValue(newConfig);

      // Act
      const result = await service.getConfig(workspaceId);

      // Assert
      expect(result).toEqual(newConfig);
      expect(mockPrisma.weeklyReportConfig.create).toHaveBeenCalledWith({
        data: {
          workspaceId,
          enabled: false,
          dayOfWeek: 'MONDAY',
          recipients: [],
        },
      });
    });
  });

  describe('updateConfig', () => {
    it('should update existing config', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const updateDto = {
        enabled: true,
        dayOfWeek: ReportDay.FRIDAY,
        recipients: ['new@example.com', 'another@example.com'],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'Test Workspace',
      });

      const updatedConfig = {
        id: 'config-1',
        workspaceId,
        ...updateDto,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.weeklyReportConfig.upsert.mockResolvedValue(updatedConfig);

      // Act
      const result = await service.updateConfig(workspaceId, updateDto);

      // Assert
      expect(result).toEqual({
        message: 'Configuración de reportes semanales actualizada',
        config: updatedConfig,
      });

      expect(mockPrisma.weeklyReportConfig.upsert).toHaveBeenCalledWith({
        where: { workspaceId },
        create: {
          workspaceId,
          enabled: updateDto.enabled,
          dayOfWeek: updateDto.dayOfWeek,
          recipients: updateDto.recipients,
        },
        update: {
          enabled: updateDto.enabled,
          dayOfWeek: updateDto.dayOfWeek,
          recipients: updateDto.recipients,
        },
      });
    });

    it('should create config if not exists', async () => {
      // Arrange
      const workspaceId = 'new-workspace-id';
      const updateDto = {
        enabled: true,
        dayOfWeek: ReportDay.TUESDAY,
        recipients: ['user@example.com'],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'New Workspace',
      });

      const newConfig = {
        id: 'new-config-1',
        workspaceId,
        ...updateDto,
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.weeklyReportConfig.upsert.mockResolvedValue(newConfig);

      // Act
      const result = await service.updateConfig(workspaceId, updateDto);

      // Assert
      expect(result.config).toEqual(newConfig);
      expect(mockPrisma.weeklyReportConfig.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException if workspace does not exist', async () => {
      // Arrange
      const workspaceId = 'non-existent-workspace';
      const updateDto = {
        enabled: true,
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateConfig(workspaceId, updateDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.weeklyReportConfig.upsert).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const partialUpdate = {
        enabled: false, // Only updating enabled
      };

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'Test Workspace',
      });

      mockPrisma.weeklyReportConfig.upsert.mockResolvedValue({
        id: 'config-1',
        workspaceId,
        enabled: false,
        dayOfWeek: 'MONDAY',
        recipients: ['existing@example.com'],
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await service.updateConfig(workspaceId, partialUpdate);

      // Assert
      expect(mockPrisma.weeklyReportConfig.upsert).toHaveBeenCalledWith({
        where: { workspaceId },
        create: expect.objectContaining({
          enabled: false,
        }),
        update: {
          enabled: false,
          dayOfWeek: undefined,
          recipients: undefined,
        },
      });
    });
  });

  describe('sendTestReport', () => {
    it('should enqueue test report job', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const workspaceName = 'Test Workspace';
      const testEmail = 'test@example.com';

      mockQueue.add.mockResolvedValue({ id: 'test-job-1' });

      // Act
      const result = await service.sendTestReport(
        workspaceId,
        workspaceName,
        testEmail,
      );

      // Assert
      expect(result).toEqual({
        message: `Reporte de prueba encolado. Se enviará a: ${testEmail}`,
        testEmail,
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-weekly-report',
        {
          workspaceId,
          workspaceName,
          recipients: [testEmail],
        },
        {
          priority: 1,
          attempts: 2,
        },
      );
    });

    it('should throw error if queue fails', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const workspaceName = 'Test Workspace';
      const testEmail = 'test@example.com';

      mockQueue.add.mockRejectedValue(new Error('Queue connection error'));

      // Act & Assert
      await expect(
        service.sendTestReport(workspaceId, workspaceName, testEmail),
      ).rejects.toThrow('Queue connection error');
    });

    it('should use high priority for test reports', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const workspaceName = 'Test Workspace';
      const testEmail = 'urgent@example.com';

      mockQueue.add.mockResolvedValue({ id: 'urgent-job' });

      // Act
      await service.sendTestReport(workspaceId, workspaceName, testEmail);

      // Assert
      const addCall = mockQueue.add.mock.calls[0];
      expect(addCall[2]).toHaveProperty('priority', 1); // High priority
    });

    it('should have fewer retry attempts for test reports', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const workspaceName = 'Test Workspace';
      const testEmail = 'test@example.com';

      mockQueue.add.mockResolvedValue({ id: 'test-job' });

      // Act
      await service.sendTestReport(workspaceId, workspaceName, testEmail);

      // Assert
      const addCall = mockQueue.add.mock.calls[0];
      expect(addCall[2]).toHaveProperty('attempts', 2); // Only 2 attempts for tests
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: get -> update -> test', async () => {
      // Arrange
      const workspaceId = 'workflow-workspace';

      // Step 1: Get config (creates default)
      mockPrisma.weeklyReportConfig.findUnique.mockResolvedValue(null);
      mockPrisma.weeklyReportConfig.create.mockResolvedValue({
        id: 'config-1',
        workspaceId,
        enabled: false,
        dayOfWeek: 'MONDAY',
        recipients: [],
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const config1 = await service.getConfig(workspaceId);
      expect(config1.enabled).toBe(false);

      // Step 2: Update config
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'Workflow Workspace',
      });

      mockPrisma.weeklyReportConfig.upsert.mockResolvedValue({
        id: 'config-1',
        workspaceId,
        enabled: true,
        dayOfWeek: 'FRIDAY',
        recipients: ['user@example.com'],
        lastSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updateResult = await service.updateConfig(workspaceId, {
        enabled: true,
        dayOfWeek: ReportDay.FRIDAY,
        recipients: ['user@example.com'],
      });

      expect(updateResult.config.enabled).toBe(true);

      // Step 3: Send test
      mockQueue.add.mockResolvedValue({ id: 'workflow-test-job' });

      const testResult = await service.sendTestReport(
        workspaceId,
        'Workflow Workspace',
        'test@example.com',
      );

      expect(testResult.testEmail).toBe('test@example.com');
      expect(mockQueue.add).toHaveBeenCalled();
    });
  });
});
