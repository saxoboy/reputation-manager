'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDateTime } from '../../lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Building2, MessageSquare, Upload } from 'lucide-react';
import { Campaign, CampaignStatus } from '../../types/mock-types';
import { CsvUploadDialog } from './csv-upload-dialog';
import { PaginationControls } from '../ui/pagination-controls';
import { CreateCampaignDialog } from './create-campaign-dialog';

interface CampaignsListProps {
  campaigns: Campaign[];
  workspaceId: string;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function CampaignsList({
  campaigns,
  workspaceId,
  pagination,
}: CampaignsListProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );

  const handleOpenUpload = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setUploadDialogOpen(true);
  };
  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<
      CampaignStatus,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      DRAFT: 'secondary',
      ACTIVE: 'default',
      PAUSED: 'destructive',
      COMPLETED: 'outline',
    };

    const labels: Record<CampaignStatus, string> = {
      DRAFT: 'Borrador',
      ACTIVE: 'Activa',
      PAUSED: 'Pausada',
      COMPLETED: 'Completada',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campañas Recientes</CardTitle>
        <CardDescription>
          Gestiona y monitorea el estado de tus campañas de feedback.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {' '}
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No hay campañas aún
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Crea tu primera campaña para comenzar a recopilar feedback.
              </p>
            </div>
            <CreateCampaignDialog workspaceId={workspaceId} />
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {campaign.practiceName}
                      </div>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div>
                      <p className="text-muted-foreground">Pacientes</p>
                      <p className="font-medium">{campaign.patientsCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Respuestas</p>
                      <p className="font-medium">
                        {campaign.respondedCount}
                        <span className="text-muted-foreground ml-0.5">
                          (
                          {campaign.patientsCount > 0
                            ? Math.round(
                                (campaign.respondedCount /
                                  campaign.patientsCount) *
                                  100,
                              )
                            : 0}
                          %)
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">NPS</p>
                      <p
                        className={`font-medium ${campaign.nps >= 50 ? 'text-green-600' : campaign.nps > 0 ? 'text-yellow-600' : ''}`}
                      >
                        {campaign.nps > 0 ? campaign.nps : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenUpload(campaign)}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      Importar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/dashboard/campaigns/${campaign.id}`}>
                        Ver Detalles
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pacientes</TableHead>
                    <TableHead>Respuestas</TableHead>
                    <TableHead>NPS</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <div>{campaign.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {campaign.practiceName}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>{campaign.patientsCount}</TableCell>
                      <TableCell>
                        {campaign.respondedCount}
                        <span className="text-xs text-muted-foreground ml-1">
                          (
                          {campaign.patientsCount > 0
                            ? Math.round(
                                (campaign.respondedCount /
                                  campaign.patientsCount) *
                                  100,
                              )
                            : 0}
                          %)
                        </span>
                      </TableCell>
                      <TableCell>
                        {campaign.nps > 0 ? (
                          <span
                            className={
                              campaign.nps >= 50
                                ? 'text-green-600 font-medium'
                                : 'text-yellow-600'
                            }
                          >
                            {campaign.nps}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(campaign.createdAt)}
                      </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenUpload(campaign)}
                        >
                          <Upload className="h-4 w-4" />
                          <span className="ml-1">Importar CSV</span>
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/dashboard/campaigns/${campaign.id}`}>
                            Ver Detalles
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        {pagination && (
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
          />
        )}
        {selectedCampaign && (
          <CsvUploadDialog
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            campaignId={selectedCampaign.id}
            workspaceId={workspaceId}
            campaignName={selectedCampaign.name}
            onUploadSuccess={() => {
              // Refrescar lista de campaigns
              window.location.reload();
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
