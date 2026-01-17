# GitHub Labels Configuration

Este archivo contiene la configuración de labels para el repositorio.

## Labels de Tamaño (Auto-generados)

Estos labels son creados automáticamente por el workflow `pr.yml`:

- `size/S` - 🟢 PR pequeño (<200 líneas)
- `size/M` - 🟡 PR mediano (200-500 líneas)
- `size/L` - 🟠 PR grande (500-1000 líneas)
- `size/XL` - 🔴 PR muy grande (>1000 líneas)

## Labels Sugeridos Adicionales

Puedes crear estos manualmente en GitHub (Settings → Labels):

### Tipo

- `type: feature` - Nueva funcionalidad - `#0E8A16`
- `type: bug` - Bug fix - `#D73A4A`
- `type: enhancement` - Mejora de feature existente - `#A2EEEF`
- `type: docs` - Cambios en documentación - `#0075CA`
- `type: refactor` - Refactorización de código - `#FBCA04`
- `type: test` - Agregar o mejorar tests - `#1D76DB`
- `type: chore` - Tareas de mantenimiento - `#FEF2C0`

### Prioridad

- `priority: critical` - Crítico, arreglar ASAP - `#B60205`
- `priority: high` - Alta prioridad - `#D93F0B`
- `priority: medium` - Prioridad media - `#FBCA04`
- `priority: low` - Baja prioridad - `#0E8A16`

### Estado

- `status: blocked` - Bloqueado por dependencia - `#D73A4A`
- `status: in-progress` - En progreso - `#FBCA04`
- `status: needs-review` - Necesita review - `#0075CA`
- `status: ready` - Listo para merge - `#0E8A16`

### Áreas

- `area: api` - Backend API - `#D4C5F9`
- `area: web` - Frontend Web - `#C5DEF5`
- `area: worker` - Background Worker - `#BFD4F2`
- `area: database` - Database/Prisma - `#F9D0C4`
- `area: integrations` - Integraciones externas - `#FEF2C0`

### Otros

- `good first issue` - Bueno para contributors nuevos - `#7057FF`
- `help wanted` - Se necesita ayuda - `#008672`
- `breaking change` - Cambio que rompe compatibilidad - `#D73A4A`
- `dependencies` - Actualización de dependencias - `#0366D6`
- `security` - Relacionado con seguridad - `#EE0701`

## Crear Labels Automáticamente

Puedes usar GitHub CLI para crearlos:

```bash
# Instalar GitHub CLI: https://cli.github.com/

# Tipo
gh label create "type: feature" --color 0E8A16 --description "Nueva funcionalidad"
gh label create "type: bug" --color D73A4A --description "Bug fix"
gh label create "type: enhancement" --color A2EEEF --description "Mejora de feature"
gh label create "type: docs" --color 0075CA --description "Documentación"
gh label create "type: refactor" --color FBCA04 --description "Refactorización"
gh label create "type: test" --color 1D76DB --description "Tests"
gh label create "type: chore" --color FEF2C0 --description "Mantenimiento"

# Prioridad
gh label create "priority: critical" --color B60205 --description "Crítico"
gh label create "priority: high" --color D93F0B --description "Alta prioridad"
gh label create "priority: medium" --color FBCA04 --description "Prioridad media"
gh label create "priority: low" --color 0E8A16 --description "Baja prioridad"

# Tamaño (si no se crean automáticamente)
gh label create "size/S" --color 0E8A16 --description "PR pequeño (<200 líneas)"
gh label create "size/M" --color FBCA04 --description "PR mediano (200-500 líneas)"
gh label create "size/L" --color FE7D37 --description "PR grande (500-1000 líneas)"
gh label create "size/XL" --color D73A4A --description "PR muy grande (>1000 líneas)"

# Áreas
gh label create "area: api" --color D4C5F9 --description "Backend API"
gh label create "area: web" --color C5DEF5 --description "Frontend Web"
gh label create "area: worker" --color BFD4F2 --description "Worker"
gh label create "area: database" --color F9D0C4 --description "Database"
```

## O importa este JSON

Guarda como `labels.json` e importa con GitHub CLI:

```json
[
  { "name": "type: feature", "color": "0E8A16", "description": "Nueva funcionalidad" },
  { "name": "type: bug", "color": "D73A4A", "description": "Bug fix" },
  { "name": "type: enhancement", "color": "A2EEEF", "description": "Mejora de feature" },
  { "name": "type: docs", "color": "0075CA", "description": "Documentación" },
  { "name": "priority: critical", "color": "B60205", "description": "Crítico" },
  { "name": "priority: high", "color": "D93F0B", "description": "Alta" },
  { "name": "size/S", "color": "0E8A16", "description": "Pequeño" },
  { "name": "size/M", "color": "FBCA04", "description": "Mediano" },
  { "name": "size/L", "color": "FE7D37", "description": "Grande" },
  { "name": "size/XL", "color": "D73A4A", "description": "Muy grande" }
]
```

```bash
cat labels.json | jq -c '.[]' | while read label; do
  gh label create "$(echo $label | jq -r .name)" \
    --color "$(echo $label | jq -r .color)" \
    --description "$(echo $label | jq -r .description)"
done
```
