import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';

// Mock fetch
global.fetch = jest.fn();

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'WHATSAPP_ACCESS_TOKEN') return 'fake-access-token';
              if (key === 'WHATSAPP_PHONE_NUMBER_ID') return 'fake-phone-id';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendTemplateMessage', () => {
    it('should send a template message successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.HBg...' }] }),
      });

      const result = await service.sendTemplateMessage(
        '+593991234567',
        'hello_world',
      );

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"template"'),
        }),
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid token' } }),
      });

      const result = await service.sendTemplateMessage(
        '+593991234567',
        'hello_world',
      );

      expect(result).toBe(false);
    });
  });

  describe('sendTextMessage', () => {
    it('should send a text message successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.HBg...' }] }),
      });

      const result = await service.sendTextMessage(
        '+593991234567',
        'Hello there!',
      );

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"text"'),
        }),
      );
    });
  });
});
