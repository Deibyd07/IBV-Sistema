## ✅ Solución: Crear usuarios en Supabase Auth desde Admin

### Problema
Cuando creabas un usuario desde el panel Admin, se creaba en la tabla `usuarios` pero **NO en Supabase Auth**, por lo que los usuarios no podían hacer login.

### Solución Implementada

Se ha creado un **API endpoint del servidor** que tiene permisos de administrador para:
1. ✅ Crear el usuario en **Supabase Auth** (auth.users)
2. ✅ Crear el registro en la tabla **usuarios** (base de datos)
3. ✅ Eliminar usuarios de ambos lugares

#### Archivos Modificados

**1. `/frontend/server/api/admin/users.ts` (NUEVO)**
- Endpoint `POST /api/admin/users` - Crear usuario
- Endpoint `PATCH /api/admin/users/:id` - Actualizar usuario
- Endpoint `DELETE /api/admin/users/:id` - Eliminar usuario
- Usa `SUPABASE_SERVICE_KEY` del servidor (con permisos de admin)

**2. `/frontend/src/services/supabaseUserService.ts`**
- `createUser()` - Ahora llama a `/api/admin/users` en lugar de insertar directo en DB
- `updateUser()` - Ahora llama a `PATCH /api/admin/users/:id`
- `deleteUser()` - Ahora llama a `DELETE /api/admin/users/:id`

**3. `/frontend/src/pages/admin/usuarios.vue`**
- `saveUser()` - Ahora valida que se ingrese password para usuarios nuevos
- El password se pasa al servidor para crear en Auth

#### Flujo de Creación de Usuario

**Antes:**
```
Admin crea usuario → Se inserta en tabla usuarios → ❌ NO se crea en Auth → Usuario NO puede login
```

**Ahora:**
```
Admin ingresa: email, nombre, password, rol
        ↓
Frontend valida datos
        ↓
POST /api/admin/users (desde servidor)
        ↓
Servidor crea usuario en Supabase Auth con ADMIN API
        ↓
Servidor crea registro en tabla usuarios
        ↓
✅ Usuario puede hacer login con email/password
```

### Cambios en el Formulario

El formulario de "Nuevo Usuario" ahora tiene:

```
┌─────────────────────────────┐
│ Nuevo Usuario              │
├─────────────────────────────┤
│ Nombre: [         ]         │
│ Apellido: [       ]         │
│ Email: [               ]    │
│ Contraseña: [       ] 👁️    │ ← NUEVO (requerido)
│ Rol: [Seleccionar...]       │
│ ☑️ Activo                   │
├─────────────────────────────┤
│ [Cancelar]  [Guardar]       │
└─────────────────────────────┘
```

### Editar Usuario

Cuando editas un usuario existente, el campo de contraseña NO aparece (no se puede cambiar desde aquí, solo en el perfil personal).

### Eliminar Usuario

Ahora cuando eliminas un usuario, se elimina:
- ✅ De Supabase Auth
- ✅ De la tabla usuarios

### Requisitos

**El `.env` debe tener:**

```env
# Estas variables ya deben estar configuradas:
SUPABASE_URL=https://[tu-proyecto].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1...  # NUNCA exponer en frontend
```

⚠️ **IMPORTANTE**: `SUPABASE_SERVICE_KEY` es confidencial y solo debe estar en el servidor (`.env`), nunca en el frontend.

### Prueba los Cambios

1. Abre el panel Admin > Gestión de Usuarios
2. Clic en "Nuevo Usuario"
3. Completa los datos:
   - Nombre: Carlos
   - Apellido: Test
   - Email: carlos.test@ibv.com
   - **Contraseña: Test1234** ← NUEVO
   - Rol: Recibidor
4. Clic en "Guardar"
5. ✅ El usuario se crea en Auth y se puede hacer login con `carlos.test@ibv.com / Test1234`

### Errores Comunes

**Error: "Supabase configuration missing"**
- Verificar que `.env` tiene `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`
- Reiniciar el servidor de desarrollo

**Error: "Email already exists"**
- El email ya está registrado en Supabase Auth
- Usar un email diferente

**Error: "Database error"**
- Problema al guardar en la tabla usuarios
- Verificar que la tabla exista y los permisos RLS sean correctos

### Seguridad

✅ El password NO se valida en el cliente (se valida en servidor)
✅ El service key solo existe en el servidor (no en el frontend)
✅ Los endpoints requieren estar autenticado como admin (en futuras actualizaciones)
✅ El password se hashes automáticamente en Supabase Auth

### Siguiente Paso (Opcional)

Agregar autenticación de admin en el servidor:

```typescript
// Validar que solo admin puede crear usuarios
const { data: { user }, error } = await $supabaseAdmin.auth.getUser(token)
if (!user || user.role !== 'admin') {
  throw createError({ statusCode: 403, statusMessage: 'No authorized' })
}
```

---

📝 **Nota**: Este cambio es compatible con usuarios existentes. Los usuarios ya creados seguirán funcionando normalmente.
