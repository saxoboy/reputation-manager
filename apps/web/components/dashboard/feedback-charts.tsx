'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useWorkspaceAnalytics } from '../../hooks/use-analytics';

const RATING_COLORS: Record<string, string> = {
  '5': '#16a34a',
  '4': '#a3e635',
  '3': '#facc15',
  '2': '#f97316',
  '1': '#ef4444',
};

const DAY_LABELS: Record<string, string> = {
  '0': 'Dom',
  '1': 'Lun',
  '2': 'Mar',
  '3': 'Mié',
  '4': 'Jue',
  '5': 'Vie',
  '6': 'Sáb',
};

interface FeedbackChartsProps {
  workspaceId: string;
}

export function FeedbackCharts({ workspaceId }: FeedbackChartsProps) {
  const { data: analytics, isLoading } = useWorkspaceAnalytics(workspaceId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-60 w-full rounded-full mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMessages = analytics?.overview?.totalMessages ?? 0;
  if (totalMessages === 0) return null;

  // Build timeline data from last 7 entries
  const timelineRaw = analytics?.timeline ?? [];
  const timelineData = timelineRaw.slice(-7).map((entry) => {
    const date = new Date(entry.date);
    const dayKey = String(date.getDay());
    return {
      name: DAY_LABELS[dayKey] ?? entry.date,
      value: entry.responses,
    };
  });

  // Build rating distribution pie data
  const ratingDist = analytics?.distribution?.rating ?? {};
  const ratingData = [5, 4, 3, 2, 1]
    .map((star) => ({
      name: `${star} ${star === 1 ? 'Estrella' : 'Estrellas'}`,
      value: ratingDist[String(star)] ?? 0,
      color: RATING_COLORS[String(star)],
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Tendencia de Feedback</CardTitle>
          <CardDescription>
            Volumen de respuestas recibidas en los últimos 7 días.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-50 md:h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Distribución de Calificaciones</CardTitle>
          <CardDescription>Desglose de puntuaciones recibidas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-50 md:h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {ratingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-muted-foreground">
              {ratingData.map((d) => (
                <div key={d.name} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.name.split(' ')[0]}★
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
