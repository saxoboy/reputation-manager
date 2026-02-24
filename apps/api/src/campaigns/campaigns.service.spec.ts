import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '@reputation-manager/database';
import { BillingService } from '../billing/billing.service';
import { RedisCacheService } from '../cache/redis-cache.service';

// Mock parsePatientsCSV
jest.mock('@reputation-manager/shared-utils', () => ({
  parsePatientsCSV: jest.fn(),
}));

import { parsePatientsCSV } from '@reputation-manager/shared-utils';
const mockParsePatientsCSV = parsePatientsCSV as jest.MockedFunction<
  typeof parsePatientsCSV
>;

describe('CampaignsService - Credit Pre-check', () => {
  let service: CampaignsService;

  const mockPrisma = {
    campaign: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    patient: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockBillingService = {
    canSendMessage: jest.fn(),
  };

  const mockCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delByPattern: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BillingService, useValue: mockBillingService },
        { provide: RedisCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  describe('uploadCsv - credit pre-check', () => {
    const workspaceId = 'ws-123';
    const campaignId = 'camp-123';
    const uploadDto = {
      csvContent:
        'name,phone,appointmentTime,hasConsent\nJuan,+593999999999,2026-02-07T10:00:00Z,true',
      delimiter: ',',
    };

    beforeEach(() => {
      // Campaign exists (findOne uses findUnique)
      mockPrisma.campaign.findUnique.mockResolvedValue({
        id: campaignId,
        workspaceId,
        name: 'Test Campaign',
        practice: { id: 'pr-1', name: 'Clinic', googlePlaceId: null },
        patients: [],
        _count: { patients: 0, messages: 0 },
      });

      // No existing patients in campaign by default (deduplication query)
      mockPrisma.patient.findMany.mockResolvedValue([]);
    });

    it('should allow CSV upload when enough credits', async () => {
      mockParsePatientsCSV.mockReturnValue({
        patients: [
          {
            name: 'Juan',
            phone: '+593999999999',
            appointmentTime: new Date('2026-02-07T10:00:00Z'),
            hasConsent: true,
          },
        ],
        errors: [],
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
      } as any);

      mockBillingService.canSendMessage.mockResolvedValue({
        canSend: true,
        remainingCredits: 50,
        plan: 'STARTER',
      });

      mockPrisma.$transaction.mockResolvedValue([
        { id: 'patient-1', name: 'Juan' },
      ]);

      const result = await service.uploadCsv(
        campaignId,
        workspaceId,
        uploadDto,
      );

      expect(result.summary.patientsCreated).toBe(1);
      expect(mockBillingService.canSendMessage).toHaveBeenCalledWith(
        workspaceId,
        1,
      );
    });

    it('should throw ForbiddenException when insufficient credits', async () => {
      mockParsePatientsCSV.mockReturnValue({
        patients: [
          {
            name: 'Juan',
            phone: '+593999999999',
            appointmentTime: new Date('2026-02-07T10:00:00Z'),
            hasConsent: true,
          },
          {
            name: 'Maria',
            phone: '+593888888888',
            appointmentTime: new Date('2026-02-07T11:00:00Z'),
            hasConsent: true,
          },
        ],
        errors: [],
        totalRows: 2,
        validRows: 2,
        invalidRows: 0,
      } as any);

      mockBillingService.canSendMessage.mockResolvedValue({
        canSend: false,
        remainingCredits: 1,
        plan: 'FREE',
        reason: 'Insufficient credits. Have 1, need 2',
      });

      await expect(
        service.uploadCsv(campaignId, workspaceId, uploadDto),
      ).rejects.toThrow(ForbiddenException);

      // Should NOT create patients
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should include deficit details in ForbiddenException', async () => {
      mockParsePatientsCSV.mockReturnValue({
        patients: Array.from({ length: 50 }, (_, i) => ({
          name: `Patient ${i}`,
          phone: '+593999999999',
          appointmentTime: new Date(),
          hasConsent: true,
        })),
        errors: [],
        totalRows: 50,
        validRows: 50,
        invalidRows: 0,
      } as any);

      mockBillingService.canSendMessage.mockResolvedValue({
        canSend: false,
        remainingCredits: 10,
        plan: 'FREE',
      });

      try {
        await service.uploadCsv(campaignId, workspaceId, uploadDto);
        fail('Should have thrown ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        const response = (error as ForbiddenException).getResponse() as any;
        expect(response.details.required).toBe(50);
        expect(response.details.available).toBe(10);
        expect(response.details.deficit).toBe(40);
      }
    });

    it('should allow upload for ENTERPRISE plan regardless of credits', async () => {
      mockParsePatientsCSV.mockReturnValue({
        patients: Array.from({ length: 1000 }, (_, i) => ({
          name: `Patient ${i}`,
          phone: '+593999999999',
          appointmentTime: new Date(),
          hasConsent: true,
        })),
        errors: [],
        totalRows: 1000,
        validRows: 1000,
        invalidRows: 0,
      } as any);

      mockBillingService.canSendMessage.mockResolvedValue({
        canSend: true,
        remainingCredits: -1, // unlimited
        plan: 'ENTERPRISE',
      });

      mockPrisma.$transaction.mockResolvedValue(
        Array.from({ length: 1000 }, (_, i) => ({ id: `p-${i}` })),
      );

      const result = await service.uploadCsv(
        campaignId,
        workspaceId,
        uploadDto,
      );

      expect(result.summary.patientsCreated).toBe(1000);
    });

    it('should check credits after CSV parsing but before patient creation', async () => {
      const callOrder: string[] = [];

      mockParsePatientsCSV.mockImplementation(() => {
        callOrder.push('parse');
        return {
          patients: [
            {
              name: 'Juan',
              phone: '+593999999999',
              appointmentTime: new Date(),
              hasConsent: true,
            },
          ],
          errors: [],
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
        } as any;
      });

      mockBillingService.canSendMessage.mockImplementation(async () => {
        callOrder.push('creditCheck');
        return { canSend: true, remainingCredits: 50, plan: 'STARTER' };
      });

      mockPrisma.$transaction.mockImplementation(async () => {
        callOrder.push('createPatients');
        return [{ id: 'p-1' }];
      });

      await service.uploadCsv(campaignId, workspaceId, uploadDto);

      expect(callOrder).toEqual(['parse', 'creditCheck', 'createPatients']);
    });
  });
});
