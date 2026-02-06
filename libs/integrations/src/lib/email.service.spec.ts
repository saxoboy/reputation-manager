import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService, LowCreditsAlertEmail } from './email.service';
import * as sgMail from '@sendgrid/mail';

// Mock @sendgrid/mail
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createService = async (envOverrides: Record<string, string> = {}) => {
    const defaultEnv: Record<string, string> = {
      SENDGRID_API_KEY: '',
      SENDGRID_FROM_EMAIL: 'test@reputationmanager.com',
      SENDGRID_FROM_NAME: 'Test Sender',
      ...envOverrides,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => defaultEnv[key] || undefined),
          },
        },
      ],
    }).compile();

    return module.get<EmailService>(EmailService);
  };

  describe('initialization', () => {
    it('should be disabled when SENDGRID_API_KEY is not set', async () => {
      service = await createService();
      expect(service.isEnabled()).toBe(false);
    });

    it('should be enabled when SENDGRID_API_KEY is set', async () => {
      service = await createService({ SENDGRID_API_KEY: 'SG.test-key' });
      expect(service.isEnabled()).toBe(true);
      expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.test-key');
    });
  });

  describe('sendLowCreditsAlert', () => {
    const mockAlertData: LowCreditsAlertEmail = {
      workspaceId: 'ws-123',
      workspaceName: 'Dr. García Clinic',
      ownerEmail: 'doctor@clinic.com',
      ownerName: 'Dr. García',
      alertLevel: 'critical',
      remainingCredits: 5,
      percentageRemaining: 1,
      plan: 'STARTER',
      planLimit: 500,
      subject: 'CRITICAL: Less than 10% of credits remain',
      ctaUrl: 'http://localhost:4000/dashboard/billing',
    };

    it('should return false when service is disabled', async () => {
      service = await createService();
      const result = await service.sendLowCreditsAlert(mockAlertData);
      expect(result).toBe(false);
    });

    it('should return true when service is enabled (simulated send)', async () => {
      service = await createService({ SENDGRID_API_KEY: 'SG.test-key' });
      const result = await service.sendLowCreditsAlert(mockAlertData);
      expect(result).toBe(true);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'doctor@clinic.com',
          from: expect.objectContaining({
            email: 'test@reputationmanager.com',
          }),
          subject: mockAlertData.subject,
        }),
      );
    });

    it('should return false when SendGrid throws an error', async () => {
      (sgMail.send as jest.Mock).mockRejectedValueOnce(
        new Error('SendGrid API error'),
      );
      service = await createService({ SENDGRID_API_KEY: 'SG.test-key' });
      const result = await service.sendLowCreditsAlert(mockAlertData);
      expect(result).toBe(false);
    });

    it('should handle critical alert with 0 credits', async () => {
      service = await createService({ SENDGRID_API_KEY: 'SG.test-key' });
      const result = await service.sendLowCreditsAlert({
        ...mockAlertData,
        remainingCredits: 0,
        percentageRemaining: 0,
        alertLevel: 'critical',
      });
      expect(result).toBe(true);
    });

    it('should handle warning alert', async () => {
      service = await createService({ SENDGRID_API_KEY: 'SG.test-key' });
      const result = await service.sendLowCreditsAlert({
        ...mockAlertData,
        remainingCredits: 80,
        percentageRemaining: 16,
        alertLevel: 'warning',
      });
      expect(result).toBe(true);
    });

    it('should handle info alert', async () => {
      service = await createService({ SENDGRID_API_KEY: 'SG.test-key' });
      const result = await service.sendLowCreditsAlert({
        ...mockAlertData,
        remainingCredits: 250,
        percentageRemaining: 50,
        alertLevel: 'info',
      });
      expect(result).toBe(true);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should return false when service is disabled', async () => {
      service = await createService();
      const result = await service.sendWelcomeEmail({
        email: 'user@test.com',
        name: 'Test User',
        workspaceName: 'My Clinic',
        loginUrl: 'http://localhost:4000/login',
      });
      expect(result).toBe(false);
    });

    it('should return true when service is enabled', async () => {
      service = await createService({ SENDGRID_API_KEY: 'SG.test-key' });
      const result = await service.sendWelcomeEmail({
        email: 'user@test.com',
        name: 'Test User',
        workspaceName: 'My Clinic',
        loginUrl: 'http://localhost:4000/login',
      });
      expect(result).toBe(true);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: '¡Bienvenido a My Clinic!',
        }),
      );
    });
  });

  describe('sendInvoiceEmail', () => {
    it('should return false when service is disabled', async () => {
      service = await createService();
      const result = await service.sendInvoiceEmail({
        email: 'user@test.com',
        name: 'Test User',
        invoiceUrl: 'https://stripe.com/invoice/123',
        amount: 3900,
        currency: 'usd',
        date: '2026-02-06',
      });
      expect(result).toBe(false);
    });

    it('should return true when service is enabled', async () => {
      service = await createService({ SENDGRID_API_KEY: 'SG.test-key' });
      const result = await service.sendInvoiceEmail({
        email: 'user@test.com',
        name: 'Test User',
        invoiceUrl: 'https://stripe.com/invoice/123',
        amount: 3900,
        currency: 'usd',
        date: '2026-02-06',
      });
      expect(result).toBe(true);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Tu factura de Reputation Manager',
        }),
      );
    });
  });
});
