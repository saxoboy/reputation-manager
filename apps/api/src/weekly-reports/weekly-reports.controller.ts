import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WeeklyReportsService } from './weekly-reports.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { UserRole } from '@prisma/client';
import { UpdateWeeklyReportConfigDto, TestWeeklyReportDto } from './dto';

@Controller('workspaces/:workspaceId/weekly-reports')
@UseGuards(AuthGuard, WorkspaceGuard)
export class WeeklyReportsController {
  constructor(private readonly weeklyReportsService: WeeklyReportsService) {}

  /**
   * GET /workspaces/:workspaceId/weekly-reports/config
   * Obtener configuración de reportes semanales
   */
  @Get('config')
  async getConfig(@CurrentWorkspace('id') workspaceId: string) {
    return this.weeklyReportsService.getConfig(workspaceId);
  }

  /**
   * PUT /workspaces/:workspaceId/weekly-reports/config
   * Actualizar configuración de reportes semanales
   * Solo OWNER puede cambiar la configuración
   */
  @Put('config')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER)
  async updateConfig(
    @CurrentWorkspace('id') workspaceId: string,
    @Body() dto: UpdateWeeklyReportConfigDto,
  ) {
    return this.weeklyReportsService.updateConfig(workspaceId, dto);
  }

  /**
   * POST /workspaces/:workspaceId/weekly-reports/test
   * Enviar reporte de prueba inmediatamente
   * Solo OWNER puede enviar tests
   */
  @Post('test')
  @UseGuards(RoleGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  async sendTestReport(
    @CurrentWorkspace('id') workspaceId: string,
    @CurrentWorkspace('name') workspaceName: string,
    @Body() dto: TestWeeklyReportDto,
  ) {
    return this.weeklyReportsService.sendTestReport(
      workspaceId,
      workspaceName,
      dto.testEmail,
    );
  }
}
