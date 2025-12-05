# Migración a Next.js 16 + Tailwind v4

## Cambios Realizados

### ✅ Actualizaciones de Paquetes

1. **Next.js**: 15.2.4 → 16.0.0-canary
2. **Tailwind CSS**: v4.1.17 configurado correctamente
3. **@tailwindcss/postcss**: v4.1.17 agregado

### ✅ Archivos Creados/Modificados

1. **`apps/web/global.css`**: Configuración Tailwind v4 con `@theme`
2. **`apps/web/tailwind.config.ts`**: Config mínima para v4
3. **`apps/web/postcss.config.mjs`**: PostCSS con plugin de Tailwind v4
4. **`apps/web/lib/utils.ts`**: Helper `cn()` para merge de clases
5. **`apps/web/app/layout.tsx`**: Layout actualizado con fuente Inter
6. **`apps/web/app/page.tsx`**: Landing page demo con Tailwind v4
7. **`apps/web/README.md`**: Documentación completa del frontend

## 🚀 Pasos para Ejecutar

### 1. Instalar dependencias

```bash
cd /Users/israelh/Documents/Proyectos/reputation-manager
pnpm install
```

### 2. Levantar el servidor de desarrollo

```bash
# Opción 1: Solo frontend
nx serve web

# Opción 2: Frontend + API + Worker (recomendado)
pnpm dev
```

### 3. Verificar

Abre http://localhost:4000 y deberías ver:
- ✅ Landing page con diseño moderno
- ✅ Tailwind v4 funcionando (gradientes, hover effects)
- ✅ Dark mode automático si tu sistema lo tiene activado
- ✅ Fuente Inter cargando correctamente
- ✅ Animación de "ping" en el badge de status

## 🎨 Tailwind v4 - Cambios Clave

### Antes (v3)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
      },
    },
  },
};
```

### Ahora (v4)

```css
/* global.css */
@theme {
  --color-primary: #3b82f6;
}
```

### Uso en componentes

```tsx
// Mismo que antes, no cambia nada
<div className="bg-primary text-white" />
```

## 🔍 Validar que Todo Funcione

### Test 1: Tailwind Classes

```bash
# Deberías ver colores, spacing, responsive
http://localhost:4000
```

### Test 2: Dark Mode

```bash
# Cambia tu sistema a dark mode y refresca
# Los colores deberían cambiar automáticamente
```

### Test 3: Hot Reload

```bash
# Edita apps/web/app/page.tsx
# Los cambios deberían reflejarse instantáneamente
```

## ⚠️ Posibles Errores

### Error: "Cannot find module '@tailwindcss/postcss'"

**Solución:**

```bash
pnpm install
```

### Error: "Module parse failed: Unexpected token"

**Causa:** PostCSS no configurado correctamente

**Solución:** Verifica que `postcss.config.mjs` existe en `apps/web/`

### Error: Next.js no inicia

**Solución:**

```bash
# Limpiar cache de Nx
pnpm nx reset

# Reinstalar
rm -rf node_modules
pnpm install
```

## 📝 Notas Importantes

1. **Next.js 16 es canary**: Versión preview, puede tener bugs
2. **Tailwind v4**: Nueva sintaxis CSS-first, más rápida
3. **Compatibilidad**: Todas las clases de Tailwind v3 funcionan en v4
4. **Performance**: Tailwind v4 es ~10x más rápido en build

## 🎯 Siguiente Fase

Ahora que tenemos Next.js 16 + Tailwind v4 funcionando:

1. ✅ Configurar Better Auth client
2. ✅ Crear componentes UI base (Button, Input, Card)
3. ✅ Implementar login/register
4. ✅ Crear dashboard layout

## 🚀 Comandos Correctos

```bash
# Instalar dependencias
pnpm install

# Solo frontend (puerto 4000)
nx serve web

# Todo el stack (web + api + worker)
pnpm dev
```

**URL:** http://localhost:4000

¿Continuamos con Better Auth?

