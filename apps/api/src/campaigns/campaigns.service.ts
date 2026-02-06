import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { CreateCampaignDto, UpdateCampaignDto, UploadCsvDto } from './dto';
import { parsePatientsCSV } from '@reputation-manager/shared-utils';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

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
    await this.findOne(campaignId, workspaceId);

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

    // IMPORTANT: Verificar si el workspace tiene suficientes créditos ANTES de crear pacientes
    const requiredCredits = parseResult.validRows;
    const creditCheck = await this.billingService.canSendMessage(
      workspaceId,
      requiredCredits,
    );

    if (!creditCheck.canSend) {
      throw new ForbiddenException({
        message: 'Créditos insuficientes para procesar esta campaña',
        details: {
          required: requiredCredits,
          available: creditCheck.remainingCredits,
          deficit: requiredCredits - creditCheck.remainingCredits,
          plan: creditCheck.plan || 'FREE',
          suggestion:
            creditCheck.plan === 'FREE'
              ? 'Actualiza tu plan para obtener más créditos incluidos'
              : 'Compra créditos adicionales o actualiza tu plan',
          billingUrl: '/dashboard/billing',
        },
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

  /**
   * Exportar datos de una campaña en formato CSV
   */
  async exportCampaignCsv(
    campaignId: string,
    workspaceId: string,
  ): Promise<string> {
    // Verificar que la campaña existe y pertenece al workspace
    await this.findOne(campaignId, workspaceId);

    // Obtener pacientes con sus mensajes
    const patients = await this.prisma.patient.findMany({
      where: {
        campaignId,
        workspaceId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Generar CSV
    const headers = [
      'Nombre',
      'Teléfono',
      'Email',
      'Fecha de Cita',
      'Tipo de Cita',
      'Estado',
      'Mensajes Enviados',
      'Respuesta',
      'Rating',
      'Fecha de Respuesta',
      'Consentimiento',
    ];

    const rows = patients.map((patient) => {
      const responseMessage = patient.messages.find((m) => m.repliedAt);

      // Calcular estado del paciente
      let status = 'PENDING';
      if (responseMessage) {
        status = 'RESPONDED';
      } else if (patient.messages.length > 0) {
        status = 'SENT';
      }

      return [
        patient.name,
        patient.phone,
        patient.email || '',
        patient.appointmentTime.toISOString(),
        patient.appointmentType || '',
        status,
        patient.messages.length.toString(),
        responseMessage?.feedback || '',
        responseMessage?.rating?.toString() || '',
        responseMessage?.repliedAt?.toISOString() || '',
        patient.hasConsent ? 'Sí' : 'No',
      ];
    });

    // Construir CSV manualmente
    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','),
      ),
    ];

    return csvLines.join('\n');
  }
}
