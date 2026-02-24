'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Building2,
  Megaphone,
  FileText,
  CheckCircle2,
  ChevronRight,
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
      description:
        'Configura tu clínica con dirección y link de Google Reviews.',
      done: hasPractice,
      href: '/dashboard/practices',
      icon: Building2,
    },
    {
      label: 'Crea tu primera campaña',
      description: 'Importa pacientes y activa el envío automático post-cita.',
      done: hasCampaign,
      href: '/dashboard/campaigns',
      icon: Megaphone,
    },
    {
      label: 'Personaliza tus plantillas',
      description: 'Ajusta el mensaje que recibirán tus pacientes por SMS.',
      done: hasTemplate,
      href: '/dashboard/templates',
      icon: FileText,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-teal-500/20 bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display font-semibold leading-tight">
            Configura tu cuenta
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Completa estos pasos para empezar a recopilar reseñas de tus
            pacientes.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="mt-0.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completedCount} de {steps.length} completados
          </span>
          <span className="font-medium text-teal-600 dark:text-teal-400">
            {progressPct}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step cards */}
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          // Highlight the first incomplete step
          const isNext = !step.done && steps.slice(0, i).every((s) => s.done);

          return (
            <div
              key={step.label}
              className={`relative rounded-xl border p-4 transition-all duration-200 ${
                step.done
                  ? 'border-border bg-muted/30'
                  : isNext
                    ? 'border-teal-500/40 bg-teal-500/5 shadow-sm shadow-teal-500/10'
                    : 'border-border bg-card hover:border-border/80'
              }`}
            >
              {/* Done checkmark */}
              {step.done && (
                <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-teal-500" />
              )}

              {/* Icon */}
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${
                  step.done
                    ? 'bg-muted'
                    : isNext
                      ? 'bg-teal-500/15'
                      : 'bg-muted'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    step.done
                      ? 'text-muted-foreground'
                      : isNext
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-muted-foreground'
                  }`}
                />
              </div>

              {/* Step label */}
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Paso {i + 1}
              </p>
              <p
                className={`mb-2 text-sm font-semibold leading-snug ${
                  step.done ? 'text-muted-foreground line-through' : ''
                }`}
              >
                {step.label}
              </p>

              {/* Description */}
              {!step.done && (
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              )}

              {/* CTA */}
              {!step.done && (
                <Link
                  href={step.href}
                  className={`inline-flex items-center gap-0.5 text-xs font-semibold transition-colors ${
                    isNext
                      ? 'text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ir ahora
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
