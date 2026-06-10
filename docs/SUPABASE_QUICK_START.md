# Guía de Implementación Paso a Paso - Supabase PostgreSQL

## 🚀 Inicio Rápido

Esta guía te llevará de tener SQLite local a tener PostgreSQL en Supabase en **menos de 30 minutos**.

### ✅ Pre-requisitos

- [ ] Cuenta en GitHub/Google (para Supabase)
- [ ] Python 3.12+ instalado
- [ ] Git configurado
- [ ] Acceso al repositorio Sistema-IBV

---

## 📝 Checklist de Implementación

### Fase 1: Configuración de Supabase (15 min)

- [ ] Crear cuenta en Supabase
- [ ] Crear proyecto `sistema-ibv-prod`
- [ ] Obtener credenciales de conexión
- [ ] Configurar políticas RLS
- [ ] Verificar conectividad

### Fase 2: Configuración de Django (10 min)

- [ ] Crear archivo `.env`
- [ ] Actualizar credenciales
- [ ] Ejecutar migraciones
- [ ] Crear superusuario
- [ ] Testing de conexión

### Fase 3: Migración de Datos (5 min - opcional)

- [ ] Backup de datos SQLite
- [ ] Migración de datos
- [ ] Validación de integridad

---

## 🎯 Fase 1: Configuración de Supabase

### Paso 1.1: Crear Cuenta y Proyecto

**Tiempo estimado: 5 minutos**

1. **Ir a Supabase**
   ```
   https://supabase.com
   ```

2. **Crear cuenta / Iniciar sesión**
   - Opción recomendada: GitHub OAuth
   - Alternativa: Email

3. **Crear nuevo proyecto**
   ```
   Click en: "New Project"
   ```

4. **Configurar proyecto**
   ```
   Organization: [Crear nueva o seleccionar existente]
   Name: sistema-ibv-prod
   Database Password: [GENERAR CONTRASEÑA SEGURA]
   Region: South America (São Paulo)
         o East US (North Virginia) según ubicación
   Pricing Plan: Free (para desarrollo) o Pro (producción)
   ```

   ⚠️ **IMPORTANTE**: Guardar la contraseña generada en lugar seguro (no se puede recuperar).

5. **Esperar provisión**
   - Tarda ~2 minutos
   - Verás una barra de progreso

### Paso 1.2: Obtener Credenciales

**Tiempo estimado: 3 minutos**

Una vez creado el proyecto:

1. **Ir a Settings > Database**

2. **Copiar Connection String**

   Encontrarás algo como:
   ```
   Host: db.abcdefghijklmnop.supabase.co
   Database name: postgres
   Port: 5432
   User: postgres
   Password: [tu-password]
   ```

   **Connection Pooling (RECOMENDADO):**
   ```
   postgresql://postgres.abcdefghijklmnop:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

   **Conexión Directa:**
   ```
   postgresql://postgres:[PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

3. **Ir a Settings > API**

   Copiar:
   ```
   Project URL: https://abcdefghijklmnop.supabase.co

   anon public:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   service_role:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Guardar credenciales**

   Crear archivo temporal `supabase-credentials.txt` (NO commitear):
   ```txt
   DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1...
   ```

### Paso 1.3: Configurar Políticas RLS

**Tiempo estimado: 2 minutos**

1. **Ir a SQL Editor**
   ```
   Dashboard > SQL Editor > New Query
   ```

2. **Ejecutar script de configuración**

   ```sql
   -- Deshabilitar RLS en todas las tablas (Django maneja seguridad)
   DO $$
   DECLARE r RECORD;
   BEGIN
       FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
       LOOP
           EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) ||
                   ' DISABLE ROW LEVEL SECURITY';
       END LOOP;
   END $$;

   -- Otorgar permisos completos a postgres
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

   -- Configurar permisos por defecto
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
   GRANT ALL ON TABLES TO postgres;

   ALTER DEFAULT PRIVILEGES IN SCHEMA public
   GRANT ALL ON SEQUENCES TO postgres;
   ```

3. **Verificar**
   ```sql
   -- Debe retornar las tablas con rls_enabled = false
   SELECT tablename, rowsecurity::text as rls_enabled
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

