# Guía: Usar Usuarios de Supabase Auth con Roles

## 📋 Resumen

El sistema ahora se conecta con los usuarios de Supabase Auth existentes y redirecciona automáticamente a cada usuario a su panel correspondiente según su rol.

## 🔐 Cómo Funciona

1. **Usuario inicia sesión** en la página de login
2. **Sistema valida credenciales** contra Supabase Auth
3. **Sistema busca el rol** en este orden:
   - Tabla `users` en base de datos Supabase (si existe)
   - Campo `user_metadata.role` de Supabase Auth
   - Campo `app_metadata.role` de Supabase Auth
   - Default: `cliente`
4. **Sistema redirige** al usuario al panel de su rol

## 🎯 Rutas por Rol

| Rol | Ruta | Descripción |
|-----|------|-------------|
| `admin` | `/admin` | Dashboard administrativo |
| `porteria` | `/porteria` | Panel de portería |
| `recibidor` | `/recibidor` | Panel de recepción/impronta |
| `inventario` | `/inventario` | Panel de verificación |
| `despachador` | `/despachador` | Panel de despacho |
| `cliente` | `/` | Página de inicio |

## ⚙️ Configurar Roles en Supabase

### Opción 1: Usar user_metadata

En Supabase Authentication, edita cada usuario y añade al campo **User Metadata**:

```json
{
  "role": "admin"
}
```

O para otros roles:
```json
{
  "role": "porteria",
  "name": "Juan Portero"
}
```

**Pasos en Supabase:**
1. Ir a **Authentication > Users**
2. Hacer clic en el usuario
3. Expandir **User Metadata**
4. Agregar/editar JSON:
   ```json
   {
     "role": "porteria"
   }
   ```
5. Guardar

### Opción 2: Usar Tabla users en BD

Si tienes una tabla `users` en tu base de datos Supabase, asegúrate de que tenga:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR DEFAULT 'cliente',
  -- otros campos...
  created_at TIMESTAMP DEFAULT NOW()
);
```

El sistema consultará primero esta tabla y usará el rol de aquí.

### Opción 3: Usar app_metadata (No recomendado en producción)

Los roles podrían estar en `app_metadata`, pero es mejor usar `user_metadata` o la tabla de BD.

## 🧪 Testing

1. **Crea/edita usuarios en Supabase Auth** con roles en `user_metadata`
2. **Accede a** `http://localhost:3000/login`
3. **Inicia sesión** con un usuario
4. **Verifica** la redirección automática al panel correcto

### Usuarios de Prueba

Según la captura adjuntada, tienes estos usuarios:
- `admin@ibv.com` → Debería ir a `/admin`
- `despachador@ibv.com` → Debería ir a `/despachador`
- `inventario@ibv.com` → Debería ir a `/inventario`
- `porteria@ibv.com` → Debería ir a `/porteria`
- `recibidor@ibv.com` → Debería ir a `/recibidor`

**Asigna roles en Supabase Auth:**

Para cada usuario, edita su `User Metadata`:
```json
{
  "role": "admin",
  "name": "Admin"
}
```

## 🔒 Protección de Rutas

Cada panel tiene protección:

- Si intentas acceder a `/admin` sin ser admin → Redirige a `/`
- Si intentas acceder a `/porteria` sin ser porteria → Redirige a `/`
- Si intentas acceder a `/recibidor` sin ser recibidor → Redirige a `/`
- etc.

## 📝 Cambios del Código

### Nuevos Archivos

- `frontend/src/services/supabaseUserService.ts` - Consulta roles desde Supabase
- `frontend/src/middleware/porteria.ts` - Protege ruta de portería
- `frontend/src/middleware/recibidor.ts` - Protege ruta de recepción
- `frontend/src/middleware/inventario.ts` - Protege ruta de inventario
- `frontend/src/middleware/despachador.ts` - Protege ruta de despacho

### Actualizaciones

- `frontend/src/stores/auth.ts` - Mejora búsqueda de roles
- `frontend/src/pages/*/index.vue` - Agregados middlewares a todas las páginas

## ⚡ Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│ Usuario abre http://localhost:3000/login                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Ingresa email/pass    │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ Auth Store → Supabase Auth   │
        │ (signInWithPassword)         │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────┐
        │ Obtener rol de múltiples fuentes:│
        │ 1. Tabla users (si existe)       │
        │ 2. user_metadata.role            │
        │ 3. app_metadata.role             │
        └──────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────┐
        │ Redireccionar según rol:         │
        │ admin → /admin                   │
        │ porteria → /porteria             │
        │ recibidor → /recibidor           │
        │ inventario → /inventario         │
        │ despachador → /despachador       │
        │ cliente → /                      │
        └──────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Acceso al panel      │
        │ (protegido con       │
        │  middleware de rol)  │
        └──────────────────────┘
```

## 🆘 Troubleshooting

### El usuario no se redirige al panel correcto

**Solución:**
1. Verifica que en Supabase Auth el usuario tenga `user_metadata.role` configurado
2. Revisa la consola del navegador (F12) para ver errores
3. Verifica en Application > LocalStorage que `auth_user` contenga el rol correcto

### Error "Identificador 'activities' has already been declared"

**Solución:**
Ya está resuelto en la última actualización. El código no debe tener duplicados de `activities`.

### El modal de login aparece vacío

**Solución:**
Asegúrate de que las variables de entorno de Supabase estén configuradas en `.env.local`:
```
NUXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 📚 Recursos

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [User Metadata en Supabase](https://supabase.com/docs/guides/auth/managing-user-data)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

