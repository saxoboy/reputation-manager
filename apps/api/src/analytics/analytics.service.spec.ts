import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '@reputation-manager/database';
import { MessageStatus } from '@prisma/client';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockPrisma = {
    message: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    campaign: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    practice: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ═══════════════════════════════════════════════════════
  // getWorkspaceAnalytics
  // ═══════════════════════════════════════════════════════

  describe('getWorkspaceAnalytics', () => {
    it('should return workspace analytics with correct overview', async () => {
      const workspaceId = 'ws-1';

      mockPrisma.message.count.mockResolvedValue(100);
      mockPrisma.message.findMany
        .mockResolvedValueOnce([
          // messages with response
          { rating: 5, sentAt: new Date('2026-01-15') },
          { rating: 4, sentAt: new Date('2026-01-16') },
          { rating: 3, sentAt: new Date('2026-01-17') },
          { rating: 1, sentAt: new Date('2026-01-18') },
        ])
        .mockResolvedValueOnce([]); // timeline messages

      mockPrisma.campaign.findMany.mockResolvedValue([]);

      const result = await service.getWorkspaceAnalytics(workspaceId);

      expect(result.overview.totalMessages).toBe(100);
      expect(result.overview.totalResponses).toBe(4);
      expect(result.overview.responseRate).toBe(4);
      expect(result.overview.averageRating).toBe(3.3);
    });

    it('should handle zero messages', async () => {
      mockPrisma.message.count.mockResolvedValue(0);
      mockPrisma.message.findMany.mockResolvedValue([]);
      mockPrisma.campaign.findMany.mockResolvedValue([]);

      const result = await service.getWorkspaceAnalytics('ws-1');

      expect(result.overview.totalMessages).toBe(0);
      expect(result.overview.totalResponses).toBe(0);
      expect(result.overview.responseRate).toBe(0);
      expect(result.overview.averageRating).toBe(0);
      expect(result.overview.npsScore).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════
  // getCampaignAnalytics
  // ═══════════════════════════════════════════════════════

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics', async () => {
      const workspaceId = 'ws-1';
      const campaignId = 'camp-1';

      mockPrisma.campaign.findUnique.mockResolvedValue({
        id: campaignId,
        name: 'Campaña Enero',
        workspaceId,
        patients: [
          {
            id: 'p1',
            name: 'Juan',
            messages: [
              {
                type: 'INITIAL',
                status: MessageStatus.SENT,
                rating: 5,
                sentAt: new Date(),
                repliedAt: new Date(),
              },
            ],
          },
          {
            id: 'p2',
            name: 'María',
            messages: [
              {
                type: 'INITIAL',
                status: MessageStatus.SENT,
                rating: 4,
                sentAt: new Date(),
                repliedAt: new Date(),
              },
            ],
          },
          {
            id: 'p3',
            name: 'Pedro',
            messages: [
              {
                type: 'INITIAL',
                status: MessageStatus.SENT,
                rating: null,
                sentAt: new Date(),
                repliedAt: null,
              },
            ],
          },
        ],
      });

      const result = await service.getCampaignAnalytics(
        workspaceId,
        campaignId,
      );

      expect(result.campaignId).toBe(campaignId);
      expect(result.campaignName).toBe('Campaña Enero');
      expect(result.totalPatients).toBe(3);
      expect(result.messagesSent).toBe(3);
      expect(result.totalResponses).toBe(2);
      expect(result.responseRate).toBe(66.7);
      expect(result.averageRating).toBe(4.5);
    });

    it('should throw when campaign not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        service.getCampaignAnalytics('ws-1', 'nonexistent'),
      ).rejects.toThrow('Campaign not found');
    });
  });

  // ═══════════════════════════════════════════════════════
  // getPracticeAnalytics
  // ═══════════════════════════════════════════════════════

  describe('getPracticeAnalytics', () => {
    it('should return practice analytics', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue({
        id: 'pr-1',
        name: 'Consultorio Norte',
        workspaceId: 'ws-1',
      });

      mockPrisma.campaign.findMany.mockResolvedValue([
        {
          id: 'camp-1',
          patients: [
            {
              messages: [
                { type: 'INITIAL', status: MessageStatus.SENT, rating: 5 },
              ],
            },
            {
              messages: [
                { type: 'INITIAL', status: MessageStatus.SENT, rating: 3 },
              ],
            },
          ],
        },
      ]);

      // Timeline messages
      mockPrisma.message.findMany.mockResolvedValue([]);

      const result = await service.getPracticeAnalytics('ws-1', 'pr-1');

      expect(result.practiceId).toBe('pr-1');
      expect(result.practiceName).toBe('Consultorio Norte');
      expect(result.totalCampaigns).toBe(1);
      expect(result.messagesSent).toBe(2);
      expect(result.totalResponses).toBe(2);
    });

    it('should throw when practice not found', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue(null);

      await expect(
        service.getPracticeAnalytics('ws-1', 'nonexistent'),
      ).rejects.toThrow('Practice not found');
    });
  });

  // ═══════════════════════════════════════════════════════
  // comparePractices
  // ═══════════════════════════════════════════════════════

  describe('comparePractices', () => {
    it('should compare multiple practices', async () => {
      // Practice 1
      mockPrisma.practice.findUnique
        .mockResolvedValueOnce({
          id: 'pr-1',
          name: 'Norte',
          workspaceId: 'ws-1',
        })
        .mockResolvedValueOnce({
          id: 'pr-2',
          name: 'Sur',
          workspaceId: 'ws-1',
        });

      mockPrisma.campaign.findMany
        .mockResolvedValueOnce([
          {
            patients: [
              {
                messages: [
                  { type: 'INITIAL', status: MessageStatus.SENT, rating: 5 },
                ],
              },
            ],
          },
        ])
        .mockResolvedValueOnce([
          {
            patients: [
              {
                messages: [
                  { type: 'INITIAL', status: MessageStatus.SENT, rating: 3 },
                ],
              },
            ],
          },
        ]);

      // Timeline mocks (2 calls, one per practice)
      mockPrisma.message.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.comparePractices('ws-1', ['pr-1', 'pr-2']);

      expect(result.type).toBe('practices');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Norte');
      expect(result.items[1].name).toBe('Sur');
    });

    it('should skip practices that are not found', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue(null);

      const result = await service.comparePractices('ws-1', [
        'pr-missing-1',
        'pr-missing-2',
      ]);

      expect(result.type).toBe('practices');
      expect(result.items).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════
  // compareCampaigns
  // ═══════════════════════════════════════════════════════

  describe('compareCampaigns', () => {
    it('should compare multiple campaigns', async () => {
      mockPrisma.campaign.findUnique
        .mockResolvedValueOnce({
          id: 'c-1',
          name: 'Enero',
          workspaceId: 'ws-1',
          patients: [
            {
              id: 'p1',
              name: 'Juan',
              messages: [
                {
                  type: 'INITIAL',
                  status: MessageStatus.SENT,
                  rating: 5,
                  sentAt: new Date(),
                  repliedAt: new Date(),
                },
              ],
            },
          ],
        })
        .mockResolvedValueOnce({
          id: 'c-2',
          name: 'Febrero',
          workspaceId: 'ws-1',
          patients: [
            {
              id: 'p2',
              name: 'María',
              messages: [
                {
                  type: 'INITIAL',
                  status: MessageStatus.SENT,
                  rating: 2,
                  sentAt: new Date(),
                  repliedAt: new Date(),
                },
              ],
            },
          ],
        });

      const result = await service.compareCampaigns('ws-1', ['c-1', 'c-2']);

      expect(result.type).toBe('campaigns');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].averageRating).toBe(5);
      expect(result.items[1].averageRating).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════
  // comparePeriods
  // ═══════════════════════════════════════════════════════

  describe('comparePeriods', () => {
    it('should compare two time periods', async () => {
      // Period 1 mocks
      mockPrisma.message.count.mockResolvedValueOnce(50);
      mockPrisma.message.findMany
        .mockResolvedValueOnce([
          { rating: 5, sentAt: new Date('2026-01-10') },
          { rating: 4, sentAt: new Date('2026-01-11') },
        ])
        .mockResolvedValueOnce([]) // timeline
        .mockResolvedValueOnce([]); // top campaigns messages

      mockPrisma.campaign.findMany.mockResolvedValueOnce([]);

      // Period 2 mocks
      mockPrisma.message.count.mockResolvedValueOnce(30);
      mockPrisma.message.findMany
        .mockResolvedValueOnce([{ rating: 3, sentAt: new Date('2026-02-10') }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockPrisma.campaign.findMany.mockResolvedValueOnce([]);

      const result = await service.comparePeriods(
        'ws-1',
        new Date('2026-01-01'),
        new Date('2026-01-31'),
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      expect(result.type).toBe('periods');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('period1');
      expect(result.items[1].id).toBe('period2');
    });
  });

  // ═══════════════════════════════════════════════════════
  // getCohortAnalysis
  // ═══════════════════════════════════════════════════════

  describe('getCohortAnalysis', () => {
    it('should return cohort analysis for specified months', async () => {
      // Mock 3 months of data — each month calls message.findMany once
      mockPrisma.message.findMany
        .mockResolvedValueOnce([{ rating: 5 }, { rating: 4 }, { rating: 3 }])
        .mockResolvedValueOnce([{ rating: 5 }, { rating: 5 }])
        .mockResolvedValueOnce([{ rating: 2 }]);

      const result = await service.getCohortAnalysis('ws-1', 3);

      expect(result.cohorts).toHaveLength(3);
      expect(result.trends).toBeDefined();
      expect(result.trends.responseRateTrend).toBeDefined();
      expect(result.trends.ratingTrend).toBeDefined();
      expect(result.trends.npsTrend).toBeDefined();
    });

    it('should handle empty data', async () => {
      mockPrisma.message.findMany.mockResolvedValue([]);

      const result = await service.getCohortAnalysis('ws-1', 3);

      expect(result.cohorts).toHaveLength(3);
      result.cohorts.forEach((cohort) => {
        expect(cohort.totalMessages).toBe(0);
        expect(cohort.totalResponses).toBe(0);
        expect(cohort.responseRate).toBe(0);
      });

      // With no data, trends should be stable
      expect(result.trends.responseRateTrend).toBe('stable');
    });

    it('should calculate correct NPS and sentiment per cohort', async () => {
      // 1 month with mixed ratings
      mockPrisma.message.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 1 },
      ]);

      const result = await service.getCohortAnalysis('ws-1', 1);

      expect(result.cohorts).toHaveLength(1);
      const cohort = result.cohorts[0];
      expect(cohort.totalMessages).toBe(4);
      expect(cohort.totalResponses).toBe(4);
      expect(cohort.happyPercent).toBe(75); // 3 out of 4 are >=4
      expect(cohort.unhappyPercent).toBe(25); // 1 out of 4 is <=2
      // NPS: 75% promoters (5 stars) - 25% detractors (1 star) = 50
      expect(cohort.npsScore).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════
  // getResponseRateTrends
  // ═══════════════════════════════════════════════════════

  describe('getResponseRateTrends', () => {
    it('should return monthly trend data', async () => {
      mockPrisma.message.findMany
        .mockResolvedValueOnce([{ rating: 5 }, { rating: 4 }])
        .mockResolvedValueOnce([{ rating: 3 }]);

      const result = await service.getResponseRateTrends('ws-1', 2);

      expect(result).toHaveLength(2);
      result.forEach((item) => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('responseRate');
        expect(item).toHaveProperty('averageRating');
        expect(item).toHaveProperty('npsScore');
        expect(item).toHaveProperty('volume');
      });
    });
  });
});
