# Configuración de GitHub Actions

Este documento explica cómo están configurados los workflows de CI/CD y cómo monitorearlo.

## 📋 Estado de los Workflows

Para ver el estado de los workflows:

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **Actions**
3. Verás todos los workflows ejecutándose o completados

## 🔧 Workflows Configurados

### 1. Backend CI (`backend-ci.yml`)

**Ubicación:** `.github/workflows/backend-ci.yml`

**Cuándo se ejecuta:**
- Push a `develop` o `main` que modifique:
  - Archivos en `backend/`
  - `requirements.txt`
  - El propio workflow
- Pull Requests hacia `develop` o `main`

**Pasos:**
1. Checkout del código
2. Setup de Python (3.12 y 3.13)
3. Instalación de dependencias
4. Black - Verificación de formato
5. Flake8 - Linting
6. Django migrations check
7. Tests unitarios
8. Coverage report
9. Upload a Codecov (opcional)

**Variables de entorno necesarias:**
- `SECRET_KEY` - Definida en el workflow (para tests)
- `DEBUG` - False (para tests)
- `DATABASE_URL` - SQLite en memoria (para tests)

### 2. Frontend CI (`frontend-ci.yml`)

**Ubicación:** `.github/workflows/frontend-ci.yml`

**Cuándo se ejecuta:**
- Push a `develop` o `main` que modifique:
  - Archivos en `frontend/`
  - El propio workflow
- Pull Requests hacia `develop` o `main`

**Pasos:**
1. Checkout del código
2. Setup de Node.js (18.x y 20.x)
3. Instalación de dependencias (npm ci)
4. ESLint - Linting
5. Prettier - Verificación de formato
6. Type check (TypeScript)
7. Build del proyecto
8. Tests (si existen)

**Variables de entorno necesarias:**
- `NUXT_PUBLIC_API_BASE` - Definida en el workflow

## 🔐 Secretos de GitHub (GitHub Secrets)

Para configurar secretos necesarios:

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click en "New repository secret"

### Secretos Opcionales

#### Para Codecov (Coverage Reports)
- **Nombre:** `CODECOV_TOKEN`
- **Valor:** Token de Codecov (obtener de https://codecov.io)
- **Usado en:** Backend CI workflow

#### Para Deploy Automático (Futuro)
- **Nombre:** `VERCEL_TOKEN` (para frontend)
- **Valor:** Token de Vercel
- **Usado en:** Deploy workflow (cuando se cree)

- **Nombre:** `RAILWAY_TOKEN` (para backend)
- **Valor:** Token de Railway
- **Usado en:** Deploy workflow (cuando se cree)

## 📊 Badges de Estado

Los badges se agregan en el README.md para mostrar el estado de los workflows.

### Formato de Badges

```markdown
![Backend CI](https://github.com/USUARIO/REPO/workflows/Backend%20CI/badge.svg)
![Frontend CI](https://github.com/USUARIO/REPO/workflows/Frontend%20CI/badge.svg)
```

**Reemplazar:**
- `USUARIO` por el nombre de usuario de GitHub (ej: CamiloTriana75)
- `REPO` por el nombre del repositorio (ej: Sistema-IBV)

## 🔍 Monitoreo de Workflows

### Ver logs de un workflow

1. Ve a la pestaña **Actions**
2. Click en el workflow que quieres ver
3. Click en el job específico (ej: "backend-tests")
4. Expande los pasos para ver los logs detallados

### Descargar artefactos

Si un workflow genera artefactos (como reportes de coverage):
1. Ve al workflow completado
2. Scroll down hasta "Artifacts"
3. Descarga el artefacto

## 🐛 Troubleshooting

### Workflow falla en "Install dependencies"

**Backend:**
```bash
# Verifica que requirements.txt y requirements-dev.txt sean válidos
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

**Frontend:**
```bash
# Verifica que package.json sea válido
npm ci
```

### Workflow falla en tests

**Backend:**
```bash
# Ejecuta los tests localmente
cd backend
python manage.py test
```

**Frontend:**
```bash
# Ejecuta los tests localmente
cd frontend
npm run test
```

### Workflow falla en linting

**Backend:**
```bash
# Ejecuta el script de pre-commit
.\scripts\pre-commit-backend.ps1
```

**Frontend:**
```bash
# Ejecuta el script de pre-commit
.\scripts\pre-commit-frontend.ps1
```

## 🚀 Próximos Pasos

### 1. Agregar Deploy Automático

Crear workflows para:
- Deploy de frontend a Vercel/Netlify
- Deploy de backend a Railway/Heroku

### 2. Agregar Notificaciones

Configurar notificaciones de Slack/Discord cuando:
- Un workflow falla
- Un deployment se completa

### 3. Agregar Branch Protection

En GitHub Settings:
1. Branches → Add rule
2. Branch name pattern: `main` y `develop`
3. ☑️ Require status checks to pass before merging
4. Seleccionar los workflows que deben pasar

### 4. Agregar Coverage Reports

1. Crear cuenta en Codecov.io
2. Agregar el repositorio
3. Copiar el token
4. Agregar como secret en GitHub: `CODECOV_TOKEN`

## 📚 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Encrypted Secrets](https://docs.github.com/en/actions/reference/encrypted-secrets)
- [Status Badges](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge)

## 📞 Soporte

Si tienes problemas con los workflows:

1. Revisa los logs en la pestaña Actions
2. Ejecuta los scripts de pre-commit localmente
3. Verifica que todas las dependencias estén instaladas
4. Consulta la documentación en `.github/README.md`
