'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface RatingDistributionChartProps {
  distribution: Record<string, number>;
}

export function RatingDistributionChart({
  distribution,
}: RatingDistributionChartProps) {
  // Transformar a array para Recharts
  const data = [
    { rating: '1⭐', count: distribution['1'] || 0 },
    { rating: '2⭐', count: distribution['2'] || 0 },
    { rating: '3⭐', count: distribution['3'] || 0 },
    { rating: '4⭐', count: distribution['4'] || 0 },
    { rating: '5⭐', count: distribution['5'] || 0 },
  ];

  // Colores por rating
  const colors = [
    'hsl(0 84.2% 60.2%)', // Red - 1 star
    'hsl(24.6 95% 53.1%)', // Orange - 2 stars
    'hsl(47.9 95.8% 53.1%)', // Yellow - 3 stars
    'hsl(142.1 76.2% 36.3%)', // Light green - 4 stars
    'hsl(142.1 70.6% 45.3%)', // Green - 5 stars
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="rating"
              className="text-xs"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: '#9ca3af' }}
              label={{
                value: 'Cantidad',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#9ca3af' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Bar dataKey="count" name="Respuestas" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
