'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { useWorkspace } from '../../../hooks/use-workspace';
import { Button } from '../../../components/ui/button';
import { OverviewStats } from '../../../components/dashboard/overview-stats';
import { RecentActivity } from '../../../components/dashboard/recent-activity';
import { SetupChecklist } from '../../../components/dashboard/setup-checklist';

const FeedbackCharts = dynamic(
  () =>
    import('../../../components/dashboard/feedback-charts').then(
      (m) => m.FeedbackCharts,
    ),
  {
    ssr: false,
    loading: () => <div className="h-80 animate-pulse bg-muted rounded-lg" />,
  },
);

export default function DashboardContent() {
  const { user, isPending } = useAuth();
  const { workspace } = useWorkspace();
  const userName = user?.name ? user.name.split(' ')[0] : 'Doctor';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hola, {userName} 👋
          </h1>
          <p className="text-muted-foreground">
            Aquí tienes el resumen de tu reputación online hoy.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/practices">Ver Consultorios</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/campaigns">Nueva Campaña</Link>
          </Button>
        </div>
      </div>

      {workspace?.id && <SetupChecklist workspaceId={workspace.id} />}

      <OverviewStats workspaceId={workspace?.id ?? ''} />

      <FeedbackCharts workspaceId={workspace?.id ?? ''} />

      <RecentActivity workspaceId={workspace?.id ?? ''} />
    </div>
  );
}
