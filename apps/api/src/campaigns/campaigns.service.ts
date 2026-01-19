import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { CreateCampaignDto, UpdateCampaignDto } from './dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todas las campañas de un workspace
   */
  async findAll(workspaceId: string) {
    return this.prisma.campaign.findMany({
      where: { workspaceId },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            patients: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener una campaña específica
   */
  async findOne(campaignId: string, workspaceId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            googlePlaceId: true,
          },
        },
        patients: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        _count: {
          select: {
            patients: true,
            messages: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    // Verificar que pertenezca al workspace correcto
    if (campaign.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a esta campaña');
    }

    return campaign;
  }

  /**
   * Crear una nueva campaña
   */
  async create(workspaceId: string, userId: string, dto: CreateCampaignDto) {
    // Verificar que la práctica pertenezca al workspace
    const practice = await this.prisma.practice.findUnique({
      where: { id: dto.practiceId },
    });

    if (!practice || practice.workspaceId !== workspaceId) {
      throw new BadRequestException(
        'La práctica no existe o no pertenece a este workspace',
      );
    }

    // Crear la campaña con sus pacientes
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        scheduledHoursAfter: dto.scheduledHoursAfter || 2,
        workspaceId,
        practiceId: dto.practiceId,
        createdById: userId,
        patients: {
          create: dto.patients.map((patient) => ({
            ...patient,
            workspaceId,
            campaignId: undefined, // Se asigna automáticamente
          })),
        },
      },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            patients: true,
            messages: true,
          },
        },
      },
    });

    return campaign;
  }

  /**
   * Actualizar una campaña
   */
  async update(
    campaignId: string,
    workspaceId: string,
    dto: UpdateCampaignDto,
  ) {
    // Primero verificar que exista y pertenezca al workspace
    await this.findOne(campaignId, workspaceId);

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: dto,
      include: {
        practice: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            patients: true,
            messages: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar una campaña
   */
  async remove(campaignId: string, workspaceId: string) {
    // Primero verificar que exista y pertenezca al workspace
    await this.findOne(campaignId, workspaceId);

    await this.prisma.campaign.delete({
      where: { id: campaignId },
    });

    return {
      message: 'Campaña eliminada exitosamente',
    };
  }

  /**
   * Upload CSV de pacientes (placeholder - implementar parsing)
   */
  async uploadCsv(campaignId: string, workspaceId: string) {
    // Verificar que la campaña existe
    await this.findOne(campaignId, workspaceId);

    // TODO: Implementar parsing de CSV
    // TODO: Recibir archivo como parámetro cuando se implemente
    // Por ahora retornamos un placeholder
    throw new BadRequestException(
      'Upload de CSV aún no implementado - próximamente',
    );
  }
}
