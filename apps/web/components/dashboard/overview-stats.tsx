'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import {
  TrendingUp,
  Star,
  MessageSquare,
  Activity,
  Megaphone,
} from 'lucide-react';
import { useWorkspaceAnalytics } from '../../hooks/use-analytics';

interface OverviewStatsProps {
  workspaceId: string;
}

export function OverviewStats({ workspaceId }: OverviewStatsProps) {
  const { data: analytics, isLoading } = useWorkspaceAnalytics(workspaceId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const overview = analytics?.overview;
  const isEmpty = !overview || overview.totalMessages === 0;

  if (isEmpty) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <Megaphone className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Aún no tienes datos de feedback
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Crea una campaña e importa pacientes para empezar a medir tu
              reputación.
            </p>
          </div>
          <Link
            href="/dashboard/campaigns"
            className="text-xs font-medium text-primary hover:underline"
          >
            Crear primera campaña →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const nps = Math.round(overview.npsScore);
  const rating = overview.averageRating.toFixed(1);
  const responseRate = overview.responseRate.toFixed(1);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">NPS Estimado</CardTitle>
          <TrendingUp
            className={`h-4 w-4 ${nps >= 50 ? 'text-green-600' : nps >= 0 ? 'text-yellow-500' : 'text-red-500'}`}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{nps}</div>
          <p className="text-xs text-muted-foreground pt-1">
            {nps >= 50
              ? 'Excelente'
              : nps >= 0
                ? 'Neutro — a mejorar'
                : 'Crítico'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rating}</div>
          <p className="text-xs text-muted-foreground pt-1">
            Basado en {overview.totalResponses} respuestas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Feedback Total</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {overview.totalResponses.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            De {overview.totalMessages.toLocaleString()} mensajes enviados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tasa de Respuesta
          </CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{responseRate}%</div>
          <p className="text-xs text-muted-foreground pt-1">
            {overview.totalMessages} solicitudes enviadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
