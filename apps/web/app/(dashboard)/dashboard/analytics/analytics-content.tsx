'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import Link from 'next/link';

import {
  TrendingUp,
  MessageSquare,
  Star,
  BarChart3,
  Users,
  CheckCircle,
  GitCompareArrows,
  Calendar,
  BarChart2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../../../services/analytics.service';
import { practiceService } from '../../../../services/practice.service';
import dynamic from 'next/dynamic';

const TimelineChart = dynamic(
  () =>
    import('../../../../components/analytics/timeline-chart').then(
      (m) => m.TimelineChart,
    ),
  { ssr: false },
);
const RatingDistributionChart = dynamic(
  () =>
    import('../../../../components/analytics/rating-distribution-chart').then(
      (m) => m.RatingDistributionChart,
    ),
  { ssr: false },
);
const SentimentChart = dynamic(
  () =>
    import('../../../../components/analytics/sentiment-chart').then(
      (m) => m.SentimentChart,
    ),
  { ssr: false },
);
import { AnalyticsFilters } from '../../../../components/analytics/analytics-filters';
import { ExportButtons } from '../../../../components/analytics/export-buttons';
import { useCurrentWorkspace } from '../../../../hooks/use-workspaces';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function KpiCard({ title, value, description, icon, trend }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={`flex items-center mt-2 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 mr-1 ${
                !trend.isPositive ? 'rotate-180' : ''
              }`}
            />
            <span>
              {trend.isPositive ? '+' : ''}
              {trend.value}% vs mes anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data: workspace } = useCurrentWorkspace();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedPracticeId, setSelectedPracticeId] = useState<
    string | undefined
  >();

  // Obtener lista de practices
  const { data: practices = [] } = useQuery({
    queryKey: ['practices', workspace?.id],
    queryFn: () => {
      if (!workspace?.id) throw new Error('No workspace');
      return practiceService.getAll(workspace.id);
    },
    enabled: !!workspace?.id,
  });

  // Determinar si usar práctica específica o workspace
  const usePracticeAnalytics =
    selectedPracticeId && selectedPracticeId !== 'all';

  // Query para analytics del workspace
  const { data: workspaceAnalytics, isLoading: isLoadingWorkspace } = useQuery({
    queryKey: [
      'analytics',
      'workspace',
      workspace?.id,
      dateRange?.from,
      dateRange?.to,
    ],
    queryFn: () => {
      if (!workspace?.id) throw new Error('No workspace');
      return analyticsService.getWorkspaceAnalytics(
        workspace.id,
        dateRange?.from,
        dateRange?.to,
      );
    },
    enabled: !!workspace?.id && !usePracticeAnalytics,
  });

  // Query para analytics de practice
  const { data: practiceAnalytics, isLoading: isLoadingPractice } = useQuery({
    queryKey: [
      'analytics',
      'practice',
      workspace?.id,
      selectedPracticeId,
      dateRange?.from,
      dateRange?.to,
    ],
    queryFn: () => {
      if (!workspace?.id || !selectedPracticeId) throw new Error('Invalid');
      return analyticsService.getPracticeAnalytics(
        workspace.id,
        selectedPracticeId,
        dateRange?.from,
        dateRange?.to,
      );
    },
    enabled: Boolean(
      workspace?.id && selectedPracticeId && usePracticeAnalytics,
    ),
  });

  const isLoading = isLoadingWorkspace || isLoadingPractice;

  // Usar los datos correctos según el filtro
  const analytics = usePracticeAnalytics
    ? practiceAnalytics
    : workspaceAnalytics;

  const handleClearFilters = () => {
    setDateRange(undefined);
    setSelectedPracticeId(undefined);
  };

  // Type guard para verificar que analytics tiene la estructura correcta
  const hasValidAnalytics = (
    data: typeof analytics,
  ): data is typeof workspaceAnalytics | typeof practiceAnalytics => {
    return data !== undefined && data !== null && 'overview' in data;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted/50"></CardHeader>
              <CardContent className="h-24 bg-muted/30"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics || !hasValidAnalytics(analytics)) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="text-center text-muted-foreground py-12">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  const { overview, distribution, timeline } = analytics;

  const isEmpty = overview.totalMessages === 0;

  // Calcular formato para métricas
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatRating = (value: number) => value.toFixed(2);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        {workspace?.id && (
          <ExportButtons workspaceId={workspace.id} dateRange={dateRange} />
        )}
      </div>

      {/* Filtros */}
      <AnalyticsFilters
        practices={practices}
        selectedPracticeId={selectedPracticeId}
        dateRange={dateRange}
        onPracticeChange={(value: string | undefined) =>
          setSelectedPracticeId(value === 'all' ? undefined : value)
        }
        onDateRangeChange={setDateRange}
        onClearFilters={handleClearFilters}
      />

      {/* Sub-navigation */}
      <div className="flex gap-3">
        <Link href="/dashboard/analytics/comparison">
          <Button variant="outline" className="gap-2">
            <GitCompareArrows className="h-4 w-4" />
            Comparar
          </Button>
        </Link>
        <Link href="/dashboard/analytics/cohorts">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Cohortes
          </Button>
        </Link>
      </div>

      {isEmpty ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <BarChart2 className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold text-lg">Aún no hay datos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Las métricas aparecerán aquí una vez que tus pacientes respondan
                los mensajes.
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Link href="/dashboard/campaigns">
                <Button>Crear campaña</Button>
              </Link>
              <Link href="/dashboard/practices">
                <Button variant="outline">Agregar consultorio</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Mensajes Enviados"
              value={overview.totalMessages.toLocaleString('es-EC')}
              description="Total de mensajes"
              icon={<MessageSquare className="h-4 w-4" />}
            />

            <KpiCard
              title="Tasa de Respuesta"
              value={formatPercentage(overview.responseRate)}
              description={`${overview.totalResponses} de ${overview.totalMessages} respondieron`}
              icon={<CheckCircle className="h-4 w-4" />}
            />

            <KpiCard
              title="Rating Promedio"
              value={formatRating(overview.averageRating)}
              description="De 5.0 estrellas"
              icon={<Star className="h-4 w-4" />}
            />

            <KpiCard
              title="NPS Score"
              value={overview.npsScore}
              description={
                overview.npsScore >= 50
                  ? 'Excelente'
                  : overview.npsScore >= 0
                    ? 'Bueno'
                    : 'Mejorable'
              }
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>

          {/* Sentiment Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Sentimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600">
                        Felices (4-5 ⭐)
                      </span>
                      <span className="text-sm font-bold">
                        {distribution.sentiment.happy}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{
                          width: `${overview.totalResponses > 0 ? (distribution.sentiment.happy / overview.totalResponses) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-yellow-600">
                        Neutrales (3 ⭐)
                      </span>
                      <span className="text-sm font-bold">
                        {distribution.sentiment.neutral}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-yellow-600"
                        style={{
                          width: `${overview.totalResponses > 0 ? (distribution.sentiment.neutral / overview.totalResponses) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-600">
                        Infelices (1-2 ⭐)
                      </span>
                      <span className="text-sm font-bold">
                        {distribution.sentiment.unhappy}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-red-600"
                        style={{
                          width: `${overview.totalResponses > 0 ? (distribution.sentiment.unhappy / overview.totalResponses) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SentimentChart sentiment={distribution.sentiment} />
          </div>

          {/* Top Campaigns - Solo para workspace analytics */}
          {'campaigns' in analytics && analytics.campaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mejores Campañas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {'campaigns' in analytics &&
                    analytics.campaigns
                      .slice(0, 5)
                      .map(
                        (campaign: {
                          id: string;
                          name: string;
                          messagesSent: number;
                          averageRating: number;
                          responseRate: number;
                        }) => (
                          <div
                            key={campaign.id}
                            className="flex items-center justify-between border-b pb-3 last:border-0"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">{campaign.name}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {campaign.messagesSent} mensajes
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {campaign.averageRating.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {campaign.responseRate.toFixed(1)}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                respuesta
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating Distribution */}
          <RatingDistributionChart distribution={distribution.rating} />

          {/* Timeline */}
          {timeline.length > 0 && <TimelineChart data={timeline} />}
        </>
      )}
    </div>
  );
}
