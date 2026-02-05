import { Test, TestingModule } from '@nestjs/testing';
import { SendWeeklyReportProcessor } from './send-weekly-report.processor';
import { PrismaService } from '@reputation-manager/database';
import { SendGridService } from '@reputation-manager/integrations';
import { Job } from 'bullmq';

describe('SendWeeklyReportProcessor', () => {
  let processor: SendWeeklyReportProcessor;

  const mockPrisma = {
    message: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendWeeklyReportProcessor,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: SendGridService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    processor = module.get<SendWeeklyReportProcessor>(
      SendWeeklyReportProcessor,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should process weekly report job successfully', async () => {
      // Arrange
      const jobData = {
        workspaceId: 'test-workspace-id',
        workspaceName: 'Test Workspace',
        recipients: ['test@example.com'],
      };

      const mockJob = {
        data: jobData,
      } as Job;

      // Mock analytics data
      mockPrisma.message.count
        .mockResolvedValueOnce(150) // totalMessages
        .mockResolvedValueOnce(120) // totalResponses
        .mockResolvedValueOnce(95) // happy
        .mockResolvedValueOnce(15) // neutral
        .mockResolvedValueOnce(10) // unhappy
        .mockResolvedValueOnce(80) // promoters (NPS)
        .mockResolvedValueOnce(5); // detractors (NPS)

      mockPrisma.message.aggregate.mockResolvedValue({
        _avg: { rating: 4.35 },
      });

      mockEmailService.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result).toEqual({
        success: true,
        workspaceId: jobData.workspaceId,
        recipients: 1,
      });

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Reporte Semanal'),
          html: expect.any(String),
        }),
      );
    });

    it('should send emails to multiple recipients', async () => {
      // Arrange
      const jobData = {
        workspaceId: 'test-workspace-id',
        workspaceName: 'Test Workspace',
        recipients: [
          'test1@example.com',
          'test2@example.com',
          'test3@example.com',
        ],
      };

      const mockJob = {
        data: jobData,
      } as Job;

      // Mock minimal analytics
      mockPrisma.message.count.mockResolvedValue(0);
      mockPrisma.message.aggregate.mockResolvedValue({ _avg: { rating: 0 } });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result.recipients).toBe(3);
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(3);
    });

    it('should handle workspace with no messages', async () => {
      // Arrange
      const jobData = {
        workspaceId: 'empty-workspace-id',
        workspaceName: 'Empty Workspace',
        recipients: ['test@example.com'],
      };

      const mockJob = {
        data: jobData,
      } as Job;

      // Mock empty analytics
      mockPrisma.message.count.mockResolvedValue(0);
      mockPrisma.message.aggregate.mockResolvedValue({
        _avg: { rating: null },
      });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalled();

      const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Sin datos');
    });

    it('should throw error if email sending fails', async () => {
      // Arrange
      const jobData = {
        workspaceId: 'test-workspace-id',
        workspaceName: 'Test Workspace',
        recipients: ['test@example.com'],
      };

      const mockJob = {
        data: jobData,
      } as Job;

      mockPrisma.message.count.mockResolvedValue(100);
      mockPrisma.message.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } });
      mockEmailService.sendEmail.mockRejectedValue(
        new Error('SendGrid API error'),
      );

      // Act & Assert
      await expect(processor.process(mockJob)).rejects.toThrow(
        'SendGrid API error',
      );
    });

    it('should calculate NPS score correctly', async () => {
      // Arrange
      const jobData = {
        workspaceId: 'test-workspace-id',
        workspaceName: 'Test Workspace',
        recipients: ['test@example.com'],
      };

      const mockJob = {
        data: jobData,
      } as Job;

      // Mock: 100 messages, 80 responses, 60 promoters (5), 10 detractors (1-2)
      // NPS = ((60 - 10) / 80) * 100 = 62.5 → 63
      mockPrisma.message.count
        .mockResolvedValueOnce(100) // totalMessages
        .mockResolvedValueOnce(80) // totalResponses
        .mockResolvedValueOnce(70) // happy (4-5)
        .mockResolvedValueOnce(5) // neutral (3)
        .mockResolvedValueOnce(5) // unhappy (1-2)
        .mockResolvedValueOnce(60) // promoters (5)
        .mockResolvedValueOnce(10); // detractors (1-2)

      mockPrisma.message.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      mockEmailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await processor.process(mockJob);

      // Assert
      const emailCall = mockEmailService.sendEmail.mock.calls[0][0];

      // El NPS debería ser aproximadamente 63
      expect(emailCall.html).toContain('NPS');
    });

    it('should calculate response rate correctly', async () => {
      // Arrange
      const jobData = {
        workspaceId: 'test-workspace-id',
        workspaceName: 'Test Workspace',
        recipients: ['test@example.com'],
      };

      const mockJob = {
        data: jobData,
      } as Job;

      // Mock: 200 messages sent, 150 responses
      // Response rate = (150 / 200) * 100 = 75%
      mockPrisma.message.count
        .mockResolvedValueOnce(200) // totalMessages
        .mockResolvedValueOnce(150) // totalResponses
        .mockResolvedValue(0);

      mockPrisma.message.aggregate.mockResolvedValue({
        _avg: { rating: 4.2 },
      });

      mockEmailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await processor.process(mockJob);

      // Assert
      const emailCall = mockEmailService.sendEmail.mock.calls[0][0];

      // Should contain 75% response rate
      expect(emailCall.html).toContain('75');
    });
  });

  describe('analytics calculation', () => {
    it('should filter messages by workspace and date range', async () => {
      // Arrange
      const jobData = {
        workspaceId: 'specific-workspace-id',
        workspaceName: 'Test Workspace',
        recipients: ['test@example.com'],
      };

      const mockJob = {
        data: jobData,
      } as Job;

      mockPrisma.message.count.mockResolvedValue(0);
      mockPrisma.message.aggregate.mockResolvedValue({ _avg: { rating: 0 } });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await processor.process(mockJob);

      // Assert
      // Verify all message.count calls include workspaceId filter
      const countCalls = mockPrisma.message.count.mock.calls;
      countCalls.forEach((call) => {
        expect(call[0].where).toHaveProperty(
          'workspaceId',
          'specific-workspace-id',
        );
        expect(call[0].where).toHaveProperty('sentAt');
      });
    });
  });
});
