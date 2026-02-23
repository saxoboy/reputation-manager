import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { CampaignProcessor } from './campaign.processor';
import { PrismaService } from '@reputation-manager/database';
import {
  TwilioService,
  WhatsAppService,
  GooglePlacesService,
  EmailService,
} from '@reputation-manager/integrations';
import { QUEUES } from '@reputation-manager/shared-types';
import { Job } from 'bullmq';

describe('CampaignProcessor', () => {
  let processor: CampaignProcessor;

  const mockPrisma = {
    workspace: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  };

  const mockTwilioService = {
    sendSMS: jest.fn(),
  };

  const mockWhatsAppService = {
    sendTemplateMessage: jest.fn(),
    sendTextMessage: jest.fn(),
  };

  const mockGooglePlacesService = {
    generateReviewUrl: jest.fn().mockReturnValue('https://g.page/review/test'),
  };

  const mockEmailService = {
    sendLowCreditsAlert: jest.fn().mockResolvedValue(true),
    isEnabled: jest.fn().mockReturnValue(true),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    // Re-establish default return values cleared by resetAllMocks
    mockGooglePlacesService.generateReviewUrl.mockReturnValue(
      'https://g.page/review/test',
    );
    mockEmailService.sendLowCreditsAlert.mockResolvedValue(true);
    mockEmailService.isEnabled.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TwilioService, useValue: mockTwilioService },
        { provide: WhatsAppService, useValue: mockWhatsAppService },
        { provide: GooglePlacesService, useValue: mockGooglePlacesService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: getQueueToken(QUEUES.CAMPAIGNS), useValue: mockQueue },
      ],
    }).compile();

    processor = module.get<CampaignProcessor>(CampaignProcessor);
  });

  describe('checkAndDeductCredits (via process)', () => {
    const createJob = (name: string, data: any) =>
      ({
        id: 'job-1',
        name,
        data,
        updateData: jest.fn(),
      }) as unknown as Job;

    describe('credit deduction logic', () => {
      it('should deduct 1 credit for STARTER plan', async () => {
        // Setup workspace with credits
        mockPrisma.workspace.findUnique
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'STARTER',
            messageCredits: 100,
          })
          // For checkLowCredits call
          .mockResolvedValueOnce({
            id: 'ws-1',
            name: 'Test Clinic',
            users: [{ user: { email: 'doc@test.com', name: 'Dr. Test' } }],
          });

        mockPrisma.workspace.update.mockResolvedValue({
          messageCredits: 99,
        });
        mockPrisma.transaction.create.mockResolvedValue({});

        // Setup patient
        mockPrisma.patient.findUnique.mockResolvedValue({
          id: 'p-1',
          name: 'Patient',
          phone: '+593999999999',
          hasConsent: true,
          optedOutAt: null,
          preferredChannel: null,
          language: 'es',
          workspace: {
            defaultChannel: 'SMS',
            smsEnabled: true,
            whatsappEnabled: false,
            emailEnabled: false,
          },
        });

        // Setup SMS send
        mockTwilioService.sendSMS.mockResolvedValue({
          success: true,
          messageId: 'SM123',
        });
        mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });

        const job = createJob('send-initial-message', {
          patientId: 'p-1',
          workspaceId: 'ws-1',
          campaignId: 'c-1',
        });

        await processor.process(job);

        // Verify credit deduction
        expect(mockPrisma.workspace.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { messageCredits: { decrement: 1 } },
          }),
        );
      });

      it('should skip credit deduction for ENTERPRISE plan', async () => {
        mockPrisma.workspace.findUnique
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'ENTERPRISE',
            messageCredits: 0,
          }) // validateCredits
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'ENTERPRISE',
            messageCredits: 0,
          }); // checkAndDeductCredits (returns early for ENTERPRISE)

        mockPrisma.patient.findUnique.mockResolvedValue({
          id: 'p-1',
          name: 'Patient',
          phone: '+593999999999',
          hasConsent: true,
          optedOutAt: null,
          preferredChannel: null,
          language: 'es',
          workspace: {
            defaultChannel: 'SMS',
            smsEnabled: true,
            whatsappEnabled: false,
            emailEnabled: false,
          },
        });

        mockTwilioService.sendSMS.mockResolvedValue({
          success: true,
          messageId: 'SM123',
        });
        mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });

        const job = createJob('send-initial-message', {
          patientId: 'p-1',
          workspaceId: 'ws-1',
          campaignId: 'c-1',
        });

        await processor.process(job);

        // Should NOT call workspace update for credit deduction
        expect(mockPrisma.workspace.update).not.toHaveBeenCalled();
      });

      it('should throw error when insufficient credits', async () => {
        mockPrisma.workspace.findUnique.mockResolvedValueOnce({
          id: 'ws-1',
          plan: 'FREE',
          messageCredits: 0,
        }); // validateCredits throws, no further calls needed

        mockPrisma.patient.findUnique.mockResolvedValue({
          id: 'p-1',
          name: 'Patient',
          phone: '+593999999999',
          hasConsent: true,
          optedOutAt: null,
          preferredChannel: null,
          workspace: {
            defaultChannel: 'SMS',
            smsEnabled: true,
            whatsappEnabled: false,
            emailEnabled: false,
          },
        });

        const job = createJob('send-initial-message', {
          patientId: 'p-1',
          workspaceId: 'ws-1',
          campaignId: 'c-1',
        });

        await expect(processor.process(job)).rejects.toThrow(
          /Insufficient message credits/,
        );

        // Should NOT send SMS
        expect(mockTwilioService.sendSMS).not.toHaveBeenCalled();
      });

      it('should create transaction record after deduction', async () => {
        mockPrisma.workspace.findUnique
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'STARTER',
            messageCredits: 50,
          })
          .mockResolvedValueOnce({
            id: 'ws-1',
            name: 'Test Clinic',
            users: [{ user: { email: 'doc@test.com', name: 'Dr. Test' } }],
          });

        mockPrisma.workspace.update.mockResolvedValue({
          messageCredits: 49,
        });
        mockPrisma.transaction.create.mockResolvedValue({});

        mockPrisma.patient.findUnique.mockResolvedValue({
          id: 'p-1',
          name: 'Patient',
          phone: '+593999999999',
          hasConsent: true,
          optedOutAt: null,
          preferredChannel: null,
          workspace: {
            defaultChannel: 'SMS',
            smsEnabled: true,
            whatsappEnabled: false,
            emailEnabled: false,
          },
        });

        mockTwilioService.sendSMS.mockResolvedValue({
          success: true,
          messageId: 'SM123',
        });
        mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });

        const job = createJob('send-initial-message', {
          patientId: 'p-1',
          workspaceId: 'ws-1',
          campaignId: 'c-1',
        });

        await processor.process(job);

        expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            type: 'CREDIT_ADJUSTMENT',
            status: 'SUCCEEDED',
            creditsAdded: -1,
            description: 'Message sent - 1 credit deducted',
          }),
        });
      });
    });

    describe('low credits email alerts', () => {
      it('should send critical email when 0 credits remain', async () => {
        mockPrisma.workspace.findUnique
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'FREE',
            messageCredits: 1,
          }) // validateCredits
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'FREE',
            messageCredits: 1, // Will become 0 after deduction
          }) // checkAndDeductCredits
          .mockResolvedValueOnce({
            id: 'ws-1',
            name: 'Test Clinic',
            users: [{ user: { email: 'doc@test.com', name: 'Dr. Test' } }],
          }); // checkLowCredits

        mockPrisma.workspace.update.mockResolvedValue({
          messageCredits: 0,
        });
        mockPrisma.transaction.create.mockResolvedValue({});

        mockPrisma.patient.findUnique.mockResolvedValue({
          id: 'p-1',
          name: 'Patient',
          phone: '+593999999999',
          hasConsent: true,
          optedOutAt: null,
          preferredChannel: null,
          workspace: {
            defaultChannel: 'SMS',
            smsEnabled: true,
            whatsappEnabled: false,
            emailEnabled: false,
          },
        });

        mockTwilioService.sendSMS.mockResolvedValue({
          success: true,
          messageId: 'SM123',
        });
        mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });

        const job = createJob('send-initial-message', {
          patientId: 'p-1',
          workspaceId: 'ws-1',
          campaignId: 'c-1',
        });

        await processor.process(job);

        expect(mockEmailService.sendLowCreditsAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            ownerEmail: 'doc@test.com',
            alertLevel: 'critical',
            remainingCredits: 0,
          }),
        );
      });

      it('should NOT send email for ENTERPRISE plan', async () => {
        mockPrisma.workspace.findUnique
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'ENTERPRISE',
            messageCredits: 0,
          }) // validateCredits
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'ENTERPRISE',
            messageCredits: 0,
          }); // checkAndDeductCredits (returns early, no checkLowCredits)

        mockPrisma.patient.findUnique.mockResolvedValue({
          id: 'p-1',
          name: 'Patient',
          phone: '+593999999999',
          hasConsent: true,
          optedOutAt: null,
          preferredChannel: null,
          workspace: {
            defaultChannel: 'SMS',
            smsEnabled: true,
            whatsappEnabled: false,
            emailEnabled: false,
          },
        });

        mockTwilioService.sendSMS.mockResolvedValue({
          success: true,
          messageId: 'SM123',
        });
        mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });

        const job = createJob('send-initial-message', {
          patientId: 'p-1',
          workspaceId: 'ws-1',
          campaignId: 'c-1',
        });

        await processor.process(job);

        expect(mockEmailService.sendLowCreditsAlert).not.toHaveBeenCalled();
      });

      it('should not fail if email service throws an error', async () => {
        mockPrisma.workspace.findUnique
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'FREE',
            messageCredits: 1,
          }) // validateCredits
          .mockResolvedValueOnce({
            id: 'ws-1',
            plan: 'FREE',
            messageCredits: 1,
          }) // checkAndDeductCredits
          .mockResolvedValueOnce({
            id: 'ws-1',
            name: 'Test Clinic',
            users: [{ user: { email: 'doc@test.com', name: 'Dr. Test' } }],
          }); // checkLowCredits

        mockPrisma.workspace.update.mockResolvedValue({
          messageCredits: 0,
        });
        mockPrisma.transaction.create.mockResolvedValue({});

        // Email service throws
        mockEmailService.sendLowCreditsAlert.mockRejectedValue(
          new Error('SendGrid error'),
        );

        mockPrisma.patient.findUnique.mockResolvedValue({
          id: 'p-1',
          name: 'Patient',
          phone: '+593999999999',
          hasConsent: true,
          optedOutAt: null,
          preferredChannel: null,
          workspace: {
            defaultChannel: 'SMS',
            smsEnabled: true,
            whatsappEnabled: false,
            emailEnabled: false,
          },
        });

        mockTwilioService.sendSMS.mockResolvedValue({
          success: true,
          messageId: 'SM123',
        });
        mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });

        const job = createJob('send-initial-message', {
          patientId: 'p-1',
          workspaceId: 'ws-1',
          campaignId: 'c-1',
        });

        // Should NOT throw even though email failed
        await expect(processor.process(job)).resolves.toBeDefined();
      });
    });
  });

  describe('process - routing', () => {
    it('should route send-initial-message job correctly', async () => {
      mockPrisma.workspace.findUnique
        .mockResolvedValueOnce({
          id: 'ws-1',
          plan: 'ENTERPRISE',
          messageCredits: 0,
        }) // validateCredits
        .mockResolvedValueOnce({
          id: 'ws-1',
          plan: 'ENTERPRISE',
          messageCredits: 0,
        }); // checkAndDeductCredits (returns early for ENTERPRISE)

      mockPrisma.patient.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Patient',
        phone: '+593999999999',
        hasConsent: true,
        optedOutAt: null,
        preferredChannel: null,
        workspace: {
          defaultChannel: 'SMS',
          smsEnabled: true,
          whatsappEnabled: false,
          emailEnabled: false,
        },
      });

      mockTwilioService.sendSMS.mockResolvedValue({
        success: true,
        messageId: 'SM123',
      });
      mockPrisma.message.create.mockResolvedValue({ id: 'msg-1' });

      const job = {
        id: 'job-1',
        name: 'send-initial-message',
        data: { patientId: 'p-1', workspaceId: 'ws-1', campaignId: 'c-1' },
        updateData: jest.fn(),
      } as unknown as Job;

      const result = await processor.process(job);
      expect(result).toEqual({ success: true, messageId: 'msg-1' });
    });

    it('should skip patient without consent', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValueOnce({
        id: 'ws-1',
        plan: 'ENTERPRISE',
        messageCredits: 0,
      });

      mockPrisma.patient.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Patient',
        phone: '+593999999999',
        hasConsent: false, // No consent
        optedOutAt: null,
        preferredChannel: null,
        workspace: {
          defaultChannel: 'SMS',
          smsEnabled: true,
          whatsappEnabled: false,
          emailEnabled: false,
        },
      });

      const job = {
        id: 'job-1',
        name: 'send-initial-message',
        data: { patientId: 'p-1', workspaceId: 'ws-1', campaignId: 'c-1' },
        updateData: jest.fn(),
      } as unknown as Job;

      const result = await processor.process(job);

      expect(result).toBeUndefined();
      expect(mockTwilioService.sendSMS).not.toHaveBeenCalled();
    });

    it('should skip opted-out patient', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValueOnce({
        id: 'ws-1',
        plan: 'ENTERPRISE',
        messageCredits: 0,
      });

      mockPrisma.patient.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Patient',
        phone: '+593999999999',
        hasConsent: true,
        optedOutAt: new Date(), // Opted out
        preferredChannel: null,
        workspace: {
          defaultChannel: 'SMS',
          smsEnabled: true,
          whatsappEnabled: false,
          emailEnabled: false,
        },
      });

      const job = {
        id: 'job-1',
        name: 'send-initial-message',
        data: { patientId: 'p-1', workspaceId: 'ws-1', campaignId: 'c-1' },
        updateData: jest.fn(),
      } as unknown as Job;

      const result = await processor.process(job);

      expect(result).toBeUndefined();
      expect(mockTwilioService.sendSMS).not.toHaveBeenCalled();
    });
  });

  describe('process - handle-response', () => {
    it('should enqueue HAPPY followup for rating >= 4', async () => {
      mockPrisma.message.update.mockResolvedValue({
        id: 'msg-1',
        patientId: 'p-1',
        workspaceId: 'ws-1',
        campaignId: 'c-1',
        patient: { name: 'Test' },
      });

      const job = {
        id: 'job-1',
        name: 'handle-response',
        data: {
          messageId: 'msg-1',
          rating: 5,
          text: 'Great!',
          from: '+593...',
        },
      } as unknown as Job;

      await processor.process(job);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-followup',
        expect.objectContaining({ type: 'HAPPY' }),
        expect.anything(),
      );
    });

    it('should enqueue UNHAPPY followup for rating < 4', async () => {
      mockPrisma.message.update.mockResolvedValue({
        id: 'msg-1',
        patientId: 'p-1',
        workspaceId: 'ws-1',
        campaignId: 'c-1',
        patient: { name: 'Test' },
      });

      const job = {
        id: 'job-1',
        name: 'handle-response',
        data: { messageId: 'msg-1', rating: 2, text: 'Bad', from: '+593...' },
      } as unknown as Job;

      await processor.process(job);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-followup',
        expect.objectContaining({ type: 'UNHAPPY' }),
        expect.anything(),
      );
    });
  });
});
