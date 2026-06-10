# 🔧 Solución de Errores en CI/CD

## Problemas Detectados y Soluciones

### ❌ Error 1: Conflicto de Configuración ESLint (Frontend)

**Síntoma:**
```
CI de frontend / pruebas de frontend (18.x) - Fallando después de 8-10 segundos
```

**Causa:**
- Existían dos archivos de configuración ESLint en conflicto:
  - `frontend/.eslintrc.json` (básico)
  - `frontend/.eslintrc.cjs` (completo con Nuxt 3)
- ESLint no sabía cuál usar y fallaba

**Solución Aplicada:**
✅ Se eliminó `frontend/.eslintrc.json`
✅ Se mantiene `frontend/.eslintrc.cjs` (configurado para Nuxt 3 + TypeScript)

---

### ❌ Error 2: Vercel - Permisos de Deployment

**Síntoma:**
```
⚠️ Vercel - El autor de Git, Deibyd07, debe tener acceso al proyecto en Vercel para crear implementaciones.
```

**Causa:**
- El repositorio tiene integración con Vercel
- Tu usuario de GitHub no tiene permisos en el proyecto de Vercel
- Vercel intenta hacer deploy automático pero no puede

**Soluciones Posibles:**

#### Opción A: Dar Acceso en Vercel (Recomendado)
1. Ve a https://vercel.com
2. Inicia sesión con tu cuenta
3. Ve al proyecto "Sistema-IBV" (o como se llame)
4. Settings → Team Members → Invite
5. Agrega tu usuario de GitHub: `Deibyd07`
6. Asigna rol de Developer o Admin

#### Opción B: Deshabilitar Vercel Temporarily
Si no necesitas deploy automático ahora:

1. Ve a: https://github.com/CamiloTriana75/Sistema-IBV/settings/installations
2. Busca "Vercel"
3. Click "Configure"
4. Suspende la integración temporalmente

#### Opción C: Desactivar Check de Vercel en Branch Protection
1. Ve a: https://github.com/CamiloTriana75/Sistema-IBV/settings/branches
2. Edita la regla de protección
3. En "Status checks", desmarca "Vercel"
4. Esto permite mergear sin esperar Vercel

---

### ❌ Error 3: Backend Tests Fallando

**Síntoma:**
```
Backend CI / backend-tests (3.12) - Failing after 36s
```

**Posibles Causas:**
1. Falta de variables de entorno en el workflow
2. Migraciones pendientes
3. Tests con errores

**Cómo Diagnosticar:**

1. **Ver los logs en GitHub:**
   - Ve a: https://github.com/CamiloTriana75/Sistema-IBV/actions
   - Click en el workflow "Backend CI" que falló
   - Expande cada paso para ver dónde falló:
     - ✅ Black check
     - ✅ Flake8
     - ❌ Django tests ← probablemente aquí
     - ❌ Coverage

2. **Revisar localmente:**
   ```powershell
   cd backend
   python manage.py test --verbosity=2
   ```

3. **Verificar migraciones:**
   ```powershell
   cd backend
   python manage.py makemigrations --dry-run
   python manage.py migrate
   ```

**Soluciones Comunes:**

#### Si faltan variables de entorno:
El workflow ya tiene configuradas las variables básicas:
```yaml
env:
  SECRET_KEY: "test-secret-key-for-ci"
  DEBUG: "False"
  DATABASE_URL: "sqlite:///db.sqlite3"
```

Si necesitas más variables (ej: SUPABASE_URL), agrégalas al workflow.

#### Si hay tests con errores:
```powershell
# Ver detalles del error
cd backend
python manage.py test --verbosity=2 --failfast

# Corregir el test
# Luego commit y push
```

#### Si hay migraciones pendientes:
```powershell
cd backend
python manage.py makemigrations
python manage.py migrate
git add backend/*/migrations/
git commit -m "fix: agregar migraciones pendientes"
git push
```

---

### ❌ Error 4: Frontend Build Fallando

**Síntoma:**
```
CI de frontend / pruebas de frontend (20.x) - Fallando
```

**Posibles Causas:**
1. Dependencias desactualizadas o conflictivas
2. Errores de sintaxis en componentes
3. Variables de entorno faltantes

**Cómo Diagnosticar:**

1. **Ver los logs en GitHub:**
   - Ve a: https://github.com/CamiloTriana75/Sistema-IBV/actions
   - Click en el workflow "Frontend CI" que falló
   - Identifica el paso que falla:
     - ✅ Install dependencies
     - ❌ ESLint ← podría ser aquí
     - ❌ Build ← o aquí

2. **Probar localmente:**
   ```powershell
   cd frontend
   Remove-Item node_modules -Recurse -Force
   Remove-Item package-lock.json -Force
   npm install
   npm run lint
   npm run build
   ```

**Soluciones Comunes:**

#### Si hay errores de ESLint:
```powershell
cd frontend
npm run lint -- --fix
```

#### Si hay errores de build:
```powershell
cd frontend
npm run build -- --verbose
# Ver el error específico y corregir
```

#### Si faltan variables de entorno:
El workflow tiene configurada:
```yaml
env:
  NUXT_PUBLIC_API_BASE: "http://localhost:8000/api"
```

Si necesitas más, agrégalas al workflow o crea `.env.example`.

---

## ✅ Checklist de Verificación

Después de aplicar las correcciones:

- [ ] ESLint duplicado eliminado (`frontend/.eslintrc.json`)
- [ ] Backend tests pasan localmente
- [ ] Frontend build funciona localmente
- [ ] Variables de entorno configuradas
- [ ] Migraciones aplicadas
- [ ] Commit y push de correcciones
- [ ] Workflows pasan en GitHub Actions
- [ ] Vercel configurado o deshabilitado

---

## 🚀 Pasos Siguientes

### 1. Verificar Correcciones Localmente

```powershell
# Backend
cd backend
python manage.py test
python manage.py makemigrations --check

# Frontend  
cd ../frontend
npm run lint
npm run format:check
npm run build
```

### 2. Commit y Push

```powershell
git add .
git commit -m "fix(ci): corregir conflictos ESLint y errores de workflow"
git push origin IBV-10-configurar-ci-cd-con-github-actions
```

### 3. Verificar en GitHub Actions

1. Ve a: https://github.com/CamiloTriana75/Sistema-IBV/actions
2. Espera que terminen los workflows
3. Verifica que todos pasen: ✅

### 4. Resolver Vercel

Decide cuál opción tomar (A, B, o C de arriba)

### 5. Crear Pull Request

Una vez que todo pase:
```
Desde: IBV-10-configurar-ci-cd-con-github-actions
Hacia: develop
```

---

## 📞 Si Sigues Teniendo Problemas

1. **Ver logs detallados:**
   - GitHub Actions → Click en workflow fallido → Ver logs

2. **Ejecutar script pre-commit:**
   ```powershell
   .\scripts\pre-commit-backend.ps1
   .\scripts\pre-commit-frontend.ps1
   ```

3. **Limpiar y reinstalar:**
   ```powershell
   # Backend
   cd backend
   pip uninstall -r requirements.txt -y
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   
   # Frontend
   cd ../frontend
   Remove-Item node_modules -Recurse -Force
   npm install
   ```

---

**Última actualización:** 23 de febrero de 2026  
**Related Docs:**
- [docs/GITHUB_ACTIONS_CONFIG.md](GITHUB_ACTIONS_CONFIG.md)
- [docs/GITHUB_ACTIONS_STATUS.md](GITHUB_ACTIONS_STATUS.md)
