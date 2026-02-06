'use client';

import { useSearchParams } from 'next/navigation';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../components/ui/tabs';
import { WorkspaceSettings } from '../../../../components/settings/workspace-settings';
import { ProfileSettings } from '../../../../components/settings/profile-settings';
import { BillingSettings } from '../../../../components/settings/billing-settings';
import { WeeklyReportSettings } from '../../../../components/settings/weekly-report-settings';

const VALID_TABS = ['workspace', 'profile', 'reports', 'billing'] as const;

export default function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const defaultTab = VALID_TABS.includes(
    tabParam as (typeof VALID_TABS)[number],
  )
    ? (tabParam as string)
    : 'workspace';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Administra tu cuenta y preferencias del workspace
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <WorkspaceSettings />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="reports">
          <WeeklyReportSettings />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
