'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface TrendDataPoint {
  month: string;
  responseRate: number;
  averageRating: number;
  npsScore: number;
  volume: number;
}

interface TrendsChartProps {
  data: TrendDataPoint[];
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('es-EC', {
    month: 'short',
    year: '2-digit',
  });
}

export function TrendsChart({ data }: TrendsChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    month: formatMonth(item.month),
    averageRatingScaled: item.averageRating * 20, // Scale 0-5 to 0-100 for chart
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencias Mensuales</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value?: number, name?: string) => {
                return [(value ?? 0).toFixed(1), name ?? ''];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="responseRate"
              name="Tasa de Respuesta (%)"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line
              type="monotone"
              dataKey="averageRatingScaled"
              name="Rating (x20)"
              stroke="hsl(142.1 76.2% 36.3%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(142.1 76.2% 36.3%)' }}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="npsScore"
              name="NPS Score"
              stroke="hsl(262.1 83.3% 57.8%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(262.1 83.3% 57.8%)' }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          * Rating escalado x20 para visualización (ej: 4.5 → 90)
        </p>
      </CardContent>
    </Card>
  );
}
