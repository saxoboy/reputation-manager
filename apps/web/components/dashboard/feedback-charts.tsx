'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
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

// Mock Data
const FEEDBACK_DATA = [
  { name: 'Lun', value: 12 },
  { name: 'Mar', value: 18 },
  { name: 'Mie', value: 15 },
  { name: 'Jue', value: 25 },
  { name: 'Vie', value: 32 },
  { name: 'Sab', value: 28 },
  { name: 'Dom', value: 10 },
];

const RATING_DATA = [
  { name: '5 Estrellas', value: 65, color: '#16a34a' }, // green-600
  { name: '4 Estrellas', value: 20, color: '#a3e635' }, // lime-400
  { name: '3 Estrellas', value: 8, color: '#facc15' }, // yellow-400
  { name: '2 Estrellas', value: 5, color: '#f97316' }, // orange-500
  { name: '1 Estrella', value: 2, color: '#ef4444' }, // red-500
];

export function FeedbackCharts() {
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
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FEEDBACK_DATA}>
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
                  tickFormatter={(value) => `${value}`}
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
          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={RATING_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {RATING_DATA.map((entry, index) => (
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
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-600"></div> 5★
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-lime-400"></div> 4★
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div> 3★
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-600"></div> 1-2★
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
