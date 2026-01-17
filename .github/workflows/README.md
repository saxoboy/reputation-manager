# GitHub Workflows

Este directorio contiene los workflows de CI/CD para Reputation Manager.

## Workflows Disponibles

### 1. CI (`ci.yml`)

**Trigger**: Push a `main` o `develop`

**Funcionalidad**:

- ✅ Levanta PostgreSQL y Redis como servicios
- ✅ Instala dependencias con caché de pnpm
- ✅ Genera Prisma Client
- ✅ Ejecuta migraciones
- ✅ Lint de todo el código
- ✅ Type checking
- ✅ Tests con coverage
- ✅ Build de todos los proyectos
- ✅ Sube coverage a Codecov (opcional)

**Duración aproximada**: 5-8 minutos

### 2. PR Checks (`pr.yml`)

**Trigger**: Pull requests a `main` o `develop`

**Funcionalidad**:

- ✅ Ejecuta solo proyectos **afectados** (más rápido con Nx)
- ✅ Valida schema de Prisma
- ✅ Verifica formato de código
- ✅ Lint de código afectado
- ✅ Tests de código afectado
- ✅ Build de código afectado
- ✅ Etiqueta PRs por tamaño (S/M/L/XL)
- ✅ Revisa dependencias por vulnerabilidades

**Duración aproximada**: 3-5 minutos (solo afectados)

### 3. CodeRabbit (`coderabbit.yml`)

**Trigger**: Pull requests (opened, synchronize, reopened)

**Funcionalidad**:

- 🤖 Review automático de código con IA
- 📝 Comentarios inline en el PR
- 🔍 Detecta bugs potenciales
- 💡 Sugerencias de mejora

**Configuración**: Ver [.coderabbit.yaml](../../.coderabbit.yaml)

## Variables de Entorno Requeridas

### Secrets de GitHub (Settings → Secrets and variables → Actions)

| Secret          | Descripción                         | Requerido  |
| --------------- | ----------------------------------- | ---------- |
| `CODECOV_TOKEN` | Token para subir coverage a Codecov | Opcional   |
| `GITHUB_TOKEN`  | Auto-generado por GitHub            | Automático |

## Labels de GitHub

Estos labels son creados automáticamente por el workflow de PR:

- `size/S` - PR pequeño (<200 líneas)
- `size/M` - PR mediano (200-500 líneas)
- `size/L` - PR grande (500-1000 líneas)
- `size/XL` - PR muy grande (>1000 líneas) ⚠️

## Badges para README

Agrega estos badges al README.md principal:

```markdown
![CI](https://github.com/saxoboy/reputation-manager/workflows/CI/badge.svg)
![PR Checks](https://github.com/saxoboy/reputation-manager/workflows/PR%20Checks/badge.svg)
[![codecov](https://codecov.io/gh/saxoboy/reputation-manager/branch/main/graph/badge.svg)](https://codecov.io/gh/saxoboy/reputation-manager)
```

## Configuración de Branch Protection

### Para `main`:

```
Settings → Branches → Add rule

Branch name pattern: main

☑️ Require status checks to pass before merging
  - CI Pipeline
  - PR Validation
  - Dependency Review
☑️ Require branches to be up to date before merging
☑️ Require conversation resolution before merging
☑️ Require linear history
☑️ Do not allow bypassing the above settings
```

### Para `develop`:

```
Branch name pattern: develop

☑️ Require status checks to pass before merging
  - PR Validation
☑️ Require branches to be up to date before merging
```

## Troubleshooting

### Error: "prisma command not found"

**Solución**: Asegúrate de que `prisma` está en `devDependencies` y ejecuta `pnpm install`.

### Error: "Can't reach database server"

**Solución**: El servicio PostgreSQL tarda ~10s en iniciar. El workflow ya incluye health checks.

### Tests fallan solo en CI

**Solución**: Verifica que las variables de entorno en el workflow coincidan con las de `.env.example`.

### El workflow es muy lento

**Solución**: Usa `pr.yml` que ejecuta solo proyectos afectados con `nx affected`.

## Comandos Locales Equivalentes

Replica los checks localmente antes de hacer push:

```bash
# Lint
pnpm lint

# Format check
pnpm format:check

# Tests
pnpm test

# Build
pnpm build

# Prisma validation
pnpm prisma:validate
```

## Próximos Pasos

- [ ] Configurar Codecov (opcional)
- [ ] Agregar workflow de deployment a Railway
- [ ] Agregar workflow de release automático
- [ ] Configurar branch protection rules
- [ ] Crear labels adicionales (bug, feature, enhancement)
