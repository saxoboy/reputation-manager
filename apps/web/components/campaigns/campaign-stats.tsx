'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { BarChart } from 'lucide-react';

export function CampaignStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pacientes Activos</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">165</div>
          <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
          <div className="h-4 w-4 text-muted-foreground">%</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">42.5%</div>
          <p className="text-xs text-muted-foreground">+4% promedio industria</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">NPS Global</CardTitle>
          <div className="text-2xl font-bold text-green-600">85</div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Excelente reputación</p>
        </CardContent>
      </Card>
    </div>
  );
}
