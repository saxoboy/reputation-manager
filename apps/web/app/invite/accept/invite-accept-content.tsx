'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { authClient } from '../../../lib/auth-client';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface InvitationInfo {
  email: string;
  role: string;
  workspaceName: string;
  expiresAt: string;
}

type State = 'loading' | 'ready' | 'accepting' | 'success' | 'error';

const roleLabel = (role: string) =>
  role === 'DOCTOR'
    ? 'Doctor'
    : role === 'RECEPTIONIST'
      ? 'Recepcionista'
      : role;

export function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [state, setState] = useState<State>('loading');
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [session, setSession] = useState<{ user?: { email?: string } } | null>(
    null,
  );

  useEffect(() => {
    if (!token) {
      setErrorMsg('Token de invitación no válido.');
      setState('error');
      return;
    }

    const load = async () => {
      try {
        const [inv, sess] = await Promise.all([
          apiClient.fetch<InvitationInfo>(`/invitations/${token}`, {
            requireAuth: false,
          }),
          authClient.getSession(),
        ]);
        setInvitation(inv);
        setSession(sess?.data ?? null);
        setState('ready');
      } catch {
        setErrorMsg('La invitación no es válida o ya expiró.');
        setState('error');
      }
    };

    load();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setState('accepting');
    try {
      const result = await apiClient.post<{ workspaceId: string }>(
        `/invitations/${token}/accept`,
      );
      setState('success');
      setTimeout(() => router.push('/dashboard'), 2000);
      void result;
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : 'Error al aceptar la invitación.',
      );
      setState('error');
    }
  };

  const handleLoginRedirect = () => {
    const redirectUrl = encodeURIComponent(`/invite/accept?token=${token}`);
    router.push(`/login?redirect=${redirectUrl}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Invitación al equipo</CardTitle>
          {invitation && (
            <CardDescription>
              Has sido invitado a unirte a{' '}
              <strong>{invitation.workspaceName}</strong>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {state === 'loading' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Ir al inicio
              </Button>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="font-medium">¡Invitación aceptada!</p>
              <p className="text-sm text-muted-foreground">
                Redirigiendo al dashboard...
              </p>
            </div>
          )}

          {(state === 'ready' || state === 'accepting') && invitation && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Workspace</span>
                  <span className="font-medium">
                    {invitation.workspaceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rol asignado</span>
                  <span className="font-medium">
                    {roleLabel(invitation.role)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{invitation.email}</span>
                </div>
              </div>

              {session?.user ? (
                session.user.email === invitation.email ? (
                  <Button
                    className="w-full"
                    onClick={handleAccept}
                    disabled={state === 'accepting'}
                  >
                    {state === 'accepting' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                        Aceptando...
                      </>
                    ) : (
                      'Aceptar invitación'
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Estás conectado como <strong>{session.user.email}</strong>
                      , pero la invitación es para{' '}
                      <strong>{invitation.email}</strong>. Cerrá sesión e iniciá
                      con el email correcto.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        authClient.signOut().then(() => handleLoginRedirect())
                      }
                    >
                      Cambiar cuenta
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Necesitás una cuenta para aceptar esta invitación.
                  </p>
                  <Button className="w-full" onClick={handleLoginRedirect}>
                    Iniciar sesión o registrarse
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
