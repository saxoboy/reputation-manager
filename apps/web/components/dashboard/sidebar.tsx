'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { Badge } from '../ui/badge';
import { SidebarNav } from './sidebar-nav';

export function Sidebar() {
  return (
    <div className="hidden md:flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="font-semibold">Reputation Manager</span>
        </Link>
      </div>

      {/* Navigation */}
      <SidebarNav />

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Plan: Starter</span>
          <Badge variant="outline">500 créditos</Badge>
        </div>
      </div>
    </div>
  );
}
