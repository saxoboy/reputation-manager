import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los templates de un workspace
   */
  async findAll(workspaceId: string) {
    return this.prisma.template.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener un template específico
   */
  async findOne(templateId: string, workspaceId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Verificar que pertenezca al workspace correcto
    if (template.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a esta plantilla');
    }

    return template;
  }

  /**
   * Crear un nuevo template
   */
  async create(workspaceId: string, dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        ...dto,
        workspaceId,
        variables: dto.variables || [],
      },
    });
  }

  /**
   * Actualizar un template
   */
  async update(
    templateId: string,
    workspaceId: string,
    dto: UpdateTemplateDto,
  ) {
    // Primero verificar que exista y pertenezca al workspace
    await this.findOne(templateId, workspaceId);

    return this.prisma.template.update({
      where: { id: templateId },
      data: dto,
    });
  }

  /**
   * Eliminar un template
   */
  async remove(templateId: string, workspaceId: string) {
    // Primero verificar que exista y pertenezca al workspace
    await this.findOne(templateId, workspaceId);

    await this.prisma.template.delete({
      where: { id: templateId },
    });

    return {
      message: 'Plantilla eliminada exitosamente',
    };
  }

  /**
   * Duplicar un template
   */
  async duplicate(templateId: string, workspaceId: string) {
    // Obtener el template original
    const original = await this.findOne(templateId, workspaceId);

    // Crear una copia
    return this.prisma.template.create({
      data: {
        name: `${original.name} (Copia)`,
        type: original.type,
        content: original.content,
        variables: original.variables,
        workspaceId,
      },
    });
  }
}
