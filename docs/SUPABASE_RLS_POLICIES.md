# Políticas RLS (Row Level Security) para Supabase

## 📋 Índice

1. [Introducción a RLS](#introducción-a-rls)
2. [Estrategia para Sistema IBV](#estrategia-para-sistema-ibv)
3. [Scripts SQL - Opción sin RLS](#scripts-sql---opción-sin-rls)
4. [Scripts SQL - Opción con RLS](#scripts-sql---opción-con-rls)
5. [Testing de Políticas](#testing-de-políticas)
6. [Troubleshooting](#troubleshooting)

---

## Introducción a RLS

### ¿Qué es Row Level Security?

Row Level Security (RLS) es una característica de PostgreSQL que permite controlar el acceso a filas individuales en una tabla basándose en el usuario que ejecuta la consulta.

### Conceptos Clave

- **Policy**: Regla que define quien puede acceder a qué filas
- **TO**: A qué rol se aplica la política (authenticated, anon, service_role)
- **USING**: Condición para leer filas
- **WITH CHECK**: Condición para insertar/actualizar filas

### Ejemplo Básico

```sql
-- Habilitar RLS en una tabla
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios datos
CREATE POLICY "Users can view own data"
ON usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

---

## Estrategia para Sistema IBV

### Arquitectura Actual

```
Frontend (Nuxt.js)
    ↓
Backend Django (API REST + JWT)
    ↓
Supabase PostgreSQL
```

### ✅ Recomendación: Deshabilitar RLS

**Razones:**

1. **Django maneja la autenticación**: Todo acceso pasa por Django con JWT
2. **No hay acceso directo**: El frontend NO se conecta directamente a Supabase
3. **Simplificación**: Menos complejidad = menos bugs
4. **Rendimiento**: RLS agrega overhead en cada query
5. **Django ORM maneja permisos**: Ya tenemos lógica de permisos en Django

### ❌ Cuándo NO usar RLS

- Frontend no accede directamente a la BD ✅ (nuestro caso)
- Backend tiene su propio sistema de autenticación ✅ (Django)
- Todas las queries pasan por un ORM controlado ✅ (Django ORM)

### ✅ Cuándo SÍ usar RLS

- Frontend accede directamente a Supabase con supabase-js ❌
- Necesitas aplicar políticas de seguridad a nivel de BD ❌
- Múltiples aplicaciones acceden a la misma BD ❌
- Requerimientos de compliance muy estrictos ⚠️

---

## Scripts SQL - Opción sin RLS (Recomendado)

### Script Completo de Configuración

```sql
-- ============================================
-- CONFIGURACIÓN DE PERMISOS SIN RLS
-- Sistema IBV - Producción
-- ============================================

-- 1. Asegurar que postgres tiene permisos completos
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 2. Deshabilitar RLS en todas las tablas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 3. Verificar estado de RLS
SELECT
    schemaname,
    tablename,
    rowsecurity::text as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Configurar permisos por defecto para nuevas tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO postgres;

-- ============================================
-- RESULTADO ESPERADO:
-- Todas las tablas con rls_enabled = 'false'
-- Usuario postgres con acceso completo
-- ============================================
```

### Verificación Post-Configuración

```sql
-- Verificar que RLS está deshabilitado
SELECT
    t.tablename,
    t.rowsecurity as rls_enabled,
    has_table_privilege('postgres', t.schemaname||'.'||t.tablename, 'SELECT') as can_select,
    has_table_privilege('postgres', t.schemaname||'.'||t.tablename, 'INSERT') as can_insert,
    has_table_privilege('postgres', t.schemaname||'.'||t.tablename, 'UPDATE') as can_update,
    has_table_privilege('postgres', t.schemaname||'.'||t.tablename, 'DELETE') as can_delete
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- Resultado esperado: rls_enabled = false, todos los permisos = true
```

---

## Scripts SQL - Opción con RLS (Avanzado)

⚠️ **ADVERTENCIA**: Solo usar si es requerimiento obligatorio de seguridad/compliance.

### Configuración Base

```sql
-- ============================================
-- HABILITACIÓN DE RLS CON ACCESO PARA BACKEND
-- ============================================

-- 1. Crear rol para el backend (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'backend_service') THEN
        CREATE ROLE backend_service LOGIN PASSWORD 'STRONG_PASSWORD_HERE';
    END IF;
END
$$;

-- 2. Otorgar permisos al rol backend
GRANT CONNECT ON DATABASE postgres TO backend_service;
GRANT USAGE ON SCHEMA public TO backend_service;
GRANT ALL ON ALL TABLES IN SCHEMA public TO backend_service;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO backend_service;

-- 3. Permisos por defecto para nuevas tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO backend_service;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO backend_service;
```

### Políticas RLS para Tabla Users

```sql
-- ============================================
-- RLS PARA TABLA users_user
-- ============================================

-- Habilitar RLS
ALTER TABLE users_user ENABLE ROW LEVEL SECURITY;

-- Política 1: Backend tiene acceso completo
CREATE POLICY "Backend full access"
ON users_user
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- Política 2: Service role tiene acceso completo
CREATE POLICY "Service role full access"
ON users_user
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política 3: Usuarios autenticados solo ven su perfil (OPCIONAL)
-- Solo si frontend accede directamente (NO es nuestro caso)
CREATE POLICY "Users view own profile"
ON users_user
FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);
```

### Template para Otras Tablas

```sql
-- ============================================
-- TEMPLATE PARA OTRAS TABLAS
-- ============================================

-- Reemplazar 'nombre_tabla' con el nombre real

-- Habilitar RLS
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;

-- Backend/Service role acceso completo
CREATE POLICY "Backend full access"
ON nombre_tabla
FOR ALL
TO postgres, service_role
USING (true)
WITH CHECK (true);

-- Política adicional basada en roles (ejemplo)
CREATE POLICY "Admin full access"
ON nombre_tabla
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users_user
        WHERE id = auth.uid()::uuid
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users_user
        WHERE id = auth.uid()::uuid
        AND role = 'admin'
    )
);
```

### Políticas Basadas en Roles del Sistema

```sql
-- ============================================
-- POLÍTICAS BASADAS EN ROLES IBV
-- ============================================

-- Ejemplo: Tabla de Vehículos
-- Diferentes roles tienen diferentes permisos

-- Admin: Acceso completo
CREATE POLICY "Admin access vehicles"
ON vehicles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users_user u
        WHERE u.id = auth.uid()::uuid
        AND u.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users_user u
        WHERE u.id = auth.uid()::uuid
        AND u.role = 'admin'
    )
);

-- Despachador: Solo lectura
CREATE POLICY "Despachador read vehicles"
ON vehicles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users_user u
        WHERE u.id = auth.uid()::uuid
        AND u.role = 'despachador'
    )
);

