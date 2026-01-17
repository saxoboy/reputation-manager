# 🚀 Configuración Post-Setup de GitHub

Ahora que los workflows están creados, sigue estos pasos para activarlos completamente.

---

## 1. Push de los Workflows a GitHub

```bash
git add .github/workflows/
git add .github/LABELS.md
git add package.json
git add README.md
git add docs/

git commit -m "feat(ci): add GitHub Actions workflows for CI/CD

- Add ci.yml for main CI pipeline
- Add pr.yml for pull request checks
- Add coderabbit.yml for AI code reviews
- Update package.json with CI scripts
- Add CI badges to README
- Complete Phase 0 setup"

git push origin main  # o develop según tu branch
```

---

## 2. Crear Labels en GitHub

### Opción A: Usar GitHub Web UI

1. Ve a: **Settings** → **Labels**
2. Crea los siguientes labels manualmente:

| Label     | Color     | Descripción                  |
| --------- | --------- | ---------------------------- |
| `size/S`  | `#0E8A16` | PR pequeño (<200 líneas)     |
| `size/M`  | `#FBCA04` | PR mediano (200-500 líneas)  |
| `size/L`  | `#FE7D37` | PR grande (500-1000 líneas)  |
| `size/XL` | `#D73A4A` | PR muy grande (>1000 líneas) |

### Opción B: Usar GitHub CLI (Más rápido)

```bash
# Instalar GitHub CLI si no lo tienes
# macOS: brew install gh
# Windows: choco install gh
# Linux: apt install gh

# Autenticarse
gh auth login

# Crear labels de tamaño
gh label create "size/S" --color 0E8A16 --description "PR pequeño (<200 líneas)"
gh label create "size/M" --color FBCA04 --description "PR mediano (200-500 líneas)"
gh label create "size/L" --color FE7D37 --description "PR grande (500-1000 líneas)"
gh label create "size/XL" --color D73A4A --description "PR muy grande (>1000 líneas)"

# Crear labels de tipo (opcional pero recomendado)
gh label create "type: feature" --color 0E8A16 --description "Nueva funcionalidad"
gh label create "type: bug" --color D73A4A --description "Bug fix"
gh label create "type: enhancement" --color A2EEEF --description "Mejora"
gh label create "type: docs" --color 0075CA --description "Documentación"

# Crear labels de prioridad (opcional)
gh label create "priority: critical" --color B60205 --description "Crítico"
gh label create "priority: high" --color D93F0B --description "Alta"
gh label create "priority: medium" --color FBCA04 --description "Media"
gh label create "priority: low" --color 0E8A16 --description "Baja"
```

---

## 3. Configurar Branch Protection Rules

### Para `main` (Producción)

1. Ve a: **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Configura:

```
☑️ Require a pull request before merging
   ☑️ Require approvals: 1
   ☑️ Dismiss stale pull request approvals when new commits are pushed
   ☑️ Require review from Code Owners (si tienes CODEOWNERS)

☑️ Require status checks to pass before merging
   ☑️ Require branches to be up to date before merging
   Busca y selecciona:
   - CI Pipeline
   - PR Validation

☑️ Require conversation resolution before merging

☑️ Require linear history

☑️ Do not allow bypassing the above settings

☑️ Restrict who can push to matching branches (opcional)
```

### Para `develop` (Desarrollo)

1. Branch name pattern: `develop`
2. Configura (menos estricto):

```
☑️ Require a pull request before merging
   Require approvals: 0 (o 1 si prefieres)

☑️ Require status checks to pass before merging
   ☑️ Require branches to be up to date before merging
   Selecciona:
   - PR Validation

☑️ Do not allow bypassing the above settings
```

---

## 4. Configurar CodeRabbit (Opcional pero Recomendado)

**⚠️ IMPORTANTE**: CodeRabbit es una GitHub App, NO un workflow.

### Instalación:

1. Ve a: https://github.com/marketplace/coderabbitai
2. Click en **"Install it for free"** o **"Set up a plan"**
3. Selecciona tu cuenta/organización
4. Elige el repositorio `reputation-manager`
5. Autoriza los permisos necesarios
6. ¡Listo! El archivo `.coderabbit.yaml` ya está configurado

### Verificación:

