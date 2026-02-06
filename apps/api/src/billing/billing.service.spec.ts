import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaService } from '@reputation-manager/database';
import { StripeService } from '@reputation-manager/integrations';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: jest.Mocked<PrismaService>;
  let stripe: jest.Mocked<StripeService>;

  const mockWorkspaceId = 'workspace-123';

  const mockPrisma = {
    workspace: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockStripe = {
    createCustomer: jest.fn(),
    createCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
    resumeSubscription: jest.fn(),
    createBillingPortalSession: jest.fn(),
    stripe: {
      paymentMethods: {
        list: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StripeService, useValue: mockStripe },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get(PrismaService);
    stripe = module.get(StripeService);
  });

  describe('getAvailablePlans', () => {
    it('should return all 4 plans with correct structure', () => {
      const plans = service.getAvailablePlans();

      expect(plans).toHaveLength(4);
      expect(plans.map((p) => p.plan)).toEqual([
        'FREE',
        'STARTER',
        'PROFESSIONAL',
        'ENTERPRISE',
      ]);
    });

    it('should return correct prices for each plan', () => {
      const plans = service.getAvailablePlans();
      const free = plans.find((p) => p.plan === 'FREE');
      const starter = plans.find((p) => p.plan === 'STARTER');
      const professional = plans.find((p) => p.plan === 'PROFESSIONAL');

      expect(free.price).toBe(0);
      expect(starter.price).toBe(3900);
      expect(professional.price).toBe(12900);
    });

    it('should include credits for each plan', () => {
      const plans = service.getAvailablePlans();
      const free = plans.find((p) => p.plan === 'FREE');
      const starter = plans.find((p) => p.plan === 'STARTER');
      const professional = plans.find((p) => p.plan === 'PROFESSIONAL');
      const enterprise = plans.find((p) => p.plan === 'ENTERPRISE');

      expect(free.credits).toBe(50);
      expect(starter.credits).toBe(500);
      expect(professional.credits).toBe(2000);
      expect(enterprise.credits).toBe(-1); // Unlimited
    });

    it('should include maxUsers and maxPractices', () => {
      const plans = service.getAvailablePlans();
      const free = plans.find((p) => p.plan === 'FREE');

      expect(free.maxUsers).toBe(1);
      expect(free.maxPractices).toBe(1);
    });
  });

  describe('getAvailableCreditPackages', () => {
    it('should return all 4 credit packages', () => {
      const packages = service.getAvailableCreditPackages();
      expect(packages).toHaveLength(4);
    });

    it('should have correct structure for each package', () => {
      const packages = service.getAvailableCreditPackages();
      packages.forEach((pkg) => {
        expect(pkg).toHaveProperty('name');
        expect(pkg).toHaveProperty('credits');
        expect(pkg).toHaveProperty('price');
        expect(pkg).toHaveProperty('pricePerCredit');
      });
    });

    it('should have decreasing price per credit (volume discount)', () => {
      const packages = service.getAvailableCreditPackages();
      const prices = packages.map((p) => p.pricePerCredit);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits and return remaining', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'STARTER',
        messageCredits: 100,
      });
      mockPrisma.workspace.update.mockResolvedValue({
        messageCredits: 99,
      });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.deductCredits(mockWorkspaceId, 1);

      expect(result.success).toBe(true);
      expect(result.remainingCredits).toBe(99);
      expect(result.plan).toBe('STARTER');
    });

    it('should deduct multiple credits at once', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'PROFESSIONAL',
        messageCredits: 500,
      });
      mockPrisma.workspace.update.mockResolvedValue({
        messageCredits: 490,
      });
      mockPrisma.transaction.create.mockResolvedValue({});

      const result = await service.deductCredits(mockWorkspaceId, 10);

      expect(result.success).toBe(true);
      expect(result.remainingCredits).toBe(490);

      // Verify decrement was called with correct amount
      expect(mockPrisma.workspace.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { messageCredits: { decrement: 10 } },
        }),
      );
    });

    it('should create transaction record for audit trail', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'STARTER',
        messageCredits: 50,
      });
      mockPrisma.workspace.update.mockResolvedValue({
        messageCredits: 49,
      });
      mockPrisma.transaction.create.mockResolvedValue({});

      await service.deductCredits(mockWorkspaceId, 1);

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: mockWorkspaceId,
          type: 'CREDIT_ADJUSTMENT',
          status: 'SUCCEEDED',
          creditsAdded: -1,
        }),
      });
    });

    it('should throw BadRequestException when insufficient credits', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'FREE',
        messageCredits: 5,
      });

      await expect(service.deductCredits(mockWorkspaceId, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return unlimited for ENTERPRISE plan without deducting', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: mockWorkspaceId,
        plan: 'ENTERPRISE',
        messageCredits: 0,
      });

      const result = await service.deductCredits(mockWorkspaceId, 1);

      expect(result.success).toBe(true);
      expect(result.remainingCredits).toBe(-1);
      expect(result.plan).toBe('ENTERPRISE');

      // Should NOT update workspace or create transaction
      expect(mockPrisma.workspace.update).not.toHaveBeenCalled();
      expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when workspace not found', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.deductCredits(mockWorkspaceId, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('canSendMessage', () => {
    it('should return canSend=true when enough credits', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'STARTER',
        messageCredits: 100,
      });

      const result = await service.canSendMessage(mockWorkspaceId, 50);

      expect(result.canSend).toBe(true);
      expect(result.remainingCredits).toBe(100);
      expect(result.plan).toBe('STARTER');
    });

    it('should return canSend=false when insufficient credits', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'FREE',
        messageCredits: 10,
      });

      const result = await service.canSendMessage(mockWorkspaceId, 50);

      expect(result.canSend).toBe(false);
      expect(result.remainingCredits).toBe(10);
      expect(result.reason).toContain('Insufficient credits');
    });

    it('should return canSend=true with unlimited for ENTERPRISE', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'ENTERPRISE',
        messageCredits: 0,
      });

      const result = await service.canSendMessage(mockWorkspaceId, 500);

      expect(result.canSend).toBe(true);
      expect(result.remainingCredits).toBe(-1);
      expect(result.plan).toBe('ENTERPRISE');
    });

    it('should return canSend=false when workspace not found', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      const result = await service.canSendMessage(mockWorkspaceId);

      expect(result.canSend).toBe(false);
      expect(result.remainingCredits).toBe(0);
    });

    it('should default to 1 required credit', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'FREE',
        messageCredits: 1,
      });

      const result = await service.canSendMessage(mockWorkspaceId);

      expect(result.canSend).toBe(true);
    });
  });

  describe('checkLowCreditsAlert', () => {
    it('should return "none" for ENTERPRISE plan', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'ENTERPRISE',
        messageCredits: 0,
      });

      const result = await service.checkLowCreditsAlert(mockWorkspaceId);

      expect(result.alertLevel).toBe('none');
      expect(result.remainingCredits).toBe(-1);
      expect(result.shouldNotify).toBe(false);
    });

    it('should return "critical" when 0 credits', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'STARTER',
        messageCredits: 0,
      });

      const result = await service.checkLowCreditsAlert(mockWorkspaceId);

      expect(result.alertLevel).toBe('critical');
      expect(result.shouldNotify).toBe(true);
    });

    it('should return "critical" when less than 10% (STARTER: <50)', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'STARTER',
        messageCredits: 30, // 6% of 500
      });

      const result = await service.checkLowCreditsAlert(mockWorkspaceId);

      expect(result.alertLevel).toBe('critical');
      expect(result.shouldNotify).toBe(true);
      expect(result.percentageRemaining).toBe(6);
    });

    it('should return "warning" when less than 20% (STARTER: <100)', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'STARTER',
        messageCredits: 80, // 16% of 500
      });

      const result = await service.checkLowCreditsAlert(mockWorkspaceId);

      expect(result.alertLevel).toBe('warning');
      expect(result.shouldNotify).toBe(true);
    });

    it('should return "info" when less than 50% (STARTER: <250)', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'STARTER',
        messageCredits: 200, // 40% of 500
      });

      const result = await service.checkLowCreditsAlert(mockWorkspaceId);

      expect(result.alertLevel).toBe('info');
      expect(result.shouldNotify).toBe(false); // Don't spam for 50%
    });

    it('should return "none" when credits are above 50%', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'STARTER',
        messageCredits: 400, // 80% of 500
      });

      const result = await service.checkLowCreditsAlert(mockWorkspaceId);

      expect(result.alertLevel).toBe('none');
      expect(result.shouldNotify).toBe(false);
    });

    it('should throw NotFoundException when workspace not found', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.checkLowCreditsAlert(mockWorkspaceId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addCredits', () => {
    it('should increment credits and create transaction', async () => {
      mockPrisma.workspace.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});

      await service.addCredits(mockWorkspaceId, 100, 'Test credit');

      expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
        where: { id: mockWorkspaceId },
        data: { messageCredits: { increment: 100 } },
      });

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: mockWorkspaceId,
          type: 'CREDIT_ADJUSTMENT',
          creditsAdded: 100,
          description: 'Test credit',
        }),
      });
    });

    it('should use default reason when not provided', async () => {
      mockPrisma.workspace.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});

      await service.addCredits(mockWorkspaceId, 50);

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Manual adjustment',
        }),
      });
    });
  });

  describe('getBillingInfo', () => {
    it('should return billing info for workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'STARTER',
        messageCredits: 200,
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: new Date('2026-03-01'),
        cancelAtPeriodEnd: false,
      });
      mockStripe.stripe.paymentMethods.list.mockResolvedValue({
        data: [{ id: 'pm_123' }],
      });

      const result = await service.getBillingInfo(mockWorkspaceId);

      expect(result.plan).toBe('STARTER');
      expect(result.messageCredits).toBe(200);
      expect(result.subscriptionStatus).toBe('active');
      expect(result.hasPaymentMethod).toBe(true);
    });

    it('should throw NotFoundException when workspace not found', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.getBillingInfo(mockWorkspaceId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return hasPaymentMethod=false when no Stripe customer', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        plan: 'FREE',
        messageCredits: 50,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });

      const result = await service.getBillingInfo(mockWorkspaceId);

      expect(result.hasPaymentMethod).toBe(false);
    });
  });

  describe('getTransactions', () => {
    it('should return transactions ordered by date desc', async () => {
      const mockTransactions = [
        { id: 't1', createdAt: new Date('2026-02-06') },
        { id: 't2', createdAt: new Date('2026-02-05') },
      ];
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getTransactions(mockWorkspaceId);

      expect(result).toEqual(mockTransactions);
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
        where: { workspaceId: mockWorkspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should respect custom limit', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await service.getTransactions(mockWorkspaceId, 10);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });
});
