import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@reputation-manager/database';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUES } from '@reputation-manager/shared-types';
import { Response } from 'express';

describe('WhatsAppWebhookController', () => {
  let controller: WhatsAppWebhookController;
  let queueMock: any;
  let prismaMock: any;

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(async () => {
    queueMock = {
      add: jest.fn(),
    };

    prismaMock = {
      patient: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppWebhookController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'WHATSAPP_VERIFY_TOKEN') return 'my-secret-token';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: getQueueToken(QUEUES.CAMPAIGNS),
          useValue: queueMock,
        },
      ],
    }).compile();

    controller = module.get<WhatsAppWebhookController>(
      WhatsAppWebhookController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyWebhook (GET)', () => {
    it('should verify token successfully', () => {
      const res = mockResponse();
      controller.verifyWebhook('subscribe', 'my-secret-token', '12345', res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('12345');
    });

    it('should reject invalid token', () => {
      const res = mockResponse();
      controller.verifyWebhook('subscribe', 'wrong-token', '12345', res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('handleIncomingMessage (POST)', () => {
    const validBody = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: '593991234567',
                    text: { body: '5' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    it('should return 200 for event received even if no patient found', async () => {
      const res = mockResponse();
      prismaMock.patient.findFirst.mockResolvedValue(null);

      await controller.handleIncomingMessage(validBody, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');
    });

    it('should queue job when patient exists and rates', async () => {
      const res = mockResponse();
      prismaMock.patient.findFirst.mockResolvedValue({
        id: 'patient-123',
        messages: [{ id: 'msg-123', rating: null }],
      });

      await controller.handleIncomingMessage(validBody, res);

      expect(prismaMock.patient.findFirst).toHaveBeenCalled();
      expect(queueMock.add).toHaveBeenCalledWith(
        'handle-response',
        expect.objectContaining({
          rating: 5,
          from: '593991234567',
          messageId: 'msg-123',
        }),
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should parse text rating "4/5" correctly', async () => {
      const res = mockResponse();
      prismaMock.patient.findFirst.mockResolvedValue({
        id: 'patient-123',
        messages: [{ id: 'msg-123', rating: null }],
      });

      const bodyWithText = JSON.parse(JSON.stringify(validBody));
      bodyWithText.entry[0].changes[0].value.messages[0].text.body =
        'I give it 4/5';

      await controller.handleIncomingMessage(bodyWithText, res);

      expect(queueMock.add).toHaveBeenCalledWith(
        'handle-response',
        expect.objectContaining({ rating: 4 }),
        expect.any(Object),
      );
    });
  });
});