- Crea un PR de prueba
- CodeRabbit debería comentar automáticamente en 1-2 minutos
- No necesitas ningún workflow adicional

**Beneficios**:

- 🤖 Reviews automáticos con IA en cada PR
- 📝 Comentarios inline inteligentes
- 🔍 Detecta bugs y problemas de seguridad
- 💡 Sugerencias de mejora de código
- 🎓 Aprende de tu estilo de código

**Gratis** para repositorios open source.

---

## 5. Configurar Codecov (Opcional)

Para ver coverage de tests:

1. Ve a: https://codecov.io/
2. **Sign up** con GitHub
3. Agrega tu repositorio
4. Copia el token que te dan
5. En GitHub: **Settings** → **Secrets and variables** → **Actions**
6. Crea un nuevo secret:
   - Name: `CODECOV_TOKEN`
   - Value: [pega el token]

---

## 6. Verificar Workflows

### Primera vez

```bash
# Ver workflows en GitHub
https://github.com/saxoboy/reputation-manager/actions

# Deberías ver "CI" ejecutándose automáticamente después del push
```

### Probar con un PR

```bash
# Crear branch de prueba
git checkout -b test/ci-verification
echo "# Test" >> test.md
git add test.md
git commit -m "test: verify CI workflows"
git push origin test/ci-verification

# Crear PR en GitHub
# Deberías ver:
# - ✅ PR Checks ejecutándose
# - 🤖 CodeRabbit comentando (si lo instalaste)
# - 🏷️ Label de tamaño (size/S) agregado automáticamente
```

---

## 7. Configurar Secrets Adicionales (Para Integraciones Futuras)

En **Settings** → **Secrets and variables** → **Actions**, agrega:

### Para desarrollo (más adelante)

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `STRIPE_SECRET_KEY`
- `SENDGRID_API_KEY`

⚠️ **Nota**: Por ahora NO son necesarios para CI

---

## 8. Verificación Final

Ejecuta localmente los mismos checks que CI:

```bash
# 1. Format
pnpm format:check

# 2. Lint
pnpm lint

# 3. Tests
pnpm test

# 4. Build
pnpm build

# 5. Prisma
pnpm prisma:validate
```

Si todo pasa localmente, también pasará en CI ✅

---

## 9. Habilitar GitHub Discussions (Opcional)

Para comunidad y feedback:

1. **Settings** → **Features**
2. ☑️ **Discussions**
3. Configura categorías:
   - Announcements
   - General
   - Ideas
   - Q&A
   - Show and tell

---

## 10. Crear CODEOWNERS (Opcional)

Crea `.github/CODEOWNERS`:

```
# Reputation Manager - Code Owners

# Default owner para todo
* @saxoboy

# Específicos por área
/apps/web/ @saxoboy
/apps/api/ @saxoboy
/apps/worker/ @saxoboy
/libs/database/ @saxoboy

# Documentación
/docs/ @saxoboy
*.md @saxoboy

# CI/CD
/.github/ @saxoboy
```

---

## ✅ Checklist Final

Antes de continuar con Phase 1, verifica:

- [ ] Workflows pusheados a GitHub
- [ ] CI ejecutándose correctamente
- [ ] Labels creados
- [ ] Branch protection en `main` configurado
- [ ] Branch protection en `develop` configurado
- [ ] CodeRabbit instalado (opcional)
- [ ] Codecov configurado (opcional)
- [ ] Secrets configurados (los que necesites)
- [ ] Un PR de prueba creado y aprobado
- [ ] Badges en README funcionando

---

## 🆘 Troubleshooting

### "Workflow not found"

**Solución**: Asegúrate de haber hecho push de `.github/workflows/`

### "Required status check not found"

**Solución**: Espera a que el workflow se ejecute al menos una vez antes de configurar branch protection

### "GITHUB_TOKEN permissions"

**Solución**: En Settings → Actions → General → Workflow permissions, selecciona "Read and write permissions"

### "CodeRabbit not commenting"

**Solución**: Verifica que la app esté instalada en el repo y que tengas permisos

---

## 📚 Recursos Adicionales

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Nx Affected Commands](https://nx.dev/concepts/affected)
- [CodeRabbit Docs](https://docs.coderabbit.ai/)
- [Codecov Docs](https://docs.codecov.com/)

---

**¡Listo para Phase 1! 🚀**
