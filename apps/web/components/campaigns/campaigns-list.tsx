'use client';

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
import { Building2 } from 'lucide-react';
import { Campaign, CampaignStatus } from '../../types/mock-types';

interface CampaignsListProps {
  campaigns: Campaign[];
}

export function CampaignsList({ campaigns }: CampaignsListProps) {
  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<CampaignStatus, "default" | "secondary" | "destructive" | "outline"> = {
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
                <TableCell>
                  {getStatusBadge(campaign.status)}
                </TableCell>
                <TableCell>{campaign.patientsCount}</TableCell>
                <TableCell>
                  {campaign.respondedCount}
                  <span className="text-xs text-muted-foreground ml-1">
                     ({campaign.patientsCount > 0 ? Math.round((campaign.respondedCount / campaign.patientsCount) * 100) : 0}%)
                  </span>
                </TableCell>
                <TableCell>
                  {campaign.nps > 0 ? (
                    <span className={campaign.nps >= 50 ? "text-green-600 font-medium" : "text-yellow-600"}>
                      {campaign.nps}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {campaign.createdAt}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Ver Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
