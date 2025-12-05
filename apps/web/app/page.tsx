'use client';

import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, isPending } = useAuth(false);
  const router = useRouter();

  useEffect(() => {
    if (!isPending && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className={cn(
              "text-5xl font-bold mb-4",
              "bg-gradient-to-r from-primary to-blue-600",
              "bg-clip-text text-transparent"
            )}>
              Reputation Manager
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Sistema de gestión de feedback para profesionales de la salud
            </p>

            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => router.push('/register')}>
                Comenzar Gratis
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/login')}>
                Iniciar Sesión
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className={cn(
              "p-6 rounded-lg border border-border",
              "bg-card text-card-foreground",
              "hover:shadow-lg transition-shadow"
            )}>
              <h3 className="font-semibold text-lg mb-2">🎯 Feedback Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Filtra automáticamente reseñas negativas y potencia las positivas
              </p>
            </div>

            <div className={cn(
              "p-6 rounded-lg border border-border",
              "bg-card text-card-foreground",
              "hover:shadow-lg transition-shadow"
            )}>
              <h3 className="font-semibold text-lg mb-2">📊 Analytics</h3>
              <p className="text-sm text-muted-foreground">
                NPS, conversion rate y reportes en tiempo real
              </p>
            </div>

            <div className={cn(
              "p-6 rounded-lg border border-border",
              "bg-card text-card-foreground",
              "hover:shadow-lg transition-shadow"
            )}>
              <h3 className="font-semibold text-lg mb-2">⚡ Automatización</h3>
              <p className="text-sm text-muted-foreground">
                SMS/WhatsApp automáticos 2 horas después de la cita
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-muted/50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Tech Stack</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl mb-2">⚛️</div>
                <p className="text-sm font-medium">Next.js 16</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎨</div>
                <p className="text-sm font-medium">Tailwind v4</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔐</div>
                <p className="text-sm font-medium">Better Auth</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🗄️</div>
                <p className="text-sm font-medium">Prisma + PostgreSQL</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-8 text-center">
            <div className={cn(
              "inline-flex items-center gap-2",
              "px-4 py-2 rounded-full",
              "bg-primary/10 text-primary",
              "border border-primary/20"
            )}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="font-medium">Sistema Listo - Auth Implementado ✅</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
