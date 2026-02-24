import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { CreateCampaignDto, UpdateCampaignDto, UploadCsvDto } from './dto';
import {
  parsePatientsCSV,
  normalizeEcuadorPhone,
  ParsedPatient,
  CsvValidationError,
} from '@reputation-manager/shared-utils';
import { PaginatedResponse } from '@reputation-manager/shared-types';
import { BillingService } from '../billing/billing.service';
import { RedisCacheService } from '../cache/redis-cache.service';
import * as ExcelJS from 'exceljs';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
    private cache: RedisCacheService,
  ) {}

  /**
   * Obtener todas las campañas de un workspace (paginado)
   */
  async findAll(
    workspaceId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<unknown>> {
    const skip = (page - 1) * limit;
    const where = { workspaceId };
    const include = {
      practice: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          patients: { where: { dataDeletedAt: null } },
          messages: true,
        },
      },
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Verificación ligera de permisos (sin cargar pacientes ni mensajes)
   */
  private async verifyOwnership(
    campaignId: string,
    workspaceId: string,
  ): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { workspaceId: true },
    });
    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }
    if (campaign.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a esta campaña');
    }
  }

  /**
   * Obtener solo el nombre de una campaña (para el export filename)
   */
  async findNameOnly(
    campaignId: string,
    workspaceId: string,
  ): Promise<{ name: string }> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { name: true, workspaceId: true },
    });
    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }
    if (campaign.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a esta campaña');
    }
    return { name: campaign.name };
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
            patients: { where: { dataDeletedAt: null } },
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
  async create(
    workspaceId: string,
    workspaceUserId: string,
    dto: CreateCampaignDto,
  ) {
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
        createdById: workspaceUserId,
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
            patients: { where: { dataDeletedAt: null } },
            messages: true,
          },
        },
      },
    });

    await this.cache.delByPattern(`analytics:ws:${workspaceId}:*`);
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
    // Verificar que exista y pertenezca al workspace (sin cargar pacientes)
    await this.verifyOwnership(campaignId, workspaceId);

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
            patients: { where: { dataDeletedAt: null } },
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
    // Verificar que exista y pertenezca al workspace (sin cargar pacientes)
    await this.verifyOwnership(campaignId, workspaceId);

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
    // Verificar que la campaña existe y pertenece al workspace (sin cargar pacientes)
    await this.verifyOwnership(campaignId, workspaceId);

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

    // Deduplicar por teléfono: obtener teléfonos existentes en la campaña
    const existingPatients = await this.prisma.patient.findMany({
      where: { campaignId, dataDeletedAt: null },
      select: { phone: true },
    });

    const existingPhones = new Set(
      existingPatients.map((p) => normalizeEcuadorPhone(p.phone)),
    );

    // Deduplicar también dentro del mismo batch por teléfono
    const batchPhones = new Set<string>();
    const uniquePatients: ParsedPatient[] = [];
    let duplicatesSkipped = 0;

    for (const patient of parseResult.patients) {
      const phone = patient.phone; // ya normalizado por parsePatientsCSV
      if (existingPhones.has(phone) || batchPhones.has(phone)) {
        duplicatesSkipped++;
      } else {
        batchPhones.add(phone);
        uniquePatients.push(patient);
      }
    }

    // Crear pacientes únicos en bulk
    const createdPatients = await this.prisma.$transaction(
      uniquePatients.map((patient) =>
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
      duplicatesSkipped,
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
    // Verificar que la campaña existe y pertenece al workspace (sin cargar pacientes)
    await this.verifyOwnership(campaignId, workspaceId);

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

  /**
   * Genera una plantilla Excel (.xlsx) con columnas y datos de ejemplo
   */
  async getExcelTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pacientes');

    sheet.columns = [
      { header: 'Nombre Completo', key: 'name', width: 28 },
      { header: 'Teléfono', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Fecha y Hora de Cita', key: 'appointmentTime', width: 24 },
      { header: 'Tipo de Cita', key: 'appointmentType', width: 22 },
      { header: 'Tiene Consentimiento', key: 'hasConsent', width: 22 },
    ];

    // Estilo para la cabecera
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F4FD' },
    };

    // Filas de ejemplo
    sheet.addRow({
      name: 'Ana María García',
      phone: '0998765432',
      email: 'ana.garcia@gmail.com',
      appointmentTime: '2026-03-15T09:00:00',
      appointmentType: 'Consulta General',
      hasConsent: 'true',
    });
    sheet.addRow({
      name: 'Carlos Andrés Morales',
      phone: '0987654321',
      email: 'carlos.morales@yahoo.com',
      appointmentTime: '2026-03-15T10:30:00',
      appointmentType: 'Control Anual',
      hasConsent: 'true',
    });
    sheet.addRow({
      name: 'María Elena Torres',
      phone: '0976543210',
      email: '',
      appointmentTime: '2026-03-16T08:00:00',
      appointmentType: 'Limpieza Dental',
      hasConsent: 'true',
    });

    // Nota informativa al final
    sheet.addRow([]);
    const noteRow = sheet.addRow([
      '* Teléfono: formato 0999999999 o +593999999999',
    ]);
    noteRow.font = { italic: true, color: { argb: 'FF666666' } };
    const dateRow = sheet.addRow([
      '* Fecha y Hora: formato YYYY-MM-DDTHH:mm:ss  (ej: 2026-03-15T09:00:00)',
    ]);
    dateRow.font = { italic: true, color: { argb: 'FF666666' } };
    const consentRow = sheet.addRow([
      '* Consentimiento: escribir  true  para autorizar el envío de mensajes',
    ]);
    consentRow.font = { italic: true, color: { argb: 'FF666666' } };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Parsea un archivo Excel con AI (Claude Haiku) y retorna pacientes normalizados
   */
  async parseExcelWithAI(
    campaignId: string,
    workspaceId: string,
    base64Content: string,
  ): Promise<{ patients: ParsedPatient[]; errors: CsvValidationError[] }> {
    // Verificar que la campaña existe y pertenece al workspace (sin cargar pacientes)
    await this.verifyOwnership(campaignId, workspaceId);

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new InternalServerErrorException(
        'ANTHROPIC_API_KEY no está configurada en el servidor',
      );
    }

    try {
      // 1. Decodificar base64 → Buffer → Excel
      const decoded = Buffer.from(base64Content, 'base64');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(decoded as unknown as ArrayBuffer);

      const sheet = workbook.worksheets[0];
      if (!sheet) {
        throw new BadRequestException(
          'El archivo Excel no contiene hojas de datos',
        );
      }

      // 2. Extraer cabeceras y filas como JSON crudo
      const rows: Record<string, string>[] = [];
      let headers: string[] = [];

      const pad = (n: number) => String(n).padStart(2, '0');
      const formatCellValue = (v: unknown): string => {
        if (v == null) return '';
        // exceljs devuelve celdas de fecha como Date objects.
        // Usamos métodos UTC para preservar el valor exacto sin conversión de zona horaria.
        if (v instanceof Date) {
          return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}T${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}:${pad(v.getUTCSeconds())}`;
        }
        return String(v);
      };

      sheet.eachRow((row, rowNumber) => {
        const values = row.values as unknown[];
        // row.values[0] es undefined (exceljs es 1-indexed)
        const cells = values.slice(1).map(formatCellValue);

        if (rowNumber === 1) {
          headers = cells;
        } else {
          // Ignorar filas vacías
          if (cells.some((c) => c.trim() !== '')) {
            const rowObj: Record<string, string> = {};
            headers.forEach((h, i) => {
              rowObj[h] = cells[i] ?? '';
            });
            rows.push(rowObj);
          }
        }
      });

      if (rows.length === 0) {
        throw new BadRequestException(
          'El archivo Excel no contiene datos de pacientes',
        );
      }

      // 3. Llamar a Claude Haiku con tool_use para structured output
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const rawData = JSON.stringify({ headers, rows }, null, 2);

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        tools: [
          {
            name: 'import_patients',
            description:
              'Mapea los datos del Excel a la estructura estándar de pacientes',
            input_schema: {
              type: 'object' as const,
              properties: {
                patients: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Nombre completo del paciente',
                      },
                      phone: {
                        type: 'string',
                        description:
                          'Teléfono. Normaliza a formato ecuatoriano: si empieza en 0 y tiene 10 dígitos → +593XXXXXXXXX. Si ya tiene +593 → dejarlo igual.',
                      },
                      email: {
                        type: 'string',
                        description: 'Email del paciente (puede estar vacío)',
                      },
                      appointmentTime: {
                        type: 'string',
                        description:
                          'Fecha y hora en formato ISO 8601: YYYY-MM-DDTHH:mm:ss. Convierte el formato de fecha si es necesario pero NUNCA cambies la hora — copia el valor de hora exactamente como aparece en los datos originales, sin conversión de zona horaria.',
                      },
                      appointmentType: {
                        type: 'string',
                        description: 'Tipo de cita (puede estar vacío)',
                      },
                      hasConsent: {
                        type: 'boolean',
                        description:
                          'Consentimiento. true si el valor es: true, si, sí, 1, yes. false en cualquier otro caso.',
                      },
                    },
                    required: [
                      'name',
                      'phone',
                      'appointmentTime',
                      'hasConsent',
                    ],
                  },
                },
              },
              required: ['patients'],
            },
          },
        ],
        tool_choice: { type: 'any' },
        messages: [
          {
            role: 'user',
            content: `Eres un asistente que importa datos de pacientes desde Excel.
Analiza los siguientes datos crudos del Excel y mapea cada fila al formato estándar de paciente.
Las columnas pueden estar en español, inglés o con nombres no estándar — infiere el significado correcto.
Normaliza teléfonos ecuatorianos: formato 0XXXXXXXXX (10 dígitos) → +593XXXXXXXXX.
Normaliza fechas a formato ISO 8601 (YYYY-MM-DDTHH:mm:ss) PERO copia la hora EXACTAMENTE como aparece, sin ninguna conversión de zona horaria. Si el Excel dice 09:00, el output debe decir 09:00.
Ignora filas que sean notas o comentarios (ej: filas que empiecen con *).

Datos del Excel:
${rawData}`,
          },
        ],
      });

      // 4. Extraer resultado del tool_use
      const toolUse = message.content.find((c) => c.type === 'tool_use');
      if (!toolUse || toolUse.type !== 'tool_use') {
        throw new InternalServerErrorException(
          'La IA no pudo procesar el archivo Excel',
        );
      }

      const aiResult = toolUse.input as {
        patients: {
          name: string;
          phone: string;
          email?: string;
          appointmentTime: string;
          appointmentType?: string;
          hasConsent: boolean;
        }[];
      };

      // 5. Convertir a CSV y validar con el parser existente
      const csvLines = [
        'name,phone,email,appointmentTime,appointmentType,hasConsent',
        ...aiResult.patients.map((p) => {
          const name = (p.name ?? '').replace(/,/g, ' ');
          const phone = (p.phone ?? '').replace(/,/g, '');
          const email = (p.email ?? '').replace(/,/g, '');
          const time = (p.appointmentTime ?? '').replace(/,/g, '');
          const type = (p.appointmentType ?? '').replace(/,/g, ' ');
          const consent = p.hasConsent ? 'true' : 'false';
          return `${name},${phone},${email},${time},${type},${consent}`;
        }),
      ];
      const csvContent = csvLines.join('\n');
      const parseResult = parsePatientsCSV(csvContent, { skipHeader: true });

      return {
        patients: parseResult.patients,
        errors: parseResult.errors,
      };
    } catch (error) {
      // Re-throw NestJS HTTP exceptions (BadRequestException, etc.) unchanged
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error('[parseExcelWithAI] Error:', message, error);
      throw new InternalServerErrorException(
        `Error procesando el archivo Excel: ${message}`,
      );
    }
  }
}