### Paso 1.4: Configurar Extensiones (Opcional)

**Tiempo estimado: 1 minuto**

```sql
-- UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criptografía
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Búsqueda de texto
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Paso 1.5: Verificar Conectividad

**Tiempo estimado: 2 minutos**

Desde PowerShell/Terminal:

```powershell
# Probar conexión (requiere psql instalado)
# Si no tienes psql, salta este paso
psql "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

Si no tienes `psql`, continuar al siguiente paso (Django verificará la conexión).

---

## 🎯 Fase 2: Configuración de Django

### Paso 2.1: Crear archivo .env

**Tiempo estimado: 2 minutos**

1. **Copiar plantilla**
   ```powershell
   cd C:\Users\Deibyd\Sistema-IBV
   Copy-Item .env.example .env
   ```

2. **Editar .env** con tus credenciales de Supabase

   ```env
   # Django
   SECRET_KEY=django-insecure-tu-secret-key-cambiar-en-produccion
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   # Database - USAR TUS CREDENCIALES REALES
   DATABASE_URL=postgresql://postgres.xxxxx:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

   # Supabase
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # CORS
   CORS_ALLOW_ALL_ORIGINS=False
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

   # Timezone
   TZ=America/Bogota
   ```

3. **Verificar archivo**
   ```powershell
   # Verificar que tiene contenido
   Get-Content .env
   ```

### Paso 2.2: Instalar/Verificar Dependencias

**Tiempo estimado: 2 minutos**

```powershell
# Activar entorno virtual (si usas uno)
# .\venv\Scripts\Activate.ps1

# Instalar/actualizar dependencias
pip install -r requirements.txt

# Verificar instalación de psycopg2
python -c "import psycopg2; print('psycopg2 OK')"
```

### Paso 2.3: Verificar Configuración de Django

**Tiempo estimado: 1 minuto**

```powershell
cd backend

# Verificar que Django lee el .env correctamente
python -c "from config.settings import DATABASES; print(DATABASES['default']['ENGINE'])"

# Debe mostrar: django.db.backends.postgresql
```

### Paso 2.4: Ejecutar Migraciones

**Tiempo estimado: 3 minutos**

```powershell
cd backend

# Ver lista de migraciones pendientes
python manage.py showmigrations

# Ejecutar migraciones
python manage.py migrate

# Debería mostrar:
# Running migrations:
#   Applying contenttypes.0001_initial... OK
#   Applying users.0001_initial... OK
#   ...
```

**Posibles errores:**

❌ **Error de conexión**
```
Solution: Verificar DATABASE_URL en .env
```

❌ **SSL required**
```
Solution: Asegurar que conn_health_checks está en True en settings.py
```

### Paso 2.5: Crear Superusuario

**Tiempo estimado: 1 minuto**

```powershell
python manage.py createsuperuser

# Ingresar:
# Email: admin@sistemaibv.com
# Password: [contraseña segura]
```

### Paso 2.6: Verificar en Supabase

**Tiempo estimado: 1 minuto**

1. **Ir a Supabase Dashboard**
   ```
   Table Editor > users_user
   ```

2. **Verificar que se creó el superusuario**
   - Debe aparecer el usuario que acabas de crear
   - Campo `is_superuser` debe ser `true`

---

## 🎯 Fase 3: Testing y Validación

### Paso 3.1: Ejecutar Servidor

**Tiempo estimado: 1 minuto**

```powershell
python manage.py runserver

# Debe iniciar sin errores en:
# http://127.0.0.1:8000
```

### Paso 3.2: Probar Admin

**Tiempo estimado: 2 minutos**

1. **Ir a Django Admin**
   ```
   http://127.0.0.1:8000/admin/
   ```

2. **Iniciar sesión**
   - Email: admin@sistemaibv.com
   - Password: [tu-password]

3. **Verificar**
   - [ ] Login exitoso
   - [ ] Puedes ver/editar usuarios
   - [ ] No aparecen errores de base de datos

