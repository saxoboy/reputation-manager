'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface SentimentChartProps {
  sentiment: {
    happy: number;
    neutral: number;
    unhappy: number;
  };
}

export function SentimentChart({ sentiment }: SentimentChartProps) {
  const data = [
    { name: 'Felices (4-5⭐)', value: sentiment.happy },
    { name: 'Neutrales (3⭐)', value: sentiment.neutral },
    { name: 'Infelices (1-2⭐)', value: sentiment.unhappy },
  ];

  const colors = [
    'hsl(142.1 76.2% 36.3%)', // Green
    'hsl(47.9 95.8% 53.1%)', // Yellow
    'hsl(0 84.2% 60.2%)', // Red
  ];

  const total = sentiment.happy + sentiment.neutral + sentiment.unhappy;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Sentimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const percentage =
                  total > 0
                    ? ((entry.payload.value / total) * 100).toFixed(1)
                    : '0.0';
                return `${value} (${percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
