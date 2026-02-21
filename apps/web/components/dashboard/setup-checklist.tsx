'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  CheckCircle2,
  Circle,
  X,
  Building2,
  Megaphone,
  FileText,
} from 'lucide-react';
import { usePractices } from '../../hooks/use-practices';
import { useCampaigns } from '../../hooks/use-campaigns';
import { useTemplates } from '../../hooks/use-templates';

interface SetupChecklistProps {
  workspaceId: string;
}

export function SetupChecklist({ workspaceId }: SetupChecklistProps) {
  const DISMISS_KEY = `setup-checklist-dismissed-${workspaceId}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
  }, [DISMISS_KEY]);

  const { data: practices = [] } = usePractices(workspaceId);
  const { data: campaignsResponse } = useCampaigns(workspaceId, 1, 1);
  const { data: templates = [] } = useTemplates(workspaceId);

  const hasPractice = practices.length > 0;
  const hasCampaign = (campaignsResponse?.total ?? 0) > 0;
  const hasTemplate = templates.length > 0;

  const steps = [
    {
      label: 'Crea tu primer consultorio',
      done: hasPractice,
      href: '/dashboard/practices',
      icon: Building2,
    },
    {
      label: 'Crea tu primera campaña',
      done: hasCampaign,
      href: '/dashboard/campaigns',
      icon: Megaphone,
    },
    {
      label: 'Personaliza tus plantillas de mensaje',
      done: hasTemplate,
      href: '/dashboard/templates',
      icon: FileText,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Configura tu cuenta ({completedCount}/{steps.length} completados)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completa estos pasos para empezar a recopilar feedback de tus
              pacientes.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.label} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                )}
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {step.done ? (
                  <span className="text-sm text-muted-foreground line-through">
                    {step.label}
                  </span>
                ) : (
                  <Link
                    href={step.href}
                    className="text-sm font-medium hover:underline"
                  >
                    {step.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