### Paso 3.3: Probar API

**Tiempo estimado: 2 minutos**

```powershell
# Test endpoint de usuarios (requiere autenticación)
curl http://127.0.0.1:8000/api/users/

# Test endpoint de documentación
Start-Process "http://127.0.0.1:8000/api/schema/swagger-ui/"
```

### Paso 3.4: Ejecutar Tests

**Tiempo estimado: 2 minutos**

```powershell
# Ejecutar suite de tests
python manage.py test

# Si no hay errores: ✅ Configuración exitosa
```

---

## 🎯 Fase 4: Migración de Datos (Si aplica)

### Si tienes datos en SQLite que necesitas migrar:

**Tiempo estimado: 5 minutos**

```powershell
# 1. Backup de datos actuales (con SQLite)
# Cambiar temporalmente DATABASE_URL a SQLite
$env:DATABASE_URL = "sqlite:///db.sqlite3"

python manage.py dumpdata `
  --natural-foreign `
  --natural-primary `
  --exclude=contenttypes `
  --exclude=auth.permission `
  --exclude=sessions `
  --indent=2 `
  > data_backup.json

# 2. Cambiar a PostgreSQL
# Restaurar DATABASE_URL en .env a Supabase

# 3. Cargar datos
python manage.py loaddata data_backup.json

# 4. Verificar
python manage.py shell
>>> from users.models import User
>>> User.objects.count()
```

---

## ✅ Checklist Final de Validación

Verificar que todo funciona:

- [ ] ✅ Proyecto creado en Supabase
- [ ] ✅ Credenciales obtenidas y guardadas
- [ ] ✅ Archivo .env configurado
- [ ] ✅ Migraciones ejecutadas sin errores
- [ ] ✅ Superusuario creado
- [ ] ✅ Django admin accesible
- [ ] ✅ Tablas visibles en Supabase Dashboard
- [ ] ✅ API responde correctamente
- [ ] ✅ Tests pasan sin errores
- [ ] ✅ No hay errores de conexión en logs

---

## 🔧 Troubleshooting Rápido

### Error: "FATAL: password authentication failed"

```powershell
# Verificar DATABASE_URL
$env:DATABASE_URL

# Resetear password en Supabase:
# Settings > Database > Database Settings > Reset Database Password
```

### Error: "SSL connection required"

```python
# Verificar settings.py tenga:
DATABASES['default']['OPTIONS'] = {
    'sslmode': 'require',
}
```

### Error: "too many connections"

```env
# Cambiar a Connection Pooling (puerto 6543)
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Migraciones no se aplican

```powershell
# Ver estado
python manage.py showmigrations

# Limpiar migraciones problemáticas
python manage.py migrate --fake-initial

# Re-ejecutar
python manage.py migrate
```

---

## 📚 Siguientes Pasos

Una vez completada la configuración:

1. **Configurar Backups**
   - Supabase > Database > Backups > Schedule automatic backups

2. **Monitorear Performance**
   - Supabase > Reports > Database

3. **Configurar Logs**
   - Supabase > Database > Logs

4. **Documentar credenciales**
   - Guardar en gestor de contraseñas (LastPass, 1Password, etc.)

5. **Configurar CI/CD**
   - GitHub Actions con DATABASE_URL en secrets

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs de Django**
   ```powershell
   python manage.py runserver --verbosity 3
   ```

2. **Revisar logs de Supabase**
   ```
   Dashboard > Database > Logs
   ```

3. **Consultar documentación completa**
   - [`SUPABASE_SETUP_GUIDE.md`](./SUPABASE_SETUP_GUIDE.md)
   - [`SUPABASE_RLS_POLICIES.md`](./SUPABASE_RLS_POLICIES.md)

---

## 🎉 ¡Listo!

Si llegaste aquí sin errores, **¡felicitaciones!**

Tu Sistema IBV ahora está corriendo con PostgreSQL en Supabase.

**Tiempo total de configuración: ~30 minutos**

---

**Última actualización**: 2026-02-24
**Versión**: 1.0.0
