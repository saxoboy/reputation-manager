# Web App (Frontend)

## Stack Tecnológico

- **Framework**: Next.js 16 (canary) - App Router
- **React**: 19.0
- **Styling**: Tailwind CSS v4
- **Auth**: Better Auth (client)
- **State**: TanStack Query v5
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Components**: shadcn/ui (custom)

## Configuración

### Puertos

- **Web (Next.js)**: 4000
- **API (NestJS)**: 3001
- **Worker**: Sin puerto (background jobs)

### Variables de Entorno

Crear `apps/web/.env.local`:

```bash
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Tailwind CSS v4

Tailwind v4 utiliza el nuevo sistema `@theme` en lugar de `tailwind.config.js`.

**Configuración en `global.css`:**

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-background: #ffffff;
  /* ... más variables */
}
```

**Características principales:**
- ✅ CSS-first configuration
- ✅ Variables CSS nativas
- ✅ Dark mode con `prefers-color-scheme`
- ✅ Mejores performance y DX
- ✅ Syntax highlighting en VSCode

### PostCSS

**Archivo:** `postcss.config.mjs`

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

## Utilidades

### `cn()` - Class Merge Helper

**Ubicación:** `lib/utils.ts`

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  "override-classes"
)} />
```

Combina `clsx` + `tailwind-merge` para resolver conflictos de clases.

## Estructura de Directorios

```
apps/web/
├── app/                    # Next.js 16 App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── global.css          # Tailwind v4 config
│   │
│   ├── (auth)/             # Auth routes group
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/        # Dashboard routes group
│   │   ├── layout.tsx      # Dashboard layout
│   │   ├── page.tsx        # Dashboard home
│   │   ├── workspaces/
│   │   ├── campaigns/
│   │   └── analytics/
│   │
│   └── api/                # API routes (Better Auth)
│       └── auth/
│           └── [...all]/
│               └── route.ts
│
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── auth/               # Auth components
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   │
│   ├── dashboard/          # Dashboard components
│   │   ├── nav.tsx
│   │   ├── workspace-switcher.tsx
│   │   └── stats-card.tsx
│   │
│   └── shared/             # Shared components
│       ├── header.tsx
│       └── footer.tsx
│
├── lib/                    # Utilities
│   ├── utils.ts            # cn() helper
│   ├── auth-client.ts      # Better Auth client
│   └── api-client.ts       # Fetch wrapper
│
├── hooks/                  # Custom React hooks
│   ├── use-auth.ts
│   ├── use-workspace.ts
│   └── use-campaigns.ts
│
├── types/                  # TypeScript types
│   └── index.ts
│
├── public/                 # Static assets
│   ├── favicon.ico
│   └── images/
│
├── tailwind.config.ts      # Tailwind config
├── postcss.config.mjs      # PostCSS config
└── next.config.js          # Next.js config
```

## Next.js 16 - Nuevas Features

### 1. Turbopack (Stable)

```bash
# Dev con Turbopack
pnpm nx serve web --turbo
```

### 2. Async Request APIs

```typescript
// app/page.tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  // ...
}
```

### 3. Partial Prerendering (PPR)

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    ppr: true, // Habilitar PPR
  },
};
```

## Comandos

```bash
# Desarrollo
nx serve web                   # Puerto 4000
pnpm dev                       # Web + API + Worker

# Build
nx build web

# Lint
pnpm nx lint web

# Tests (cuando se agreguen)
pnpm nx test web
```

## Próximos Pasos

- [ ] Configurar Better Auth client
- [ ] Crear componentes shadcn/ui base
- [ ] Implementar páginas de login/register
- [ ] Crear dashboard layout
- [ ] Integrar TanStack Query
- [ ] Agregar manejo de errores
- [ ] Implementar theme switcher (dark/light)
