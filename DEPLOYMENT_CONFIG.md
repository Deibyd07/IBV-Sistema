# 🚀 Configuración de Deployment

## Variables de Entorno para Render

Ve a tu proyecto en Render Dashboard: https://sistema-ibv-backend.onrender.com
**Settings > Environment** y agrega estas variables:

```bash
# Django Core
SECRET_KEY=6mm4y8j_s#ik432=8xutszy^lnyh(z)+vs8ygbrqr+-)rkxtci
DEBUG=False
ALLOWED_HOSTS=sistema-ibv-backend.onrender.com

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.qocpopgcpleijmhuznyi:Deicastillo321.@aws-0-us-west-2.pooler.supabase.com:6543/postgres

# CORS
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://sistema-drindeyfs-camilos-projects-9cf6fda2.vercel.app

# Supabase
SUPABASE_URL=https://qocpopgcpleijmhuznyi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvY3BvcGdjcGxlaWptaHV6bnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODE4NzcsImV4cCI6MjA4NzU1Nzg3N30.JtooQww0FgHQCcPtGM9aXrHL6aYRy4MWVJMMSJCfd6A
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvY3BvcGdjcGxlaWptaHV6bnlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4MTg3NywiZXhwIjoyMDg3NTU3ODc3fQ.tJydVDAkC_04HqnDT9FXlxpoMoE1DTm-y3OcPkeJQ3Y

# Timezone
TZ=America/Bogota
LOG_LEVEL=INFO
```

## Variables de Entorno para Vercel

Ve a tu proyecto en Vercel Dashboard:
**Settings > Environment Variables** y agrega:

```bash
# API Backend
NUXT_PUBLIC_API_BASE=https://sistema-ibv-backend.onrender.com/api

# Supabase (Frontend)
NUXT_PUBLIC_SUPABASE_URL=https://qocpopgcpleijmhuznyi.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvY3BvcGdjcGxlaWptaHV6bnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODE4NzcsImV4cCI6MjA4NzU1Nzg3N30.JtooQww0FgHQCcPtGM9aXrHL6aYRy4MWVJMMSJCfd6A
```

**IMPORTANTE**: Aplica estas variables a:
- ✅ **Production** (obligatorio)
- ✅ **Preview** (recomendado)
- ⬜ Development (opcional)

## Verificación de Deployment

### 1. Backend (Render) - Verificar que está activo

```bash
# Prueba la API
curl https://sistema-ibv-backend.onrender.com/api/users/

# Verifica el admin
curl https://sistema-ibv-backend.onrender.com/admin/

# Verifica el health check (si tienes uno)
curl https://sistema-ibv-backend.onrender.com/api/
```

**Resultado esperado**: Respuesta JSON o HTML (no error 404/500)

### 2. Frontend (Vercel) - Verificar que carga

Abre en navegador:
```
https://sistema-drindeyfs-camilos-projects-9cf6fda2.vercel.app
```

**Resultado esperado**: La página de login debe cargar con animaciones GSAP

### 3. Verificar Conexión Frontend ↔ Backend

#### En el Navegador (Método más fácil):

1. **Abre el frontend en el navegador**
2. **Presiona F12** para abrir DevTools
3. **Ve a la pestaña "Network"** (Red)
4. **Intenta hacer login o cualquier acción que llame al API**
5. **Busca peticiones a** `sistema-ibv-backend.onrender.com`

**✅ Conexión exitosa:**
- Status: 200, 201, etc.
- Headers: `access-control-allow-origin` presente
- Response: Datos JSON del backend

**❌ Si hay problemas:**

```
CORS Error en Console:
"Access to fetch at 'https://sistema-ibv-backend.onrender.com/api/...' 
from origin 'https://sistema-drindeyfs-camilos-projects-9cf6fda2.vercel.app' 
has been blocked by CORS policy"
```
**Solución**: Verifica que `CORS_ALLOWED_ORIGINS` en Render incluya la URL exacta de Vercel

```
404 Not Found:
"GET https://sistema-ibv-backend.onrender.com/api/users/ 404"
```
**Solución**: Backend no está deployado correctamente o ruta incorrecta

```
500 Internal Server Error:
```
**Solución**: Ve a Render Dashboard > Logs para ver el error de Django

#### Desde Terminal (Verificación técnica):

```bash
# Prueba una petición específica del login
curl -X POST https://sistema-ibv-backend.onrender.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -H "Origin: https://sistema-drindeyfs-camilos-projects-9cf6fda2.vercel.app" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -v

# Verifica headers CORS
curl -I -X OPTIONS https://sistema-ibv-backend.onrender.com/api/users/ \
  -H "Origin: https://sistema-drindeyfs-camilos-projects-9cf6fda2.vercel.app" \
  -H "Access-Control-Request-Method: GET"
```

**Busca en la respuesta:**
- `access-control-allow-origin: https://sistema-drindeyfs-camilos-projects-9cf6fda2.vercel.app`
- `access-control-allow-credentials: true`

### 4. Ver Logs en Producción

#### Logs de Render (Backend):
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio **sistema-ibv-backend**
3. Click en **"Logs"** en el menú lateral
4. Busca errores 500, excepciones de Django, o problemas de CORS

#### Logs de Vercel (Frontend):
1. Ve a https://vercel.com
2. Selecciona tu proyecto
3. Click en **"Deployments"** > Latest deployment
4. Click en **"View Function Logs"** (si tienes funciones serverless)
5. O revisa **Runtime Logs**

### 5. Prueba Local para Comparar

```bash
# Terminal 1: Backend local
cd backend
python manage.py runserver

# Terminal 2: Frontend local
cd frontend
npm run dev
```

Si funciona en local pero no en producción, probablemente es un problema de variables de entorno o CORS.

## Re-deploy después de configurar variables

### En Render:
1. Settings > Manual Deploy > "Deploy latest commit"
2. O hacer push a tu rama principal

### En Vercel:
1. Deployments > Latest > "Redeploy"
2. O simplemente espera (auto-redeploy al configurar variables)

## Comandos Git para deployment

```bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: actualizar configuración de .env para producción"

# Push a GitHub (activa auto-deploy)
git push origin main
```

## Notas de Seguridad

⚠️ **NUNCA** commitear archivos .env al repositorio
✅ Los archivos .env ya están en .gitignore
✅ SECRET_KEY y SUPABASE_SERVICE_KEY son confidenciales
✅ Solo SUPABASE_ANON_KEY es segura para exponer públicamente
