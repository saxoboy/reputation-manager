import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { CreateMessageDto, UpdateMessageDto, SimulateResponseDto } from './dto';
import { Prisma, MessageStatus, MessageType } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los mensajes de un workspace con filtros
   */
  async findAll(
    workspaceId: string,
    filters?: {
      campaignId?: string;
      patientId?: string;
      status?: MessageStatus;
      type?: string;
    },
  ) {
    const where: Prisma.MessageWhereInput = {
      workspaceId,
    };

    if (filters?.campaignId) {
      where.campaignId = filters.campaignId;
    }

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type as MessageType;
    }

    return this.prisma.message.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtener mensajes de una campaña específica
   */
  async findByCampaign(campaignId: string, workspaceId: string) {
    // Verificar que la campaña pertenezca al workspace
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    if (campaign.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a esta campaña');
    }

    return this.prisma.message.findMany({
      where: {
        campaignId,
        workspaceId,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtener mensajes de un paciente específico
   */
  async findByPatient(patientId: string, workspaceId: string) {
    // Verificar que el paciente pertenezca al workspace
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (patient.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a este paciente');
    }

    return this.prisma.message.findMany({
      where: {
        patientId,
        workspaceId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Obtener un mensaje específico
   */
  async findOne(messageId: string, workspaceId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            appointmentTime: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
            practice: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            content: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    if (message.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a este mensaje');
    }

    return message;
  }

  /**
   * Crear un nuevo mensaje (MOCK - sin envío real)
   */
  async create(workspaceId: string, dto: CreateMessageDto) {
    // Verificar que el paciente pertenezca al workspace
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: {
        campaign: true,
      },
    });

    if (!patient || patient.workspaceId !== workspaceId) {
      throw new BadRequestException(
        'El paciente no existe o no pertenece a este workspace',
      );
    }

    // Verificar template si se proporciona
    if (dto.templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: dto.templateId },
      });

      if (!template || template.workspaceId !== workspaceId) {
        throw new BadRequestException(
          'La plantilla no existe o no pertenece a este workspace',
        );
      }
    }

    // Crear el mensaje (MOCK - simular envío)
    const message = await this.prisma.message.create({
      data: {
        type: dto.type,
        channel: dto.channel,
        content: dto.content,
        status: 'PENDING',
        patientId: dto.patientId,
        campaignId: patient.campaignId,
        workspaceId,
        templateId: dto.templateId,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // MOCK: Simular envío exitoso después de un delay
    // En producción, esto se manejaría con un job de BullMQ
    setTimeout(async () => {
      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
      console.log(`[MOCK] Mensaje ${message.id} enviado a ${patient.phone}`);
    }, 1000);

    return message;
  }

  /**
   * Actualizar un mensaje
   */
  async update(messageId: string, workspaceId: string, dto: UpdateMessageDto) {
    // Verificar que el mensaje existe y pertenece al workspace
    await this.findOne(messageId, workspaceId);

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.channel && { channel: dto.channel }),
        ...(dto.content && { content: dto.content }),
        ...(dto.status && { status: dto.status }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.templateId !== undefined && { templateId: dto.templateId }),
        ...(dto.sentAt && { sentAt: new Date(dto.sentAt) }),
        ...(dto.deliveredAt && { deliveredAt: new Date(dto.deliveredAt) }),
        ...(dto.repliedAt && { repliedAt: new Date(dto.repliedAt) }),
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar un mensaje
   */
  async remove(messageId: string, workspaceId: string) {
    // Verificar que el mensaje existe y pertenece al workspace
    await this.findOne(messageId, workspaceId);

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return {
      message: 'Mensaje eliminado exitosamente',
    };
  }

  /**
   * Simular respuesta de un paciente (para testing)
   */
  async simulateResponse(
    messageId: string,
    workspaceId: string,
    dto: SimulateResponseDto,
  ) {
    const message = await this.findOne(messageId, workspaceId);

    // Solo se puede responder a mensajes INITIAL
    if (message.type !== 'INITIAL') {
      throw new BadRequestException(
        'Solo se puede responder a mensajes de tipo INITIAL',
      );
    }

    // Actualizar mensaje con la respuesta
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        rating: dto.rating,
        feedback: dto.feedback,
        repliedAt: new Date(),
        status: 'DELIVERED', // Consideramos entregado si respondió
      },
      include: {
        patient: true,
        campaign: {
          include: {
            practice: true,
          },
        },
      },
    });

    // MOCK: Crear mensaje de seguimiento basado en el rating
    const isHappy = dto.rating >= 4;
    const followupType = isHappy ? 'FOLLOWUP_HAPPY' : 'FOLLOWUP_UNHAPPY';

    // Obtener template apropiado
    const template = await this.prisma.template.findFirst({
      where: {
        workspaceId,
        type: followupType,
      },
    });

    if (template) {
      // Reemplazar variables en el template
      let content = template.content;
      content = content.replace('{name}', updatedMessage.patient.name);
      content = content.replace(
        '{doctor}',
        updatedMessage.campaign.practice?.name || 'Doctor',
      );

      if (isHappy) {
        // Agregar link de Google Review (simulado)
        const googleReviewUrl = updatedMessage.campaign.practice?.googlePlaceId
          ? `https://search.google.com/local/writereview?placeid=${updatedMessage.campaign.practice.googlePlaceId}`
          : 'https://google.com/maps';
        content = content.replace('{reviewLink}', googleReviewUrl);
      } else {
        // Agregar link de formulario privado (simulado)
        const feedbackFormUrl = `${process.env.APP_URL || 'http://localhost:3000'}/feedback/${messageId}`;
        content = content.replace('{feedbackLink}', feedbackFormUrl);
      }

      // Crear mensaje de seguimiento
      setTimeout(async () => {
        await this.prisma.message.create({
          data: {
            type: followupType,
            channel: message.channel,
            content,
            status: 'PENDING',
            patientId: message.patientId,
            campaignId: message.campaignId,
            workspaceId,
            templateId: template.id,
          },
        });
        console.log(
          `[MOCK] Mensaje de seguimiento ${followupType} creado para paciente ${updatedMessage.patient.name}`,
        );
      }, 2000);
    }

    return updatedMessage;
  }

  /**
   * Obtener estadísticas de mensajes por workspace
   */
  async getStats(workspaceId: string) {
    const [total, pending, sent, delivered, failed] = await Promise.all([
      this.prisma.message.count({
        where: { workspaceId },
      }),
      this.prisma.message.count({
        where: { workspaceId, status: 'PENDING' },
      }),
      this.prisma.message.count({
        where: { workspaceId, status: 'SENT' },
      }),
      this.prisma.message.count({
        where: { workspaceId, status: 'DELIVERED' },
      }),
      this.prisma.message.count({
        where: { workspaceId, status: 'FAILED' },
      }),
    ]);

    // Calcular estadísticas de respuestas
    const messagesWithRating = await this.prisma.message.findMany({
      where: {
        workspaceId,
        rating: { not: null },
      },
      select: {
        rating: true,
      },
    });

    const totalResponses = messagesWithRating.length;
    const averageRating =
      totalResponses > 0
        ? messagesWithRating.reduce((sum, m) => sum + (m.rating || 0), 0) /
          totalResponses
        : 0;

    const happyResponses = messagesWithRating.filter(
      (m) => (m.rating || 0) >= 4,
    ).length;
    const unhappyResponses = messagesWithRating.filter(
      (m) => (m.rating || 0) <= 3,
    ).length;

    return {
      total,
      byStatus: {
        pending,
        sent,
        delivered,
        failed,
      },
      responses: {
        total: totalResponses,
        averageRating: Math.round(averageRating * 10) / 10,
        happy: happyResponses,
        unhappy: unhappyResponses,
        responseRate:
          total > 0 ? Math.round((totalResponses / total) * 100) : 0,
      },
    };
  }
}
