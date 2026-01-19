import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los pacientes de un workspace
   * Incluye filtros opcionales
   */
  async findAll(
    workspaceId: string,
    filters?: {
      campaignId?: string;
      hasConsent?: boolean;
      optedOut?: boolean;
    },
  ) {
    const where: Prisma.PatientWhereInput = {
      workspaceId,
      dataDeletedAt: null, // No incluir soft-deleted
    };

    if (filters?.campaignId) {
      where.campaignId = filters.campaignId;
    }

    if (filters?.hasConsent !== undefined) {
      where.hasConsent = filters.hasConsent;
    }

    if (filters?.optedOut !== undefined) {
      if (filters.optedOut) {
        where.optedOutAt = { not: null };
      } else {
        where.optedOutAt = null;
      }
    }

    return this.prisma.patient.findMany({
      where,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          select: {
            id: true,
            type: true,
            status: true,
            rating: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtener todos los pacientes de una campaña específica
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

    return this.prisma.patient.findMany({
      where: {
        campaignId,
        workspaceId,
        dataDeletedAt: null,
      },
      include: {
        messages: {
          select: {
            id: true,
            type: true,
            status: true,
            rating: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        appointmentTime: 'asc',
      },
    });
  }

  /**
   * Obtener un paciente específico
   */
  async findOne(patientId: string, workspaceId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
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
        messages: {
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
            createdAt: 'desc',
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Verificar que pertenezca al workspace correcto
    if (patient.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a este paciente');
    }

    // No mostrar pacientes soft-deleted
    if (patient.dataDeletedAt) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  /**
   * Crear un nuevo paciente
   */
  async create(workspaceId: string, dto: CreatePatientDto) {
    // Verificar que la campaña pertenezca al workspace
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    });

    if (!campaign || campaign.workspaceId !== workspaceId) {
      throw new BadRequestException(
        'La campaña no existe o no pertenece a este workspace',
      );
    }

    // Crear el paciente
    return this.prisma.patient.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        appointmentTime: new Date(dto.appointmentTime),
        appointmentType: dto.appointmentType,
        hasConsent: dto.hasConsent,
        preferredChannel: dto.preferredChannel || 'SMS',
        language: dto.language || 'es',
        campaignId: dto.campaignId,
        workspaceId,
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Actualizar un paciente
   */
  async update(patientId: string, workspaceId: string, dto: UpdatePatientDto) {
    // Verificar que el paciente existe y pertenece al workspace
    await this.findOne(patientId, workspaceId);

    // Si se está actualizando la campaña, verificar que pertenezca al workspace
    if (dto.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: dto.campaignId },
      });

      if (!campaign || campaign.workspaceId !== workspaceId) {
        throw new BadRequestException(
          'La campaña no existe o no pertenece a este workspace',
        );
      }
    }

    return this.prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.appointmentTime && {
          appointmentTime: new Date(dto.appointmentTime),
        }),
        ...(dto.appointmentType !== undefined && {
          appointmentType: dto.appointmentType,
        }),
        ...(dto.hasConsent !== undefined && { hasConsent: dto.hasConsent }),
        ...(dto.preferredChannel && { preferredChannel: dto.preferredChannel }),
        ...(dto.language && { language: dto.language }),
        ...(dto.campaignId && { campaignId: dto.campaignId }),
        ...(dto.optedOutAt !== undefined && {
          optedOutAt: dto.optedOutAt ? new Date(dto.optedOutAt) : null,
        }),
        ...(dto.dataDeletedAt !== undefined && {
          dataDeletedAt: dto.dataDeletedAt ? new Date(dto.dataDeletedAt) : null,
        }),
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          select: {
            id: true,
            type: true,
            status: true,
            rating: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete de un paciente (GDPR compliance)
   */
  async remove(patientId: string, workspaceId: string) {
    // Verificar que el paciente existe y pertenece al workspace
    await this.findOne(patientId, workspaceId);

    await this.prisma.patient.update({
      where: { id: patientId },
      data: {
        dataDeletedAt: new Date(),
      },
    });

    return {
      message: 'Paciente eliminado exitosamente',
    };
  }

  /**
   * Marcar paciente como opted-out (no enviar más mensajes)
   */
  async optOut(patientId: string, workspaceId: string) {
    // Verificar que el paciente existe y pertenece al workspace
    await this.findOne(patientId, workspaceId);

    return this.prisma.patient.update({
      where: { id: patientId },
      data: {
        optedOutAt: new Date(),
      },
    });
  }

  /**
   * Obtener estadísticas de pacientes por workspace
   */
  async getStats(workspaceId: string) {
    const [total, withConsent, optedOut, deleted] = await Promise.all([
      this.prisma.patient.count({
        where: { workspaceId, dataDeletedAt: null },
      }),
      this.prisma.patient.count({
        where: { workspaceId, hasConsent: true, dataDeletedAt: null },
      }),
      this.prisma.patient.count({
        where: {
          workspaceId,
          optedOutAt: { not: null },
          dataDeletedAt: null,
        },
      }),
      this.prisma.patient.count({
        where: { workspaceId, dataDeletedAt: { not: null } },
      }),
    ]);

    return {
      total,
      withConsent,
      withoutConsent: total - withConsent,
      optedOut,
      deleted,
    };
  }
}