-- Inventario: Lectura y actualización
CREATE POLICY "Inventario update vehicles"
ON vehicles
FOR SELECT, UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users_user u
        WHERE u.id = auth.uid()::uuid
        AND u.role = 'inventario'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users_user u
        WHERE u.id = auth.uid()::uuid
        AND u.role = 'inventario'
    )
);
```

### Deshabilitar RLS en Tablas Específicas

```sql
-- Si necesitas deshabilitar RLS en tablas específicas
ALTER TABLE users_user DISABLE ROW LEVEL SECURITY;
ALTER TABLE django_migrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE django_session DISABLE ROW LEVEL SECURITY;
ALTER TABLE django_admin_log DISABLE ROW LEVEL SECURITY;
```

---

## Testing de Políticas

### Testing Manual

```sql
-- ============================================
-- TESTS DE POLÍTICAS RLS
-- ============================================

-- Test 1: Verificar que RLS está activo
SELECT
    tablename,
    rowsecurity::text as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'users_user';

-- Test 2: Listar políticas existentes
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 3: Intentar acceso como postgres
SET ROLE postgres;
SELECT COUNT(*) as total_users FROM users_user;
-- Debe retornar el total de usuarios

-- Test 4: Intentar acceso sin permisos (debe fallar si RLS está bien configurado)
SET ROLE anon;
SELECT COUNT(*) FROM users_user;
-- Debe retornar 0 o error si no hay política para anon
```

### Script de Validación Completo

```sql
-- ============================================
-- SCRIPT DE VALIDACIÓN DE SEGURIDAD
-- ============================================

DO $$
DECLARE
    v_table_name text;
    v_rls_enabled boolean;
    v_policy_count int;
