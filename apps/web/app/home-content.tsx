'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import {
  MessageSquare,
  Star,
  BarChart3,
  Shield,
  Zap,
  Users,
  Building2,
  Check,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Clock,
} from 'lucide-react';

// ─── Pricing data ─────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Free',
    description: 'Para probar el sistema',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 50,
    features: [
      '50 mensajes incluidos',
      '1 usuario · 1 consultorio',
      'SMS automático post-cita',
      'Analytics básico',
      'Soporte por email',
    ],
    cta: 'Comenzar gratis',
    ctaVariant: 'outline' as const,
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Starter',
    description: 'Para clínicas pequeñas',
    monthlyPrice: 39,
    yearlyPrice: 390,
    credits: 500,
    features: [
      '500 mensajes por mes',
      '2 usuarios · 1 consultorio',
      'SMS y Email',
      'Analytics completo',
      'Reportes semanales',
      'Soporte prioritario',
    ],
    cta: 'Empezar ahora',
    ctaVariant: 'default' as const,
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Professional',
    description: 'Para grupos médicos',
    monthlyPrice: 129,
    yearlyPrice: 1290,
    credits: 2000,
    features: [
      '2,000 mensajes por mes',
      '5 usuarios · 5 consultorios',
      'SMS, WhatsApp y Email',
      'Analytics avanzado',
      'Reportes personalizados',
      'Soporte dedicado',
    ],
    cta: 'Empezar ahora',
    ctaVariant: 'default' as const,
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    description: 'Para hospitales y redes',
    monthlyPrice: null,
    yearlyPrice: null,
    credits: -1,
    features: [
      'Mensajes ilimitados',
      'Usuarios y consultorios ilimitados',
      'Todos los canales',
      'Integraciones a medida',
      'SLA garantizado',
      'Gerente de cuenta dedicado',
    ],
    cta: 'Contactar ventas',
    ctaVariant: 'outline' as const,
    href: 'mailto:ventas@reputationmanager.ec',
    highlighted: false,
  },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-slate-900/90 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="font-display text-lg font-bold text-white">
          Reputation<span className="text-teal-400">Manager</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Iniciar sesión
          </button>
          <Button
            size="sm"
            className="bg-teal-500 text-white hover:bg-teal-400"
            onClick={() => router.push('/register')}
          >
            Comenzar gratis
          </Button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* Grid background */}
      <div className="hero-grid absolute inset-0" />

      {/* Gradient orbs */}
      <div className="absolute -left-40 top-20 h-125 w-125 rounded-full bg-teal-500/15 blur-[120px]" />
      <div className="absolute -right-40 bottom-10 h-100 w-100 rounded-full bg-cyan-400/10 blur-[100px]" />

      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-6 py-32 text-center">
        {/* Badge */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
            </span>
            Beta — Acceso gratuito por tiempo limitado
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 font-display mt-8 max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
          Convierte pacientes felices en{' '}
          <span className="gradient-text">reseñas de 5 estrellas</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up delay-200 mt-6 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
          Envía un SMS automático 2 horas después de la cita. Pacientes
          satisfechos van directo a Google Reviews. Los insatisfechos te dejan
          feedback privado.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-300 mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="gap-2 bg-teal-500 px-8 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-400"
            onClick={() => router.push('/register')}
          >
            Crear cuenta gratuita
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Ya tengo cuenta
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <p className="animate-fade-up delay-400 mt-4 text-sm text-white/30">
          Sin tarjeta de crédito · 50 mensajes gratuitos incluidos
        </p>

        {/* Stats row */}
        <div className="animate-fade-up delay-500 mt-16 grid grid-cols-3 gap-6 border-t border-white/10 pt-10 md:gap-16">
          {[
            {
              value: '2 min',
              label: 'Para configurar',
              icon: <Clock className="h-4 w-4" />,
            },
            {
              value: '4.8★',
              label: 'Rating promedio obtenido',
              icon: <Star className="h-4 w-4" />,
            },
            {
              value: '3×',
              label: 'Más reseñas en Google',
              icon: <TrendingUp className="h-4 w-4" />,
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-1 flex items-center justify-center gap-1.5 text-teal-400">
                {stat.icon}
                <span className="font-display text-2xl font-bold text-white md:text-3xl">
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-white/40 md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-white to-transparent dark:from-slate-950" />
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Registra la cita',
      description:
        'Sube tu lista de pacientes del día: nombre, teléfono y hora de cita.',
      icon: <Users className="h-6 w-6" />,
    },
    {
      number: '02',
      title: 'Mensaje automático',
      description:
        'A las 2 horas de la cita, el paciente recibe un SMS pidiendo su valoración del 1 al 5.',
      icon: <MessageSquare className="h-6 w-6" />,
    },
    {
      number: '03',
      title: 'Filtramos el resultado',
      description:
        'Rating 4-5 → va directo a Google Reviews. Rating 1-3 → feedback privado solo para ti.',
      icon: <Star className="h-6 w-6" />,
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 font-medium uppercase tracking-widest text-teal-600 dark:text-teal-400 text-sm">
            Cómo funciona
          </p>
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Tres pasos. Sin complicaciones.
          </h2>
        </div>

        <div className="relative mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-linear-to-r from-transparent via-teal-500/30 to-transparent md:block" />

          {steps.map((step, i) => (
            <div
              key={i}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/20">
                <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                  {step.number}
                </span>
                <span className="text-teal-600 dark:text-teal-400">
                  {step.icon}
                </span>
              </div>
              <h3 className="font-display mb-2 text-xl font-semibold">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Automatización total',
      description:
        'El scheduler envía mensajes automáticamente 2 horas después de cada cita. Sin intervención manual.',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Protege tu reputación',
      description:
        'Las reseñas negativas se capturan en privado. Solo las positivas llegan a Google.',
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: 'Más reseñas en Google',
      description:
        'El link directo a tu ficha de Google Maps elimina la fricción. Más pacientes completan la reseña.',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Analytics en tiempo real',
      description:
        'NPS, tasa de conversión, análisis por cohorte. Mide el impacto de cada campaña.',
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: 'Multi-consultorio',
      description:
        'Gestiona múltiples sedes desde un mismo panel. Reportes unificados y por sede.',
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'SMS, WhatsApp y Email',
      description:
        'Llega a tus pacientes por el canal que prefieren. Configurable por campaña.',
    },
  ];

  return (
    <section className="bg-slate-50 py-24 dark:bg-slate-900/50">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Características
          </p>
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Todo lo que necesitas
          </h2>
          <p className="mt-4 text-muted-foreground">
            Diseñado específicamente para profesionales de la salud en Ecuador.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-teal-500/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 transition-colors group-hover:bg-teal-500/20 dark:text-teal-400">
                {f.icon}
              </div>
              <h3 className="font-display mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Precios
          </p>
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Planes y precios
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comienza gratis. Crece cuando lo necesites.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5">
            <span
              className={`cursor-pointer text-sm font-medium transition-colors ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setYearly(false)}
            >
              Mensual
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${yearly ? 'bg-teal-500' : 'bg-muted'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${yearly ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
            <span
              className={`cursor-pointer text-sm font-medium transition-colors ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setYearly(true)}
            >
              Anual
              <span className="ml-1.5 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                1 mes gratis
              </span>
            </span>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
                plan.highlighted
                  ? 'border-teal-500 bg-slate-900 shadow-xl shadow-teal-500/10 dark:bg-slate-800'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-teal-500 px-3 py-1 text-xs font-semibold text-white">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3
                  className={`font-display text-lg font-bold ${plan.highlighted ? 'text-white' : ''}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-0.5 text-sm ${plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                {plan.monthlyPrice === null ? (
                  <div
                    className={`font-display text-2xl font-bold ${plan.highlighted ? 'text-white' : ''}`}
                  >
                    A consultar
                  </div>
                ) : plan.monthlyPrice === 0 ? (
                  <div className="flex items-end gap-1">
                    <span
                      className={`font-display text-4xl font-bold ${plan.highlighted ? 'text-white' : ''}`}
                    >
                      $0
                    </span>
                    <span
                      className={`mb-1 text-sm ${plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}
                    >
                      /mes
                    </span>
                  </div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span
                      className={`font-display text-4xl font-bold ${plan.highlighted ? 'text-white' : ''}`}
                    >
                      $
                      {yearly
                        ? Math.round(plan.yearlyPrice! / 12)
                        : plan.monthlyPrice}
                    </span>
                    <span
                      className={`mb-1 text-sm ${plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}
                    >
                      /mes
                    </span>
                  </div>
                )}
                {yearly && plan.yearlyPrice && plan.yearlyPrice > 0 && (
                  <p
                    className={`mt-0.5 text-xs ${plan.highlighted ? 'text-white/40' : 'text-muted-foreground'}`}
                  >
                    ${plan.yearlyPrice} facturado anualmente
                  </p>
                )}
                {plan.credits > 0 && (
                  <p className="mt-2 text-sm font-semibold text-teal-500">
                    {plan.credits.toLocaleString()} mensajes/mes
                  </p>
                )}
                {plan.credits === -1 && (
                  <p className="mt-2 text-sm font-semibold text-teal-500">
                    Mensajes ilimitados
                  </p>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? 'text-teal-400' : 'text-teal-600'}`}
                    />
                    <span className={plan.highlighted ? 'text-white/80' : ''}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? 'default' : plan.ctaVariant}
                className={`w-full ${plan.highlighted ? 'bg-teal-500 hover:bg-teal-400 text-white' : ''}`}
                asChild
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA final ────────────────────────────────────────────────────────────────

function CtaSection() {
  const router = useRouter();
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-teal-500/15 blur-[80px]" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-[80px]" />

      <div className="container relative mx-auto px-6 text-center">
        <h2 className="font-display mb-4 text-4xl font-bold text-white md:text-5xl">
          Empieza a obtener más reseñas hoy
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-white/50">
          Únete a los primeros profesionales de la salud en Ecuador que
          automatizan su reputación online.
        </p>
        <Button
          size="lg"
          className="gap-2 bg-teal-500 px-10 text-white shadow-lg shadow-teal-500/30 hover:bg-teal-400"
          onClick={() => router.push('/register')}
        >
          Crear cuenta gratuita
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="mt-4 text-sm text-white/30">
          Sin tarjeta de crédito · Cancela cuando quieras
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="font-semibold text-foreground">
            ReputationManager
          </span>
          . Todos los derechos reservados.
        </p>
        <div className="flex gap-6">
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacidad
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Términos
          </Link>
          <Link
            href="#pricing"
            className="transition-colors hover:text-foreground"
          >
            Precios
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function HomeContent() {
  const { isAuthenticated, isPending } = useAuth(false);
  const router = useRouter();

  useEffect(() => {
    if (!isPending && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
