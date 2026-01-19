'use client';

import { useState } from 'react';
import dynamicImport from 'next/dynamic';
import { Campaign } from '../../../../types/mock-types';
import { CampaignStats } from '../../../../components/campaigns/campaign-stats';
import { CampaignsList } from '../../../../components/campaigns/campaigns-list';

const CreateCampaignDialog = dynamicImport(
  () =>
    import('../../../../components/campaigns/create-campaign-dialog').then(
      (mod) => mod.CreateCampaignDialog
    ),
  { ssr: false }
);

// Disable SSR for this page to avoid Radix UI + React 19 prerender issues
export const dynamic = 'force-dynamic';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Pacientes Enero 2026',
    practiceName: 'Consultorio Norte',
    status: 'ACTIVE',
    patientsCount: 45,
    respondedCount: 12,
    nps: 78,
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    name: 'Limpiezas Dentales Diciembre',
    practiceName: 'Consultorio Centro',
    status: 'COMPLETED',
    patientsCount: 120,
    respondedCount: 58,
    nps: 92,
    createdAt: '2025-12-01',
  },
  {
    id: '3',
    name: 'Campaña Reactivación',
    practiceName: 'Consultorio Norte',
    status: 'DRAFT',
    patientsCount: 0,
    respondedCount: 0,
    nps: 0,
    createdAt: '2026-01-18',
  },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);

  const handleCreateCampaign = (newCampaign: Campaign) => {
    setCampaigns([newCampaign, ...campaigns]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campañas</h2>
          <p className="text-muted-foreground">
            Crea campañas masivas importando tu lista de pacientes.
          </p>
        </div>

        <CreateCampaignDialog onCreate={handleCreateCampaign} />
      </div>

      <div className="grid gap-6">
        <CampaignStats />

        <CampaignsList campaigns={campaigns} />
      </div>
    </div>
  );
}

