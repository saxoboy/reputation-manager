'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import { useCampaign } from '../../hooks/use-campaigns';
import {
  useCampaignPatients,
  useDeletePatient,
} from '../../hooks/use-patients';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCampaignMessages,
  useSimulateResponse,
} from '../../hooks/use-messages';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '../../services/workspace.service';
import { Message } from '../../services/message.service';
import { Patient } from '../../services/patient.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MessageSquare,
  Users,
  Play,
  Upload,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CsvUploadDialog } from './csv-upload-dialog';
import { ExcelUploadDialog } from './excel-upload-dialog';
import { AddPatientDialog } from './add-patient-dialog';
import { CampaignSettingsDialog } from './campaign-settings-dialog';
import { MessageStatus, MessageType } from '../../types/mock-types';

interface CampaignDetailProps {
  campaignId: string;
}

export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const router = useRouter();
  const { user } = useAuth();

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceService.getAll(),
    enabled: !!user,
  });

  const workspaceId = workspaces?.[0]?.id || '';

  const { data: campaign, isLoading: isCampaignLoading } = useCampaign(
    workspaceId,
    campaignId,
  );
  const { data: patients, isLoading: isPatientsLoading } = useCampaignPatients(
    workspaceId,
    campaignId,
  );
  const { data: messages, isLoading: isMessagesLoading } = useCampaignMessages(
    workspaceId,
    campaignId,
  );

  const queryClient = useQueryClient();
  const deletePatient = useDeletePatient(workspaceId);
  const simulateResponse = useSimulateResponse(workspaceId);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [rating, setRating] = useState<string>('5');
  const [feedback, setFeedback] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [excelUploadOpen, setExcelUploadOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(
    undefined,
  );

  if (!workspaceId) return null;

  if (isCampaignLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Campaña no encontrada</p>
        <Button onClick={() => router.push('/dashboard/campaigns')}>
          Volver a Campañas
        </Button>
      </div>
    );
  }

  const handleSimulateResponse = () => {
    if (!selectedMessageId) return;

    simulateResponse.mutate(
      {
        messageId: selectedMessageId,
        data: {
          rating: parseInt(rating),
          feedback: feedback || undefined,
        },
      },
      {
        onSuccess: () => {
          setSimulateOpen(false);
          setFeedback('');
          setRating('5');
          setSelectedMessageId(null);
        },
      },
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Activa</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'PAUSED':
        return <Badge variant="destructive">Pausada</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline">Completada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getMessageStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'SCHEDULED':
        return <Badge variant="secondary">Programado</Badge>;
      case 'SENT':
        return <Badge className="bg-blue-500">Enviado</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-500">Entregado</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Falló</Badge>;
      case 'REPLIED':
        return <Badge className="bg-purple-500">Respondido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getMessageTypeBadge = (type: MessageType) => {
    switch (type) {
      case 'INITIAL':
        return <Badge variant="outline">Inicial</Badge>;
      case 'FOLLOWUP_HAPPY':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Happy Path
          </Badge>
        );
      case 'FOLLOWUP_UNHAPPY':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Unhappy Path
          </Badge>
        );
      case 'REMINDER':
        return <Badge variant="secondary">Recordatorio</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/campaigns')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {campaign.name}
              </h1>
              {getStatusBadge(campaign.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {campaign.practice?.name || 'Consultorio'}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Creada el{' '}
                {format(new Date(campaign.createdAt), 'PPP', { locale: es })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" onClick={() => setExcelUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
          <Button onClick={() => setSettingsOpen(true)}>
            Configuración de Campaña
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pacientes
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign._count?.patients || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Respuestas
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  0% tasa de respuesta
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">NPS</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          {/* Patient list */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Pacientes</CardTitle>
                <CardDescription>
                  Lista de pacientes en esta campaña.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setAddPatientOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Agregar Paciente
              </Button>
            </CardHeader>
            <CardContent>
              {isPatientsLoading ? (
                <div className="flex justify-center p-4">Cargando...</div>
              ) : patients?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">
                    No hay pacientes en esta campaña.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddPatientOpen(true)}
                    >
                      Agregar uno por uno
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      Importar CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExcelUploadOpen(true)}
                    >
                      Importar Excel
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cita</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients?.map((patient: Patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">
                          {patient.name}
                        </TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.email || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(patient.appointmentTime), 'Pp', {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          {patient.optedOutAt ? (
                            <Badge variant="destructive">Opt-out</Badge>
                          ) : (
                            <Badge variant="outline">Suscrito</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setAddPatientOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {confirmDeleteId === patient.id ? (
                              <>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  disabled={deletePatient.isPending}
                                  onClick={() => {
                                    deletePatient.mutate(patient.id, {
                                      onSuccess: () => {
                                        queryClient.invalidateQueries({
                                          queryKey: [
                                            'patients',
                                            'campaign',
                                            workspaceId,
                                            campaignId,
                                          ],
                                        });
                                        setConfirmDeleteId(null);
                                      },
                                    });
                                  }}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => setConfirmDeleteId(patient.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Mensajes</CardTitle>
              <CardDescription>
                Historial de mensajes enviados a los pacientes. Cuando haya
                mensajes iniciales pendientes de respuesta, aparecerá el botón
                "Simular Respuesta" para probar el flujo sin necesitar un
                teléfono real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMessagesLoading ? (
                <div className="flex justify-center p-4">Cargando...</div>
              ) : messages?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No hay mensajes aún. Los mensajes se generan cuando el Worker
                  procesa los pacientes de la campaña activa.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Enviado</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages?.map((message: Message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium">
                          {message.patient?.name || 'Desconocido'}
                        </TableCell>
                        <TableCell>
                          {getMessageTypeBadge(message.type)}
                        </TableCell>
                        <TableCell>{message.channel}</TableCell>
                        <TableCell>
                          {getMessageStatusBadge(message.status)}
                        </TableCell>
                        <TableCell>
                          {message.sentAt
                            ? format(new Date(message.sentAt), 'Pp', {
                                locale: es,
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {message.rating ? (
                            <Badge variant="secondary">
                              ★ {message.rating}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {message.type === 'INITIAL' &&
                            message.status !== 'REPLIED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedMessageId(message.id);
                                  setSimulateOpen(true);
                                }}
                              >
                                Simular Respuesta
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {campaign && (
        <CampaignSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          workspaceId={workspaceId}
          campaign={campaign}
        />
      )}

      <CsvUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        workspaceId={workspaceId}
        campaignId={campaignId}
        campaignName={campaign.name}
      />

      <ExcelUploadDialog
        open={excelUploadOpen}
        onOpenChange={setExcelUploadOpen}
        workspaceId={workspaceId}
        campaignId={campaignId}
        campaignName={campaign.name}
      />

      <AddPatientDialog
        open={addPatientOpen}
        onOpenChange={(open) => {
          setAddPatientOpen(open);
          if (!open) setSelectedPatient(undefined);
        }}
        workspaceId={workspaceId}
        campaignId={campaignId}
        patient={selectedPatient}
      />

      <Dialog open={simulateOpen} onOpenChange={setSimulateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simular Respuesta del Paciente</DialogTitle>
            <DialogDescription>
              Esto simulará que el paciente hizo clic en el enlace y dejó una
              calificación.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right">
                Calificación
              </Label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excelente</SelectItem>
                  <SelectItem value="4">4 - Bueno</SelectItem>
                  <SelectItem value="3">3 - Regular</SelectItem>
                  <SelectItem value="2">2 - Malo</SelectItem>
                  <SelectItem value="1">1 - Pésimo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(rating === '1' || rating === '2' || rating === '3') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="feedback" className="text-right">
                  Feedback
                </Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="col-span-3"
                  placeholder="¿Qué salió mal?"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSimulateOpen(false)}
              disabled={simulateResponse.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSimulateResponse}
              disabled={simulateResponse.isPending}
            >
              {simulateResponse.isPending ? 'Enviando...' : 'Simular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
