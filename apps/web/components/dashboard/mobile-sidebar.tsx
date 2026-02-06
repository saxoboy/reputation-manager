'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { SidebarNav } from './sidebar-nav';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="font-semibold">Reputation Manager</span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          <SidebarNav onNavigate={() => setOpen(false)} />

          <div className="border-t p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Plan: Starter</span>
              <Badge variant="outline">500 créditos</Badge>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
