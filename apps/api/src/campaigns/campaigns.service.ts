import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { CreateCampaignDto, UpdateCampaignDto, UploadCsvDto } from './dto';
import { parsePatientsCSV } from '@reputation-manager/shared-utils';

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
   * Upload CSV de pacientes y crear pacientes en bulk
   */
  async uploadCsv(
    campaignId: string,
    workspaceId: string,
    uploadDto: UploadCsvDto,
  ) {
    // Verificar que la campaña existe y pertenece al workspace
    const campaign = await this.findOne(campaignId, workspaceId);

    // Parsear CSV
    const parseResult = parsePatientsCSV(uploadDto.csvContent, {
      skipHeader: true,
      delimiter: uploadDto.delimiter || ',',
    });

    // Si hay errores críticos (no se pudo parsear), lanzar excepción
    if (parseResult.errors.length > 0 && parseResult.validRows === 0) {
      throw new BadRequestException({
        message: 'El archivo CSV contiene errores y no se pudo procesar',
        errors: parseResult.errors,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
      });
    }

    // Crear pacientes válidos en bulk
    const createdPatients = await this.prisma.$transaction(
      parseResult.patients.map((patient) =>
        this.prisma.patient.create({
          data: {
            name: patient.name,
            phone: patient.phone,
            email: patient.email,
            appointmentTime: patient.appointmentTime,
            appointmentType: patient.appointmentType,
            hasConsent: patient.hasConsent,
            campaignId,
            workspaceId,
          },
        }),
      ),
    );

    return {
      message: 'CSV procesado exitosamente',
      summary: {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        patientsCreated: createdPatients.length,
      },
      patients: createdPatients,
      errors: parseResult.errors.length > 0 ? parseResult.errors : undefined,
    };
  }
}
