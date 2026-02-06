import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Campañas',
    href: '/dashboard/campaigns',
    icon: MessageSquare,
  },
  {
    name: 'Pacientes',
    href: '/dashboard/patients',
    icon: Users,
  },
  {
    name: 'Consultorios',
    href: '/dashboard/practices',
    icon: Building2,
  },
  {
    name: 'Plantillas',
    href: '/dashboard/templates',
    icon: FileText,
  },
  {
    name: 'Usuarios',
    href: '/dashboard/users',
    icon: Users,
  },
];

export const secondaryNavigation: NavItem[] = [
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Facturación',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    name: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
  },
];
