'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart } from 'lucide-react';
import { analyticsService } from '../../services/analytics.service';
import { usePatientStats } from '../../hooks/use-patients';

interface CampaignStatsProps {
  workspaceId: string;
}

function getNpsLabel(nps: number): string {
  if (nps >= 70) return 'Excelente reputación';
  if (nps >= 50) return 'Buena reputación';
  if (nps >= 0) return 'Reputación neutral';
  return 'Reputación negativa';
}

function getNpsColor(nps: number): string {
  if (nps >= 50) return 'text-green-500';
  if (nps >= 0) return 'text-yellow-500';
  return 'text-red-500';
}

export function CampaignStats({ workspaceId }: CampaignStatsProps) {
  const { data: patientStats } = usePatientStats(workspaceId);

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'workspace', workspaceId],
    queryFn: () => analyticsService.getWorkspaceAnalytics(workspaceId),
    enabled: !!workspaceId,
  });

  const totalPatients = patientStats?.total ?? 0;
  const responseRate = analytics?.overview.responseRate ?? 0;
  const npsScore = analytics?.overview.npsScore ?? 0;
  const hasAnalytics = !!analytics && analytics.overview.totalMessages > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Pacientes Activos
          </CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPatients}</div>
          <p className="text-xs text-muted-foreground">
            {patientStats
              ? `${patientStats.withConsent} con consentimiento`
              : '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tasa de Respuesta
          </CardTitle>
          <div className="h-4 w-4 text-muted-foreground font-bold text-sm">
            %
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {hasAnalytics ? `${responseRate.toFixed(1)}%` : '—'}
          </div>
          <p className="text-xs text-muted-foreground">
            {hasAnalytics
              ? `${analytics.overview.totalResponses} de ${analytics.overview.totalMessages} mensajes`
              : 'Sin mensajes aún'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">NPS Global</CardTitle>
          <div
            className={`text-2xl font-bold ${hasAnalytics ? getNpsColor(npsScore) : 'text-muted-foreground'}`}
          >
            {hasAnalytics ? npsScore : '—'}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {hasAnalytics ? getNpsLabel(npsScore) : 'Sin calificaciones aún'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
