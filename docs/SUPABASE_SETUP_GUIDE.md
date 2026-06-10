# Guía de Configuración de Supabase para Sistema IBV

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura de la Base de Datos](#arquitectura-de-la-base-de-datos)
3. [Configuración de Supabase](#configuración-de-supabase)
4. [Configuración de Django](#configuración-de-django)
5. [Políticas RLS (Row Level Security)](#políticas-rls)
6. [Migración de Datos](#migración-de-datos)
7. [Testing y Validación](#testing-y-validación)
8. [Troubleshooting](#troubleshooting)

---

## Introducción

Este documento describe el proceso completo para configurar y migrar el Sistema IBV a PostgreSQL utilizando Supabase como proveedor de base de datos.

### ¿Por qué Supabase?

- ✅ **PostgreSQL Gestionado**: No necesitas administrar servidores
- ✅ **Backups Automáticos**: Punto de restauración automático
- ✅ **Escalabilidad**: Fácil escalamiento vertical y horizontal
- ✅ **Row Level Security**: Seguridad a nivel de fila integrada
- ✅ **API REST Automática**: Supabase genera APIs REST automáticamente
- ✅ **Real-time**: Suscripciones en tiempo real disponibles
- ✅ **Dashboard Intuitivo**: Interfaz web para gestionar datos

### Objetivos

1. Crear un proyecto de producción en Supabase
2. Configurar base de datos `sistema_ibv_prod`
3. Implementar políticas de seguridad RLS
4. Migrar datos de SQLite a PostgreSQL
5. Configurar conexión desde Django

---

## Arquitectura de la Base de Datos

### Modelo de Datos Actual

El sistema cuenta con las siguientes tablas principales:

**Users (Usuarios)**
- Autenticación personalizada con Django
- Roles: admin, porteria, recibidor, inventario, despachador, cliente
- Campos: email, nombre, apellido, rol, estado

**Modelos Adicionales** (según MODELS_DOCUMENTATION.md)
- Vehicles (Vehículos)
- Containers (Contenedores)
- Shipments (Despachos)
- Auditoría y trazabilidad

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────┐
│        FRONTEND (Nuxt.js)                   │
│  - Interfaces de usuario                    │
│  - Consumo de API REST                      │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTPS/JWT
                  ▼
┌─────────────────────────────────────────────┐
│      BACKEND (Django + DRF)                 │
│  - API REST                                 │
│  - Autenticación JWT                        │
│  - Lógica de negocio                        │
└─────────────────┬───────────────────────────┘
                  │
                  │ PostgreSQL Protocol
                  │ (Direct Connection)
                  ▼
┌─────────────────────────────────────────────┐
│      SUPABASE (PostgreSQL)                  │
│  - Base de datos sistema_ibv_prod           │
│  - Row Level Security (RLS)                 │
│  - Backups automáticos                      │
│  - Monitoring y Analytics                   │
└─────────────────────────────────────────────┘
```

---

## Configuración de Supabase

### Paso 1: Crear Proyecto en Supabase

1. **Acceder a Supabase**
   - Ir a [https://supabase.com](https://supabase.com)
   - Iniciar sesión o crear cuenta (usar cuenta corporativa si existe)

2. **Crear Nuevo Proyecto**
   ```
   Dashboard → New Project
   ```

   **Configuración recomendada:**
   - **Name**: `sistema-ibv-prod`
   - **Database Password**: Generar contraseña segura (guardar en lugar seguro)
   - **Region**: Seleccionar región más cercana a tus usuarios
     - Para Colombia/Latinoamérica: `South America (São Paulo)`
     - Para USA: `East US (North Virginia)` o `West US (Oregon)`
   - **Pricing Plan**:
     - Desarrollo: Free tier
     - Producción: Pro plan ($25/mes) - Recomendado para mejor rendimiento

3. **Esperar Provisión**
   - El proyecto tarda ~2 minutos en crearse
   - Guardar las credenciales que aparecen

### Paso 2: Obtener Credenciales de Conexión

Una vez creado el proyecto:

1. **Ir a Project Settings → Database**

2. **Copiar Connection String**
   - Formato: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`
   - Ejemplo:
     ```
     postgresql://postgres.xxxxxxxxxxxxx:your-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
     ```

3. **Información de Conexión Directa**
   ```
   Host: db.xxxxxxxxxxxxx.supabase.co
   Database: postgres
   Port: 5432
   User: postgres
   Password: [tu-password]
   ```

4. **Credenciales de API (Project Settings → API)**
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: Para uso desde frontend (si necesario)
   - **service_role key**: Para operaciones de backend (CONFIDENCIAL)

### Paso 3: Configurar Database

#### Opción A: Usar base de datos 'postgres' (Recomendado para Supabase)

Supabase crea automáticamente la base de datos `postgres`. Puedes usarla directamente.

**Ventajas:**
- Ya está creada
- Configurada con Supabase
- Funciona out-of-the-box

#### Opción B: Crear base de datos personalizada 'sistema_ibv_prod'

Si prefieres una base de datos separada:

1. **Acceder al SQL Editor en Supabase**
   ```
   Dashboard → SQL Editor → New Query
   ```

2. **Ejecutar SQL para crear database**
   ```sql
   -- Crear base de datos
   CREATE DATABASE sistema_ibv_prod
       WITH
       OWNER = postgres
       ENCODING = 'UTF8'
       LC_COLLATE = 'en_US.UTF-8'
       LC_CTYPE = 'en_US.UTF-8'
       TABLESPACE = pg_default
       CONNECTION LIMIT = -1;

   -- Comentario descriptivo
   COMMENT ON DATABASE sistema_ibv_prod
       IS 'Base de datos de producción para Sistema de Inventario y Bodega de Vehículos';
   ```

3. **Verificar creación**
   ```sql
   SELECT datname FROM pg_database WHERE datname = 'sistema_ibv_prod';
   ```

**⚠️ NOTA**: Supabase puede tener restricciones para crear bases de datos adicionales en el plan Free. Si encuentras errores, usa la base de datos `postgres` por defecto.

### Paso 4: Configurar Extensiones PostgreSQL

Ejecutar en SQL Editor:

```sql
-- Extensión para UUIDs (útil para IDs únicos)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensión para funciones de criptografía
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extensión para búsqueda de texto completo (si se necesita)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verificar extensiones instaladas
SELECT * FROM pg_extension;
```

### Paso 5: Configurar Connection Pooling

Para Django, es recomendable usar **Transaction Mode**:

1. **Ir a Project Settings → Database → Connection Pooling**

2. **Configuración recomendada:**
   - **Mode**: Transaction
   - **Pool Size**: 15 (para Free tier)
   - **Connection String**:
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - **Nota**: El puerto cambia a `6543` para pooling

---

## Configuración de Django

### Paso 1: Actualizar Variables de Entorno

Editar/crear archivo `.env` en la raíz del proyecto:

```env
# ============================================
# DJANGO SETTINGS
# ============================================
SECRET_KEY=django-insecure-CAMBIAR-EN-PRODUCCION-use-str-min-50-chars
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# ============================================
# DATABASE - SUPABASE POSTGRESQL
# ============================================
# Usar CONNECTION POOLING para mejor rendimiento
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Conexión directa (sin pooling) - usar solo si hay problemas con pooling
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# ============================================
# SUPABASE CREDENTIALS
# ============================================
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# CORS SETTINGS
# ============================================
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# ============================================
# ADDITIONAL SETTINGS
# ============================================
# Zona horaria (Colombia/Bogotá)
TZ=America/Bogota

# Nivel de logs
LOG_LEVEL=INFO
```

### Paso 2: Actualizar settings.py

El archivo ya está configurado correctamente con `dj-database-url`, pero podemos agregar configuraciones adicionales:

```python
# backend/config/settings.py

import dj_database_url
from decouple import config, Csv

# ... código existente ...

# Database
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,  # Mantener conexiones por 10 minutos
        conn_health_checks=True,  # Verificar salud de conexiones
    )
}

# Configuración adicional para PostgreSQL en producción
if not DEBUG:
    DATABASES['default']['OPTIONS'] = {
        'sslmode': 'require',  # Requerir SSL en producción
    }

# Zona horaria
TIME_ZONE = config('TZ', default='UTC')
USE_TZ = True
```

### Paso 3: Verificar Dependencias

Asegurarse que `requirements.txt` tiene:

```txt
psycopg2-binary>=2.9.9
dj-database-url>=2.1.0
python-decouple>=3.8
```

Instalar/actualizar:

```bash
pip install -r requirements.txt
```

### Paso 4: Ejecutar Migraciones

```bash
cd backend

# Verificar configuración de base de datos
python manage.py dbshell
# Si se conecta exitosamente, salir con \q

# Ejecutar migraciones
python manage.py migrate

# Debería crear todas las tablas en Supabase
```

### Paso 5: Crear Superusuario

```bash
python manage.py createsuperuser
```

---

## Políticas RLS (Row Level Security)

### ¿Qué es RLS?

Row Level Security permite definir políticas que controlan qué filas puede ver/modificar cada usuario a nivel de base de datos.

### Estrategia para Sistema IBV

Para este sistema, **el backend Django maneja toda la autenticación y autorización**, por lo tanto:

**✅ RECOMENDACIÓN**: Deshabilitar RLS en todas las tablas y dejar que Django maneje la seguridad.

**Razones:**
1. Django ya tiene sistema de permisos robusto
2. Todas las consultas pasan por Django (no hay acceso directo desde frontend)
3. Simplifica el desarrollo y mantenimiento
4. RLS es útil cuando el frontend accede directamente a Supabase (no es nuestro caso)

### Configuración de RLS

#### Opción 1: Deshabilitar RLS (Recomendado)

Ejecutar en SQL Editor de Supabase:

```sql
-- Deshabilitar RLS en todas las tablas de usuarios
ALTER TABLE users_user DISABLE ROW LEVEL SECURITY;

-- Repetir para cada tabla del sistema cuando se creen
-- ALTER TABLE [nombre_tabla] DISABLE ROW LEVEL SECURITY;
```

#### Opción 2: Habilitar RLS con política para service_role

Si requieren RLS por políticas de seguridad corporativas:

```sql
-- Habilitar RLS
ALTER TABLE users_user ENABLE ROW LEVEL SECURITY;

-- Política: Solo service_role (backend) puede acceder
CREATE POLICY "Allow backend full access"
ON users_user
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permisos al usuario postgres
GRANT ALL ON users_user TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Scripts de Políticas RLS

Ver archivo complementario: [`SUPABASE_RLS_POLICIES.md`](./SUPABASE_RLS_POLICIES.md) para scripts SQL completos.

---

## Migración de Datos

### Estrategia de Migración

#### Escenario 1: Sistema Nuevo (Sin Datos en Producción)

✅ **Más Simple**: Solo ejecutar migraciones de Django

```bash
python manage.py migrate
python manage.py createsuperuser
```

#### Escenario 2: Migrar Datos de SQLite a PostgreSQL

Si tienes datos en `db.sqlite3` que necesitas migrar:

**Método 1: Django dumpdata/loaddata**

```bash
# 1. Exportar datos de SQLite
python manage.py dumpdata --natural-foreign --natural-primary \
  --exclude=contenttypes --exclude=auth.permission \
  --indent=2 > data_backup.json

# 2. Cambiar DATABASE_URL a Supabase en .env

# 3. Ejecutar migraciones en Supabase
python manage.py migrate

# 4. Importar datos
python manage.py loaddata data_backup.json
```

**Método 2: Script de Migración Personalizado**

```python
# backend/scripts/migrate_to_postgresql.py

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
import sqlite3
import psycopg2

# Implementar lógica de migración personalizada
# ... (ver script completo en archivos adjuntos)
```

### Validación Post-Migración

```bash
# Verificar registros migrados
python manage.py shell

>>> from users.models import User
>>> User.objects.count()
>>> User.objects.all()
```

---

## Testing y Validación

### Checklist de Validación

- [ ] Conexión a base de datos exitosa
- [ ] Migraciones ejecutadas sin errores
- [ ] Superusuario creado
- [ ] API REST responde correctamente
- [ ] Autenticación JWT funciona
- [ ] CRUD de usuarios funcional
- [ ] Logs de Django no muestran errores de BD
- [ ] Rendimiento aceptable (< 200ms por consulta)

### Tests Automatizados

```bash
# Ejecutar suite completa de tests
cd backend
python manage.py test

# Con coverage
coverage run --source='.' manage.py test
coverage report
```

### Monitoreo en Supabase

1. **Database → Logs**: Ver queries ejecutadas
2. **Database → Roles**: Verificar permisos
3. **Reports**: Monitorear uso de recursos
4. **Database → Backups**: Configurar backups automáticos

---

## Troubleshooting

### Error: "connection to server... failed"

**Causa**: Firewall o credenciales incorrectas

**Solución**:
```bash
# Verificar conectividad
ping db.[PROJECT-REF].supabase.co

# Verificar DATABASE_URL
echo $DATABASE_URL  # Linux/Mac
echo %DATABASE_URL%  # Windows CMD
$env:DATABASE_URL   # Windows PowerShell
```

### Error: "FATAL: password authentication failed"

**Causa**: Contraseña incorrecta en DATABASE_URL

**Solución**:
- Verificar contraseña en Supabase Dashboard
- Resetear contraseña si es necesario: Project Settings → Database → Reset Password

### Error: "too many connections"

**Causa**: Límite de conexiones excedido

**Solución**:
- Usar Connection Pooling (puerto 6543)
- Ajustar `conn_max_age` en settings.py
- Cerrar conexiones idle

### Error: SSL required

**Causa**: Supabase requiere SSL en producción

**Solución**:
```python
# settings.py
DATABASES['default']['OPTIONS'] = {
    'sslmode': 'require',
}
```

### Migrations no se ejecutan

**Problema**: Error en migraciones

**Solución**:
```bash
# Ver estado de migraciones
python manage.py showmigrations

# Fake migrations problemáticas (usar con cuidado)
python manage.py migrate --fake users 0001_initial

# Re-ejecutar
python manage.py migrate
```

---

## Seguridad y Mejores Prácticas

### ✅ DO (Hacer)

1. **Usar variables de entorno** para credenciales
2. **Nunca commitear** `.env` al repositorio
3. **Usar conexión SSL** en producción
4. **Rotar credenciales** periódicamente (cada 90 días)
5. **Habilitar backups automáticos** en Supabase
6. **Monitorear logs** de accesos sospechosos
7. **Usar service_role key** solo en backend
8. **Implementar rate limiting** en endpoints sensibles

### ❌ DON'T (No Hacer)

1. **No exponer** service_role key en frontend
2. **No deshabilitar SSL** en producción
3. **No usar** contraseñas débiles
4. **No compartir** credenciales por canales inseguros
5. **No ignorar** alertas de seguridad de Supabase
6. **No sobrecargar** conexiones (usar pooling)

---

## Backup y Recuperación

### Backups Automáticos

Supabase (Plan Pro):
- Backups diarios automáticos
- Retención de 7 días (Pro)
- Point-in-time recovery

### Backup Manual

```bash
# Exportar toda la base de datos
pg_dump -h db.[PROJECT-REF].supabase.co \
        -U postgres \
        -d postgres \
        -F c \
        -f backup_$(date +%Y%m%d).dump

# Restaurar
pg_restore -h db.[PROJECT-REF].supabase.co \
           -U postgres \
           -d postgres \
           backup_20260224.dump
```

### Django dumpdata

```bash
# Backup de datos en formato JSON
python manage.py dumpdata > backup_$(date +%Y%m%d).json

# Restaurar
python manage.py loaddata backup_20260224.json
```

---

## Costos y Escalabilidad

### Plan Free
- **Database**: 500MB
- **Bandwidth**: 5GB
- **Storage**: 1GB
- **Conexiones**: 60 directas, 200 pooled
- **Backups**: No incluidos
- ✅ Suficiente para desarrollo y pruebas

### Plan Pro ($25/mes)
- **Database**: 8GB incluidos
- **Bandwidth**: 250GB
- **Storage**: 100GB
- **Conexiones**: 400 directas, 10,000 pooled
- **Backups**: 7 días retención
- ✅ Recomendado para producción

### Proyección de Costos

```
Usuarios diarios: 50
Transacciones: 1000/día
Almacenamiento: 2GB datos + 500MB archivos

Plan Recomendado: Pro ($25/mes)
Costo Anual: $300
```

---

## Referencias

- [Supabase Docs](https://supabase.com/docs)
- [Django Database Settings](https://docs.djangoproject.com/en/5.0/ref/settings/#databases)
- [PostgreSQL SSL Modes](https://www.postgresql.org/docs/current/libpq-ssl.html)
- [dj-database-url](https://github.com/jazzband/dj-database-url)

---

## Changelog

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0.0   | 2026-02-24 | Sistema IBV | Creación inicial del documento |

---

## Soporte

Para dudas o problemas:
1. Revisar [Troubleshooting](#troubleshooting)
2. Consultar documentación de Supabase
3. Contactar al equipo de desarrollo

---

**✅ ¡Configuración completa!** Una vez completados todos los pasos, el sistema estará corriendo en PostgreSQL con Supabase.
