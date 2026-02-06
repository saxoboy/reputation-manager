'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  GitCompareArrows,
} from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Checkbox } from '../../../../../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../components/ui/table';
import { ComparisonChart } from '../../../../../components/analytics/comparison-chart';
import {
  analyticsService,
} from '../../../../../services/analytics.service';
import { practiceService } from '../../../../../services/practice.service';
import { campaignService } from '../../../../../services/campaign.service';
import { useCurrentWorkspace } from '../../../../../hooks/use-workspaces';

type CompareMode = 'practices' | 'campaigns';

export default function ComparisonPage() {
  const { data: workspace } = useCurrentWorkspace();
  const [mode, setMode] = useState<CompareMode>('practices');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Obtener lista de practices
  const { data: practices = [] } = useQuery({
    queryKey: ['practices', workspace?.id],
    queryFn: () => {
      if (!workspace?.id) throw new Error('No workspace');
      return practiceService.getAll(workspace.id);
    },
    enabled: !!workspace?.id,
  });

  // Obtener lista de campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', workspace?.id],
    queryFn: () => {
      if (!workspace?.id) throw new Error('No workspace');
      return campaignService.getAll(workspace.id);
    },
    enabled: !!workspace?.id,
  });

  // Query comparación
  const {
    data: comparison,
    isLoading,
  } = useQuery({
    queryKey: ['comparison', mode, selectedIds],
    queryFn: () => {
      if (!workspace?.id || selectedIds.length < 2) {
        throw new Error('Select at least 2 items');
      }
      if (mode === 'practices') {
        return analyticsService.comparePractices(workspace.id, selectedIds);
      }
      return analyticsService.compareCampaigns(workspace.id, selectedIds);
    },
    enabled: !!workspace?.id && selectedIds.length >= 2,
  });

  const items = mode === 'practices' ? practices : campaigns;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as CompareMode);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/analytics">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Comparación</h1>
          <p className="text-muted-foreground">
            Compara métricas entre consultorios o campañas
          </p>
        </div>
      </div>

      {/* Mode selector + Item selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5" />
              Seleccionar Items a Comparar
            </CardTitle>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practices">Consultorios</SelectItem>
                <SelectItem value="campaigns">Campañas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay {mode === 'practices' ? 'consultorios' : 'campañas'}{' '}
              disponibles
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selectedIds.includes(item.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                    }`}
                >
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => toggleSelection(item.id)}
                  />
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                </label>
              ))}
            </div>
          )}
          {selectedIds.length > 0 && selectedIds.length < 2 && (
            <p className="text-sm text-amber-600 mt-3">
              Selecciona al menos 2 items para comparar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && selectedIds.length >= 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-16 bg-muted/50" />
              <CardContent className="h-48 bg-muted/30" />
            </Card>
          ))}
        </div>
      )}

      {/* Comparison results */}
      {comparison && comparison.items.length >= 2 && (
        <>
          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Comparativo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {mode === 'practices' ? 'Consultorio' : 'Campaña'}
                    </TableHead>
                    <TableHead className="text-right">Mensajes</TableHead>
                    <TableHead className="text-right">Respuestas</TableHead>
                    <TableHead className="text-right">Tasa Resp.</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">NPS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {item.messagesSent.toLocaleString('es-EC')}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalResponses.toLocaleString('es-EC')}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            item.responseRate >= 50
                              ? 'text-green-600 font-medium'
                              : item.responseRate >= 30
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }
                        >
                          {item.responseRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.averageRating.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            item.npsScore >= 50
                              ? 'text-green-600 font-medium'
                              : item.npsScore >= 0
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }
                        >
                          {item.npsScore}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <ComparisonChart
              items={comparison.items}
              metric="responseRate"
              title="Tasa de Respuesta (%)"
            />
            <ComparisonChart
              items={comparison.items}
              metric="averageRating"
              title="Rating Promedio"
            />
            <ComparisonChart
              items={comparison.items}
              metric="npsScore"
              title="NPS Score"
            />
            <ComparisonChart
              items={comparison.items}
              metric="messagesSent"
              title="Volumen de Mensajes"
            />
          </div>

          {/* Sentiment Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparación de Sentimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {comparison.items.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <h4 className="font-medium text-sm truncate">
                      {item.name}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">Felices</span>
                        <span>{item.distribution.sentiment.happy}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-green-600"
                          style={{
                            width: `${item.totalResponses > 0
                                ? (item.distribution.sentiment.happy /
                                  item.totalResponses) *
                                100
                                : 0
                              }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-yellow-600">Neutrales</span>
                        <span>{item.distribution.sentiment.neutral}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-yellow-600"
                          style={{
                            width: `${item.totalResponses > 0
                                ? (item.distribution.sentiment.neutral /
                                  item.totalResponses) *
                                100
                                : 0
                              }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-red-600">Infelices</span>
                        <span>{item.distribution.sentiment.unhappy}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-red-600"
                          style={{
                            width: `${item.totalResponses > 0
                                ? (item.distribution.sentiment.unhappy /
                                  item.totalResponses) *
                                100
                                : 0
                              }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
