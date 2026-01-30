import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from './twilio.service';

// Mock dependencies
const mockConfigService = {
  get: jest.fn(),
};

// Mock Twilio client
const mockMessagesCreate = jest.fn();
const mockMessagesFetch = jest.fn();
const mockTwilioClient = {
  messages: Object.assign(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_sid: string) => ({
      fetch: mockMessagesFetch,
    }),
    {
      create: mockMessagesCreate,
    },
  ),
};

// Mock Twilio module
jest.mock('twilio', () => {
  const Twilio = jest.fn(() => mockTwilioClient);
  // Add static methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Twilio as any).validateRequest = jest.fn(() => true);
  return Twilio;
});

describe('TwilioService', () => {
  let service: TwilioService;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwilioService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TwilioService>(TwilioService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initialize', () => {
    it('should initialize client if credentials are present', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'TWILIO_ACCOUNT_SID') return 'AC123';
        if (key === 'TWILIO_AUTH_TOKEN') return 'token';
        if (key === 'TWILIO_PHONE_NUMBER') return '+593999999999';
        return null;
      });

      // Re-create service to trigger constructor/initialize
      service = new TwilioService(configService);

      expect(service.isReady()).toBe(true);
    });

    it('should not initialize client if credentials are missing', () => {
      mockConfigService.get.mockReturnValue(null);

      service = new TwilioService(configService);

      expect(service.isReady()).toBe(false);
    });
  });

  describe('sendSMS', () => {
    beforeEach(() => {
      // Setup successful config by default for these tests
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'TWILIO_ACCOUNT_SID') return 'AC123';
        if (key === 'TWILIO_AUTH_TOKEN') return 'token';
        if (key === 'TWILIO_PHONE_NUMBER') return '+593999999999';
        return null;
      });
      service = new TwilioService(configService);
    });

    it('should return error for invalid Ecuador phone number', async () => {
      const result = await service.sendSMS({
        to: '+1234567890',
        body: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
      expect(mockMessagesCreate).not.toHaveBeenCalled();
    });

    it('should send SMS via Twilio when configured', async () => {
      mockMessagesCreate.mockResolvedValue({
        sid: 'SM123',
        status: 'queued',
      });

      const result = await service.sendSMS({
        to: '+593999999999',
        body: 'Test Message',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123');
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        body: 'Test Message',
        from: '+593999999999',
        to: '+593999999999',
      });
    });

    it('should return error info when Twilio fails', async () => {
      mockMessagesCreate.mockRejectedValue({
        code: 21211,
        message: 'Invalid number',
      });

      const result = await service.sendSMS({
        to: '+593999999999',
        body: 'Test Message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number');
    });

    it('should use mock sending when not configured', async () => {
      mockConfigService.get.mockReturnValue(null);
      service = new TwilioService(configService); // Reset with no config

      const result = await service.sendSMS({
        to: '+593999999999',
        body: 'Test Mock',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toContain('mock_');
      expect(mockMessagesCreate).not.toHaveBeenCalled();
    });
  });
});
