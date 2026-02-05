import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyReportScheduler } from './weekly-report.scheduler';
import { PrismaService } from '@reputation-manager/database';
import { getQueueToken } from '@nestjs/bullmq';

describe('WeeklyReportScheduler', () => {
  let scheduler: WeeklyReportScheduler;

  const mockPrisma = {
    weeklyReportConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyReportScheduler,
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

    scheduler = module.get<WeeklyReportScheduler>(WeeklyReportScheduler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleWeeklyReports', () => {
    it('should schedule reports for enabled workspaces', async () => {
      // Arrange
      const mockConfigs = [
        {
          id: 'config-1',
          workspaceId: 'workspace-1',
          enabled: true,
          dayOfWeek: 'MONDAY',
          recipients: ['user1@example.com', 'user2@example.com'],
          workspace: {
            id: 'workspace-1',
            name: 'Workspace 1',
          },
        },
        {
          id: 'config-2',
          workspaceId: 'workspace-2',
          enabled: true,
          dayOfWeek: 'MONDAY',
          recipients: ['user3@example.com'],
          workspace: {
            id: 'workspace-2',
            name: 'Workspace 2',
          },
        },
      ];

      mockPrisma.weeklyReportConfig.findMany.mockResolvedValue(mockConfigs);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });
      mockPrisma.weeklyReportConfig.update.mockResolvedValue({});

      // Mock date to be Monday
      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Monday

      // Act
      await scheduler.scheduleWeeklyReports();

      // Assert
      expect(mockPrisma.weeklyReportConfig.findMany).toHaveBeenCalledWith({
        where: {
          enabled: true,
          dayOfWeek: 'MONDAY',
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      expect(mockQueue.add).toHaveBeenCalledTimes(2);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-weekly-report',
        {
          workspaceId: 'workspace-1',
          workspaceName: 'Workspace 1',
          recipients: ['user1@example.com', 'user2@example.com'],
        },
        expect.objectContaining({
          attempts: 3,
          backoff: expect.any(Object),
        }),
      );

      expect(mockPrisma.weeklyReportConfig.update).toHaveBeenCalledTimes(2);
    });

    it('should skip workspaces with no recipients', async () => {
      // Arrange
      const mockConfigs = [
        {
          id: 'config-1',
          workspaceId: 'workspace-1',
          enabled: true,
          dayOfWeek: 'MONDAY',
          recipients: [], // Empty recipients
          workspace: {
            id: 'workspace-1',
            name: 'Workspace 1',
          },
        },
        {
          id: 'config-2',
          workspaceId: 'workspace-2',
          enabled: true,
          dayOfWeek: 'MONDAY',
          recipients: ['user@example.com'],
          workspace: {
            id: 'workspace-2',
            name: 'Workspace 2',
          },
        },
      ];

      mockPrisma.weeklyReportConfig.findMany.mockResolvedValue(mockConfigs);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });
      mockPrisma.weeklyReportConfig.update.mockResolvedValue({});

      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Monday

      // Act
      await scheduler.scheduleWeeklyReports();

      // Assert
      expect(mockQueue.add).toHaveBeenCalledTimes(1); // Only workspace-2
      expect(mockPrisma.weeklyReportConfig.update).toHaveBeenCalledTimes(1);
    });

    it('should handle different days of the week', async () => {
      // Arrange - Test for Friday
      const mockConfigs = [
        {
          id: 'config-1',
          workspaceId: 'workspace-1',
          enabled: true,
          dayOfWeek: 'FRIDAY',
          recipients: ['user@example.com'],
          workspace: {
            id: 'workspace-1',
            name: 'Workspace 1',
          },
        },
      ];

      mockPrisma.weeklyReportConfig.findMany.mockResolvedValue(mockConfigs);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });
      mockPrisma.weeklyReportConfig.update.mockResolvedValue({});

      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(5); // Friday

      // Act
      await scheduler.scheduleWeeklyReports();

      // Assert
      expect(mockPrisma.weeklyReportConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dayOfWeek: 'FRIDAY',
          }),
        }),
      );

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });

    it('should not schedule anything if no enabled configs for current day', async () => {
      // Arrange
      mockPrisma.weeklyReportConfig.findMany.mockResolvedValue([]);

      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1); // Monday

      // Act
      await scheduler.scheduleWeeklyReports();

      // Assert
      expect(mockQueue.add).not.toHaveBeenCalled();
      expect(mockPrisma.weeklyReportConfig.update).not.toHaveBeenCalled();
    });

    it('should stop scheduling if one job fails', async () => {
      // Arrange
      const mockConfigs = [
        {
          id: 'config-1',
          workspaceId: 'workspace-1',
          enabled: true,
          dayOfWeek: 'MONDAY',
          recipients: ['user1@example.com'],
          workspace: {
            id: 'workspace-1',
            name: 'Workspace 1',
          },
        },
        {
          id: 'config-2',
          workspaceId: 'workspace-2',
          enabled: true,
          dayOfWeek: 'MONDAY',
          recipients: ['user2@example.com'],
          workspace: {
            id: 'workspace-2',
            name: 'Workspace 2',
          },
        },
      ];

      mockPrisma.weeklyReportConfig.findMany.mockResolvedValue(mockConfigs);

      // First job fails
      mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));

      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1);

      // Act
      await scheduler.scheduleWeeklyReports();

      // Assert - Only first workspace should be attempted
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });

    it('should update lastSentAt after scheduling', async () => {
      // Arrange
      const mockConfigs = [
        {
          id: 'config-1',
          workspaceId: 'workspace-1',
          enabled: true,
          dayOfWeek: 'MONDAY',
          recipients: ['user@example.com'],
          workspace: {
            id: 'workspace-1',
            name: 'Workspace 1',
          },
        },
      ];

      mockPrisma.weeklyReportConfig.findMany.mockResolvedValue(mockConfigs);
      mockQueue.add.mockResolvedValue({ id: 'job-1' });
      mockPrisma.weeklyReportConfig.update.mockResolvedValue({});

      jest.spyOn(Date.prototype, 'getDay').mockReturnValue(1);

      // Act
      await scheduler.scheduleWeeklyReports();

      // Assert
      expect(mockPrisma.weeklyReportConfig.update).toHaveBeenCalledWith({
        where: { id: 'config-1' },
        data: { lastSentAt: expect.any(Date) },
      });
    });
  });

  describe('triggerManualReport', () => {
    it('should trigger manual report for workspace', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const mockConfig = {
        workspaceId,
        enabled: true,
        recipients: ['user@example.com'],
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
        },
      };

      mockPrisma.weeklyReportConfig.findUnique.mockResolvedValue(mockConfig);
      mockQueue.add.mockResolvedValue({ id: 'manual-job-1' });

      // Act
      await scheduler.triggerManualReport(workspaceId);

      // Assert
      expect(mockPrisma.weeklyReportConfig.findUnique).toHaveBeenCalledWith({
        where: { workspaceId },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-weekly-report',
        {
          workspaceId,
          workspaceName: 'Test Workspace',
          recipients: ['user@example.com'],
        },
        expect.any(Object),
      );
    });

    it('should throw error if config not found', async () => {
      // Arrange
      const workspaceId = 'non-existent-workspace';
      mockPrisma.weeklyReportConfig.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(scheduler.triggerManualReport(workspaceId)).rejects.toThrow(
        'Configuración de reportes no encontrada',
      );
    });

    it('should throw error if reports not enabled', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const mockConfig = {
        workspaceId,
        enabled: false,
        recipients: ['user@example.com'],
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
        },
      };

      mockPrisma.weeklyReportConfig.findUnique.mockResolvedValue(mockConfig);

      // Act & Assert
      await expect(scheduler.triggerManualReport(workspaceId)).rejects.toThrow(
        'Reportes semanales no están habilitados',
      );
    });

    it('should throw error if no recipients configured', async () => {
      // Arrange
      const workspaceId = 'test-workspace-id';
      const mockConfig = {
        workspaceId,
        enabled: true,
        recipients: [],
        workspace: {
          id: workspaceId,
          name: 'Test Workspace',
        },
      };

      mockPrisma.weeklyReportConfig.findUnique.mockResolvedValue(mockConfig);

      // Act & Assert
      await expect(scheduler.triggerManualReport(workspaceId)).rejects.toThrow(
        'No hay destinatarios configurados',
      );
    });
  });

  describe('getDayOfWeekString', () => {
    it('should map day numbers correctly', () => {
      // Test mapping by checking what the scheduler queries for
      const dates = [
        { day: 0, expected: 'SUNDAY' },
        { day: 1, expected: 'MONDAY' },
        { day: 2, expected: 'TUESDAY' },
        { day: 3, expected: 'WEDNESDAY' },
        { day: 4, expected: 'THURSDAY' },
        { day: 5, expected: 'FRIDAY' },
        { day: 6, expected: 'SATURDAY' },
      ];

      dates.forEach(({ day, expected }) => {
        jest.spyOn(Date.prototype, 'getDay').mockReturnValue(day);
        mockPrisma.weeklyReportConfig.findMany.mockResolvedValue([]);

        scheduler.scheduleWeeklyReports();

        expect(mockPrisma.weeklyReportConfig.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              dayOfWeek: expected,
            }),
          }),
        );
      });
    });
  });
});