BEGIN
    RAISE NOTICE '===================================';
    RAISE NOTICE 'VALIDACIÓN DE POLÍTICAS RLS';
    RAISE NOTICE '===================================';

    -- Iterar sobre todas las tablas del schema public
    FOR v_table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        -- Verificar si RLS está habilitado
        SELECT rowsecurity INTO v_rls_enabled
        FROM pg_tables
        WHERE schemaname = 'public'
            AND tablename = v_table_name;

        -- Contar políticas
        SELECT COUNT(*) INTO v_policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
            AND tablename = v_table_name;

        -- Reportar
        RAISE NOTICE 'Tabla: % | RLS: % | Políticas: %',
            v_table_name,
            CASE WHEN v_rls_enabled THEN 'ENABLED' ELSE 'DISABLED' END,
            v_policy_count;
    END LOOP;

    RAISE NOTICE '===================================';
END $$;
```

---

## Troubleshooting

### Error: "new row violates row-level security policy"

**Causa**: Política RLS bloqueando INSERT/UPDATE

**Solución**:
```sql
-- Verificar política WITH CHECK
SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';

-- Deshabilitar RLS temporalmente para debug
ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;

-- O ajustar la política
DROP POLICY IF EXISTS "nombre_politica" ON nombre_tabla;
CREATE POLICY "nueva_politica" ON nombre_tabla ...
```

### Error: "permission denied for table"

**Causa**: Falta GRANT de permisos

**Solución**:
```sql
-- Otorgar permisos al rol
GRANT ALL ON nombre_tabla TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### RLS está habilitado pero no funciona

**Causa**: Falta política o política mal configurada

**Solución**:
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';

-- Si no hay políticas, crear al menos una
CREATE POLICY "default_policy" ON nombre_tabla FOR ALL USING (true);
```

### Django no puede acceder a las tablas

**Causa**: RLS bloqueando acceso al usuario de Django

**Solución**:
```sql
-- Opción 1: Deshabilitar RLS (recomendado)
ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;

-- Opción 2: Crear política que permita acceso total
CREATE POLICY "django_full_access"
ON nombre_tabla
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);
```

---

## Matriz de Decisión: ¿Usar RLS o No?

| Factor | Sin RLS ✅ | Con RLS ⚠️ |
|--------|-----------|-----------|
| **Complejidad** | Baja | Alta |
| **Mantenimiento** | Fácil | Complejo |
| **Rendimiento** | Óptimo | Overhead adicional |
| **Seguridad** | Django maneja | Doble capa (Django + BD) |
| **Debugging** | Simple | Complicado |
| **Recomendado para IBV** | ✅ SÍ | ❌ NO (a menos que sea requerimiento) |

---

## Mejores Prácticas

### ✅ DO (Hacer)

1. **Documentar todas las políticas** creadas
2. **Probar políticas** antes de aplicar en producción
3. **Usar nombres descriptivos** para políticas
4. **Mantener políticas simples** y predecibles
5. **Usar USING y WITH CHECK** apropiadamente

### ❌ DON'T (No Hacer)

1. **No crear políticas complejas** sin documentar
2. **No asumir que RLS = seguridad total** (falta configurar más cosas)
3. **No olvidar otorgar permisos GRANT** además de políticas
4. **No usar RLS** si no lo necesitas
5. **No mezclar lógica de negocio** en políticas RLS

---

## Comandos de Utilidad

```sql
-- Ver todas las políticas del sistema
SELECT * FROM pg_policies ORDER BY tablename;

-- Eliminar una política
DROP POLICY IF EXISTS "nombre_politica" ON nombre_tabla;

-- Eliminar todas las políticas de una tabla
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname FROM pg_policies
        WHERE tablename = 'nombre_tabla'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON nombre_tabla';
    END LOOP;
END $$;

-- Habilitar RLS en todas las tablas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Deshabilitar RLS en todas las tablas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;
```

---

## Recomendación Final para Sistema IBV

### 🎯 Configuración Recomendada

**OPCIÓN: SIN RLS (Deshabilitar)**

**Razones:**
- ✅ Configuración más simple
- ✅ Mejor rendimiento
- ✅ Más fácil de mantener
- ✅ Django ya maneja la seguridad
- ✅ No hay acceso directo desde frontend

**Implementación:**
```sql
-- Ejecutar una sola vez en Supabase SQL Editor
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) ||
                ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;
```

---

## Referencias

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Django Database Security](https://docs.djangoproject.com/en/5.0/topics/security/)

---

**Última actualización**: 2026-02-24
**Versión**: 1.0.0
