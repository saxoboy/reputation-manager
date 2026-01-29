import { Test, TestingModule } from '@nestjs/testing';
import { TwilioWebhookController } from './twilio-webhook.controller';
import { PrismaService } from '@reputation-manager/database';
import { TwilioService } from '@reputation-manager/integrations';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUES } from '@reputation-manager/shared-types';
import { UnauthorizedException } from '@nestjs/common';

// Mocks
const mockPrismaService = {
  patient: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  message: {
    update: jest.fn(),
  },
};

const mockTwilioService = {
  validateWebhookSignature: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
};

describe('TwilioWebhookController', () => {
  let controller: TwilioWebhookController;
  let prisma: PrismaService;
  let twilioService: TwilioService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwilioWebhookController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TwilioService, useValue: mockTwilioService },
        { provide: getQueueToken(QUEUES.CAMPAIGNS), useValue: mockQueue },
      ],
    }).compile();

    controller = module.get<TwilioWebhookController>(TwilioWebhookController);
    prisma = module.get<PrismaService>(PrismaService);
    twilioService = module.get<TwilioService>(TwilioService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleIncomingSMS', () => {
    const validSignature = 'valid-sig';
    const validBody = {
      MessageSid: 'SM123',
      From: '+593999999999',
      To: '+593000000000',
      Body: '5',
      NumMedia: '0',
    };

    it('should throw UnauthorizedException if signature is invalid', async () => {
      mockTwilioService.validateWebhookSignature.mockReturnValue(false);

      await expect(
        controller.handleIncomingSMS(validBody, 'invalid-sig'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should assume success if patient not found (privacy)', async () => {
      mockTwilioService.validateWebhookSignature.mockReturnValue(true);
      mockPrismaService.patient.findFirst.mockResolvedValue(null);

      const result = await controller.handleIncomingSMS(
        validBody,
        validSignature,
      );

      expect(result).toContain('<Message>Gracias por tu mensaje.</Message>');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should queue response if validation passes', async () => {
      mockTwilioService.validateWebhookSignature.mockReturnValue(true);
      mockPrismaService.patient.findFirst.mockResolvedValue({
        id: 'patient-123',
        phone: '+593999999999',
        messages: [
          {
            id: 'msg-123',
            type: 'INITIAL',
            status: 'SENT',
            rating: null,
          },
        ],
      });

      const result = await controller.handleIncomingSMS(
        validBody,
        validSignature,
      );

      expect(result).toContain('¡Gracias por tu respuesta!');
      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.anything(), // job name
        expect.objectContaining({
          rating: 5,
          messageId: 'msg-123',
        }),
        expect.anything(),
      );
    });

    it('should handle opt-out messages', async () => {
      mockTwilioService.validateWebhookSignature.mockReturnValue(true);
      mockPrismaService.patient.findFirst.mockResolvedValue({
        id: 'patient-123',
        phone: '+593999999999',
        messages: [{ id: 'msg-123', type: 'INITIAL', rating: null }],
      });

      const optOutBody = { ...validBody, Body: 'STOP' };

      const result = await controller.handleIncomingSMS(
        optOutBody,
        validSignature,
      );

      expect(result).toContain('Has sido dado de baja');
      expect(mockPrismaService.patient.update).toHaveBeenCalledWith({
        where: { id: 'patient-123' },
        data: { optedOutAt: expect.any(Date) },
      });
    });

    it('should validate rating input (invalid number)', async () => {
      mockTwilioService.validateWebhookSignature.mockReturnValue(true);
      mockPrismaService.patient.findFirst.mockResolvedValue({
        id: 'patient-123',
        phone: '+593999999999',
        messages: [{ id: 'msg-123', type: 'INITIAL', rating: null }],
      });

      const invalidBody = { ...validBody, Body: 'Hola' };

      const result = await controller.handleIncomingSMS(
        invalidBody,
        validSignature,
      );

      expect(result).toContain('Por favor responde con un número del 1 al 5');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });
});
