'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

const pathNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  campaigns: 'Campañas',
  patients: 'Pacientes',
  practices: 'Consultorios',
  templates: 'Plantillas',
  analytics: 'Analytics',
  billing: 'Facturación',
  settings: 'Configuración',
  profile: 'Perfil',
  users: 'Usuarios',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  if (paths.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link
        href="/dashboard"
        className="flex items-center text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Link>

      {paths.slice(1).map((path, index) => {
        const href = `/${paths.slice(0, index + 2).join('/')}`;
        const isLast = index === paths.length - 2;
        const label = pathNameMap[path] || path;

        return (
          <Fragment key={path}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground"
              >
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
