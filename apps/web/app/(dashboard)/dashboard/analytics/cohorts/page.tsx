'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import dynamic from 'next/dynamic';

const CohortTable = dynamic(
  () =>
    import('../../../../../components/analytics/cohort-table').then(
      (m) => m.CohortTable,
    ),
  { ssr: false },
);
const TrendsChart = dynamic(
  () =>
    import('../../../../../components/analytics/trends-chart').then(
      (m) => m.TrendsChart,
    ),
  { ssr: false },
);
import { analyticsService } from '../../../../../services/analytics.service';
import { useCurrentWorkspace } from '../../../../../hooks/use-workspaces';

export default function CohortsPage() {
  const { data: workspace } = useCurrentWorkspace();
  const [months, setMonths] = useState(6);

  // Query cohort analysis
  const { data: cohortData, isLoading: isLoadingCohorts } = useQuery({
    queryKey: ['cohorts', workspace?.id, months],
    queryFn: () => {
      if (!workspace?.id) throw new Error('No workspace');
      return analyticsService.getCohortAnalysis(workspace.id, months);
    },
    enabled: !!workspace?.id,
  });

  // Query trends
  const { data: trendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['trends', workspace?.id, months],
    queryFn: () => {
      if (!workspace?.id) throw new Error('No workspace');
      return analyticsService.getResponseRateTrends(workspace.id, months);
    },
    enabled: !!workspace?.id,
  });

  const isLoading = isLoadingCohorts || isLoadingTrends;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Análisis de Cohortes</h1>
            <p className="text-muted-foreground">
              Tendencias y métricas por mes
            </p>
          </div>
        </div>

        <Select
          value={months.toString()}
          onValueChange={(v) => setMonths(parseInt(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 meses</SelectItem>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">12 meses</SelectItem>
            <SelectItem value="24">24 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Card className="animate-pulse">
            <CardHeader className="h-16 bg-muted/50" />
            <CardContent className="h-64 bg-muted/30" />
          </Card>
          <Card className="animate-pulse">
            <CardHeader className="h-16 bg-muted/50" />
            <CardContent className="h-48 bg-muted/30" />
          </Card>
        </div>
      )}

      {/* Summary cards */}
      {cohortData && cohortData.cohorts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Mensajes
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cohortData.cohorts
                  .reduce((sum, c) => sum + c.totalMessages, 0)
                  .toLocaleString('es-EC')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En los últimos {months} meses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Promedio Tasa Resp.
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const withData = cohortData.cohorts.filter(
                    (c) => c.totalMessages > 0,
                  );
                  if (withData.length === 0) return '0.0%';
                  const avg =
                    withData.reduce((s, c) => s + c.responseRate, 0) /
                    withData.length;
                  return `${avg.toFixed(1)}%`;
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Promedio entre meses con actividad
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Promedio NPS
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const withData = cohortData.cohorts.filter(
                    (c) => c.totalResponses > 0,
                  );
                  if (withData.length === 0) return '—';
                  const avg =
                    withData.reduce((s, c) => s + c.npsScore, 0) /
                    withData.length;
                  return Math.round(avg);
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {cohortData.trends.npsTrend === 'up'
                  ? 'Tendencia al alza'
                  : cohortData.trends.npsTrend === 'down'
                    ? 'Tendencia a la baja'
                    : 'Tendencia estable'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Chart */}
      {trendsData && trendsData.length > 0 && <TrendsChart data={trendsData} />}

      {/* Cohort Table */}
      {cohortData && (
        <CohortTable cohorts={cohortData.cohorts} trends={cohortData.trends} />
      )}

      {/* Empty state */}
      {!isLoading &&
        cohortData &&
        cohortData.cohorts.every((c) => c.totalMessages === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Sin datos de cohortes</h3>
              <p className="text-muted-foreground mt-1">
                Los datos aparecerán cuando comiences a enviar mensajes en
                campañas
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
