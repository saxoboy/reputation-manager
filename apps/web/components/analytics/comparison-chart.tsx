'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ComparisonItem } from '../../services/analytics.service';

interface ComparisonChartProps {
  items: ComparisonItem[];
  metric: 'responseRate' | 'averageRating' | 'npsScore' | 'messagesSent';
  title: string;
}

const metricLabels: Record<string, string> = {
  responseRate: 'Tasa de Respuesta (%)',
  averageRating: 'Rating Promedio',
  npsScore: 'NPS Score',
  messagesSent: 'Mensajes Enviados',
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142.1 76.2% 36.3%)',
  'hsl(47.9 95.8% 53.1%)',
  'hsl(24.6 95% 53.1%)',
  'hsl(262.1 83.3% 57.8%)',
];

export function ComparisonChart({
  items,
  metric,
  title,
}: ComparisonChartProps) {
  const data = items.map((item, index) => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '…' : item.name,
    value: item[metric],
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-50 md:h-75">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{
                  value: metricLabels[metric],
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--muted-foreground))' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar
                dataKey="value"
                name={metricLabels[metric]}
                radius={[8, 8, 0, 0]}
                fill="hsl(var(--primary))"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
