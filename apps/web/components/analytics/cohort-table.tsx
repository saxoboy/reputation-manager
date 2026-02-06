'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CohortEntry, CohortAnalysis } from '../../services/analytics.service';

interface CohortTableProps {
  cohorts: CohortEntry[];
  trends: CohortAnalysis['trends'];
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === 'down')
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function TrendBadge({
  trend,
  label,
}: {
  trend: 'up' | 'down' | 'stable';
  label: string;
}) {
  const variant =
    trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary';

  return (
    <Badge variant={variant} className="gap-1">
      <TrendIcon trend={trend} />
      {label}
    </Badge>
  );
}

function formatMonth(cohort: string): string {
  const [year, month] = cohort.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('es-EC', {
    month: 'short',
    year: 'numeric',
  });
}

export function CohortTable({ cohorts, trends }: CohortTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Análisis de Cohortes Mensuales</CardTitle>
          <div className="flex gap-2">
            <TrendBadge trend={trends.responseRateTrend} label="Respuesta" />
            <TrendBadge trend={trends.ratingTrend} label="Rating" />
            <TrendBadge trend={trends.npsTrend} label="NPS" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead className="text-right">Mensajes</TableHead>
              <TableHead className="text-right">Respuestas</TableHead>
              <TableHead className="text-right">Tasa Resp.</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">NPS</TableHead>
              <TableHead className="text-right">% Felices</TableHead>
              <TableHead className="text-right">% Infelices</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cohorts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay datos de cohortes disponibles
                </TableCell>
              </TableRow>
            ) : (
              cohorts.map((cohort) => (
                <TableRow key={cohort.cohort}>
                  <TableCell className="font-medium">
                    {formatMonth(cohort.cohort)}
                  </TableCell>
                  <TableCell className="text-right">
                    {cohort.totalMessages.toLocaleString('es-EC')}
                  </TableCell>
                  <TableCell className="text-right">
                    {cohort.totalResponses.toLocaleString('es-EC')}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        cohort.responseRate >= 50
                          ? 'text-green-600 font-medium'
                          : cohort.responseRate >= 30
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }
                    >
                      {cohort.responseRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {cohort.averageRating > 0
                      ? cohort.averageRating.toFixed(1)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        cohort.npsScore >= 50
                          ? 'text-green-600 font-medium'
                          : cohort.npsScore >= 0
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }
                    >
                      {cohort.totalResponses > 0 ? cohort.npsScore : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-600">
                      {cohort.totalResponses > 0
                        ? `${cohort.happyPercent}%`
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-red-600">
                      {cohort.totalResponses > 0
                        ? `${cohort.unhappyPercent}%`
                        : '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
