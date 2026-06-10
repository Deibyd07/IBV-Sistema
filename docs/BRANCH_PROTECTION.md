# Branch Protection Rules - Sistema IBV

Configuración recomendada de protección de ramas para GitHub.

## 🔒 Configurar Branch Protection

### Para la rama `main`

1. Ve a **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Configurar las siguientes opciones:

#### Require a pull request before merging
- ☑️ Habilitado
- Required approvals: 1
- ☑️ Dismiss stale pull request approvals when new commits are pushed
- ☑️ Require review from Code Owners (opcional)

#### Require status checks to pass before merging
- ☑️ Habilitado
- ☑️ Require branches to be up to date before merging
- **Status checks requeridos:**
  - `backend-tests (3.12)` - Tests de backend con Python 3.12
  - `backend-tests (3.13)` - Tests de backend con Python 3.13
  - `frontend-tests (18.x)` - Tests de frontend con Node 18
  - `frontend-tests (20.x)` - Tests de frontend con Node 20

#### Otras opciones recomendadas
- ☑️ Require conversation resolution before merging
- ☑️ Require signed commits (opcional, para mayor seguridad)
- ☐ Require linear history (opcional)
- ☑️ Include administrators (todos siguen las mismas reglas)
- ☑️ Restrict who can push to matching branches (opcional)

---

### Para la rama `develop`

1. Ve a **Settings** → **Branches** → **Add rule** 
2. Branch name pattern: `develop`
3. Configurar las siguientes opciones:

#### Require a pull request before merging
- ☑️ Habilitado
- Required approvals: 1
- ☑️ Dismiss stale pull request approvals when new commits are pushed

#### Require status checks to pass before merging
- ☑️ Habilitado
- ☑️ Require branches to be up to date before merging
- **Status checks requeridos:**
  - `backend-tests (3.12)`
  - `backend-tests (3.13)`
  - `frontend-tests (18.x)`
  - `frontend-tests (20.x)`

#### Otras opciones
- ☑️ Require conversation resolution before merging
- ☑️ Include administrators
- ☐ Restrict who can push (más flexible que main)

---

## 📋 Checklist de Configuración

### Paso 1: Ejecutar Workflows por Primera Vez
- [ ] Hacer push a `develop` para activar los workflows
- [ ] Verificar que todos los jobs pasen exitosamente
- [ ] Revisar los logs en GitHub Actions

### Paso 2: Configurar Branch Protection
- [ ] Crear regla para `main`
- [ ] Crear regla para `develop`
- [ ] Verificar que los status checks aparezcan en la lista

### Paso 3: Probar la Configuración
- [ ] Crear una rama de feature
- [ ] Hacer cambios en backend o frontend
- [ ] Abrir un Pull Request hacia `develop`
- [ ] Verificar que los workflows se ejecuten automáticamente
- [ ] Verificar que no se pueda mergear sin que pasen los checks

### Paso 4: Configurar Notificaciones (Opcional)
- [ ] Configurar notificaciones de email para workflows fallidos
- [ ] Configurar integración con Slack/Discord (opcional)

---

## 🚫 Reglas de Merge

### ✅ Merge Permitido Cuando:

1. **Todos los status checks pasan**
   - Backend tests (Python 3.12 y 3.13)
   - Frontend tests (Node 18.x y 20.x)
   - Linting (Black, Flake8, ESLint, Prettier)
   - Build exitoso

2. **Pull Request aprobado**
   - Al menos 1 aprobación de otro developer

3. **Conflictos resueltos**
   - No hay conflictos de merge con la rama base

4. **Conversaciones resueltas**
   - Todos los comentarios marcados como resueltos

### ❌ Merge Bloqueado Cuando:

- ❌ Algún status check falla
- ❌ Tests no pasan
- ❌ Linting tiene errores
- ❌ Build falla
- ❌ No hay aprobación de PR
- ❌ Hay conflictos sin resolver
- ❌ Hay conversaciones sin resolver

---

## 🔐 Requerimientos Adicionales (Opcional)

### Signed Commits

Para requerir commits firmados (mayor seguridad):

```bash
# Configurar GPG key
git config --global commit.gpgsign true

# Verificar firma
git log --show-signature
```

### CODEOWNERS File

Crear archivo `.github/CODEOWNERS`:

```
# Backend
/backend/ @dev-backend-lead
/requirements.txt @dev-backend-lead

# Frontend
/frontend/ @dev-frontend-lead

# CI/CD
/.github/ @dev-backend-lead @dev-frontend-lead
/scripts/ @dev-backend-lead @dev-frontend-lead

# Docs
/docs/ @dev-backend-lead @dev-frontend-lead @dev-fullstack
```

---

## 🎯 Estrategia de Ramas

### Flujo Recomendado

```
main (producción)
  ↑
  PR con todos los checks ✅
  ↑
develop (staging)
  ↑
  PR con todos los checks ✅
  ↑
feature/IBV-XX-descripcion (desarrollo)
```

### Comandos Básicos

```bash
# Crear feature branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/IBV-XX-mi-feature

# Trabajar en la feature
git add .
git commit -m "feat(module): descripción"

# Ejecutar pre-commit checks
.\scripts\pre-commit-backend.ps1   # Si tocaste backend
.\scripts\pre-commit-frontend.ps1  # Si tocaste frontend

# Push y crear PR
git push origin feature/IBV-XX-mi-feature
# Luego crear PR en GitHub hacia develop
```

---

## 📊 Monitoreo de Calidad

### Métricas a Monitorear

1. **Build Success Rate**
   - Objetivo: >95% de workflows exitosos
   - Ver en: GitHub Actions dashboard

2. **Test Coverage**
   - Backend objetivo: >80%
   - Frontend objetivo: >70%
   - Ver en: Coverage reports

3. **Time to Merge**
   - Tiempo promedio desde PR hasta merge
   - Objetivo: <24 horas para PRs pequeños

4. **Failed Builds**
   - Identificar causas comunes
   - Mejorar pre-commit checks

---

## 🛠️ Troubleshooting

### No aparecen los Status Checks

**Solución:**
1. Asegúrate de que los workflows se hayan ejecutado al menos una vez
2. Los nombres de los checks deben coincidir exactamente con los job names en los workflows
3. Espera a que se complete al menos un workflow run

### Status Check siempre falla

**Solución:**
1. Revisa los logs en GitHub Actions
2. Ejecuta los scripts de pre-commit localmente
3. Verifica que todas las dependencias estén actualizadas

### No puedo hacer push directo a main/develop

**Esto es intencional** ✅
- Usa Pull Requests para todos los cambios
- Asegura code review y quality checks

---

## 📚 Referencias

- [About Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [Code Owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
