import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@reputation-manager/database';
import { GooglePlacesService } from '@reputation-manager/integrations';
import { CreatePracticeDto, UpdatePracticeDto } from './dto';

@Injectable()
export class PracticesService {
  constructor(
    private prisma: PrismaService,
    private googlePlacesService: GooglePlacesService,
  ) {}

  /**
   * Obtener todas las practices de un workspace
   */
  async findAll(workspaceId: string) {
    return this.prisma.practice.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Crear una nueva practice
   */
  async create(workspaceId: string, dto: CreatePracticeDto) {
    return this.prisma.practice.create({
      data: {
        ...dto,
        workspaceId,
      },
    });
  }

  /**
   * Obtener una practice específica
   */
  async findOne(practiceId: string, workspaceId: string) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
    });

    if (!practice) {
      throw new NotFoundException('Práctica no encontrada');
    }

    // Verificar que pertenezca al workspace correcto
    if (practice.workspaceId !== workspaceId) {
      throw new ForbiddenException('No tienes acceso a esta práctica');
    }

    return practice;
  }

  /**
   * Actualizar una practice
   */
  async update(
    practiceId: string,
    workspaceId: string,
    dto: UpdatePracticeDto,
  ) {
    // Primero verificar que exista y pertenezca al workspace
    await this.findOne(practiceId, workspaceId);

    return this.prisma.practice.update({
      where: { id: practiceId },
      data: dto,
    });
  }

  /**
   * Eliminar una practice
   */
  async remove(practiceId: string, workspaceId: string) {
    // Primero verificar que exista y pertenezca al workspace
    await this.findOne(practiceId, workspaceId);

    await this.prisma.practice.delete({
      where: { id: practiceId },
    });

    return {
      message: 'Práctica eliminada exitosamente',
    };
  }

  /**
   * Buscar consultorios en Google Places
   */
  async searchGooglePlaces(
    query: string,
    location?: { lat: number; lng: number },
  ) {
    return this.googlePlacesService.searchPlaces(query, location);
  }

  /**
   * Obtener detalles de un lugar de Google Places
   */
  async getGooglePlaceDetails(placeId: string) {
    return this.googlePlacesService.getPlaceDetails(placeId);
  }

  /**
   * Autocompletar búsqueda de lugares
   */
  async autocompleteGooglePlaces(
    input: string,
    location?: { lat: number; lng: number },
  ) {
    return this.googlePlacesService.autocomplete(input, location);
  }
}
