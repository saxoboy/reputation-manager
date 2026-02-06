import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService, LowCreditsAlertEmail } from './email.service';

// Mock resend
const mockSend = jest
  .fn()
  .mockResolvedValue({ data: { id: 'email-123' }, error: null });

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });
  });

  const createService = async (envOverrides: Record<string, string> = {}) => {
    const defaultEnv: Record<string, string> = {
      RESEND_API_KEY: '',
      RESEND_FROM_EMAIL: 'test@reputationmanager.com',
      RESEND_FROM_NAME: 'Test Sender',
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
    it('should be disabled when RESEND_API_KEY is not set', async () => {
      service = await createService();
      expect(service.isEnabled()).toBe(false);
    });

    it('should be enabled when RESEND_API_KEY is set', async () => {
      service = await createService({ RESEND_API_KEY: 're_test_key' });
      expect(service.isEnabled()).toBe(true);
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

    it('should send email via Resend when enabled', async () => {
      service = await createService({ RESEND_API_KEY: 're_test_key' });
      const result = await service.sendLowCreditsAlert(mockAlertData);
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'doctor@clinic.com',
          subject: mockAlertData.subject,
        }),
      );
    });

    it('should return false when Resend returns an error', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'API error' },
      });
      service = await createService({ RESEND_API_KEY: 're_test_key' });
      const result = await service.sendLowCreditsAlert(mockAlertData);
      expect(result).toBe(false);
    });

    it('should return false when Resend throws', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network error'));
      service = await createService({ RESEND_API_KEY: 're_test_key' });
      const result = await service.sendLowCreditsAlert(mockAlertData);
      expect(result).toBe(false);
    });

    it('should handle critical alert with 0 credits', async () => {
      service = await createService({ RESEND_API_KEY: 're_test_key' });
      const result = await service.sendLowCreditsAlert({
        ...mockAlertData,
        remainingCredits: 0,
        percentageRemaining: 0,
        alertLevel: 'critical',
      });
      expect(result).toBe(true);
    });

    it('should handle warning alert', async () => {
      service = await createService({ RESEND_API_KEY: 're_test_key' });
      const result = await service.sendLowCreditsAlert({
        ...mockAlertData,
        remainingCredits: 80,
        percentageRemaining: 16,
        alertLevel: 'warning',
      });
      expect(result).toBe(true);
    });

    it('should handle info alert', async () => {
      service = await createService({ RESEND_API_KEY: 're_test_key' });
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

    it('should send welcome email via Resend', async () => {
      service = await createService({ RESEND_API_KEY: 're_test_key' });
      const result = await service.sendWelcomeEmail({
        email: 'user@test.com',
        name: 'Test User',
        workspaceName: 'My Clinic',
        loginUrl: 'http://localhost:4000/login',
      });
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
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

    it('should send invoice email via Resend', async () => {
      service = await createService({ RESEND_API_KEY: 're_test_key' });
      const result = await service.sendInvoiceEmail({
        email: 'user@test.com',
        name: 'Test User',
        invoiceUrl: 'https://stripe.com/invoice/123',
        amount: 3900,
        currency: 'usd',
        date: '2026-02-06',
      });
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Tu factura de Reputation Manager',
        }),
      );
    });
  });
});
