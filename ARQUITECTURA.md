# Arquitectura del Sistema IBV

## Stack Tecnológico Final

El Sistema IBV está construido con una arquitectura **serverless** utilizando:

### Frontend
- **Framework:** Nuxt 3 (Vue 3)
- **Lenguaje:** TypeScript
- **Estilos:** TailwindCSS
- **Estado:** Pinia (Vue Store)
- **Build:** Vite

### Backend
- **BaaS:** Supabase (Backend as a Service)
- **Base de datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage
- **API:** Supabase Realtime & REST API

## Flujo de Datos

```
┌─────────────┐
│   Browser   │
│  (Nuxt 3)   │
└──────┬──────┘
       │
       │ Supabase Client SDK
       │
┌──────▼──────────────────────────┐
│        Supabase Cloud           │
├─────────────────────────────────┤
│  - PostgreSQL (Base de datos)  │
│  - Auth (JWT)                   │
│  - Storage (Archivos)           │
│  - Realtime (WebSockets)        │
│  - Row Level Security (RLS)     │
└─────────────────────────────────┘
```

## Estructura de Carpetas Frontend

```
frontend/src/
├── components/        # Componentes Vue reutilizables
│   ├── common/       # Botones, inputs, modals
│   ├── charts/       # Gráficos para dashboard
│   └── LoginSupabase.vue
│
├── pages/            # Rutas automáticas (Nuxt)
│   ├── index.vue     # Landing page
│   ├── login.vue     # Login con Supabase Auth
│   ├── admin/        # Panel admin
│   ├── porteria/     # Panel portería
│   ├── recibidor/    # Panel recibidor
│   ├── inventario/   # Panel inventario
│   └── despachador/  # Panel despachador
│
├── services/         # Capa de servicios (API)
│   ├── supabaseUserService.ts      # CRUD usuarios
│   ├── supabaseDataService.ts      # Dashboard stats, activities
│   └── api.ts                      # (No usado actualmente)
│
├── stores/           # Pinia stores
│   ├── auth.ts       # Estado de autenticación
│   └── statsStore.ts # Datos de dashboard
│
├── middleware/       # Middlewares de ruta
│   ├── auth.ts       # Verificar sesión
│   ├── admin.ts      # Solo admin
│   ├── porteria.ts   # Solo portería
│   ├── recibidor.ts  # Solo recibidor
│   ├── inventario.ts # Solo inventario
│   └── despachador.ts# Solo despachador
│
└── plugins/
    └── supabase.ts   # Configuración del cliente Supabase
```

## Base de Datos (Supabase)

### Tablas principales

| Tabla | Descripción |
|---|---|
| `users_user` | Usuarios del sistema |
| `vehiculos` | Vehículos registrados |
| `buques` | Buques que traen vehículos |
| `modelos_vehiculo` | Modelos/marcas de vehículos |
| `improntas` | Registros de impronta fotográfica |
| `inventarios` | Checklists de inventario |
| `despachos` | Despachos de lotes |
| `despacho_vehiculos` | Relación M2M despachos-vehículos |
| `movimientos_porteria` | Log de movimientos en portería |

### Seguridad (RLS - Row Level Security)

Supabase maneja la seguridad mediante políticas RLS a nivel de base de datos:

- **Admin**: Acceso total
- **Portería**: Ver/editar movimientos de portería
- **Recibidor**: Ver/editar improntas y vehículos
- **Inventario**: Ver/editar inventarios
- **Despachador**: Ver/editar despachos
- **Cliente**: Solo lectura de sus vehículos

Ver configuración en: `scripts/sql/00_full_setup.sql`

## Autenticación

### Flujo de login

1. Usuario ingresa email + contraseña en `/login`
2. Frontend llama `$supabase.auth.signInWithPassword()`
3. Supabase Auth valida credenciales y retorna JWT
4. Frontend guarda JWT en localStorage
5. `auth.ts` store:
   - Consulta `users_user` para obtener rol
   - Si el usuario no existe en `users_user`, lo crea automáticamente (seed)
6. Redirección según rol:
   - `admin` → `/admin`
   - `porteria` → `/porteria`
   - `recibidor` → `/recibidor`
   - `inventario` → `/inventario`
   - `despachador` → `/despachador`

### Seed automático de usuarios

Los siguientes correos se crean automáticamente en `users_user` al hacer login:

| Email | Rol |
|---|---|
| admin1@ibv.com | admin |
| porteria1@ibv.com | porteria |
| recibidor1@ibv.com | recibidor |
| inventario1@ibv.com | inventario |
| despacho1@ibv.com | despachador |

Ver: `frontend/src/services/supabaseUserService.ts` → `USER_SEED_MAP`

## Servicios

### supabaseUserService.ts
Gestión de usuarios CRUD directo a tabla `users_user`:

```typescript
- getUserRole(email)       // Obtener rol por correo
- getUserProfile(email)    // Perfil completo
- getAllUsers()            // Listar usuarios
- createUser(data)         // Crear usuario
- updateUser(id, updates)  // Actualizar usuario
- deleteUser(id)           // Eliminar usuario
- ensureUserExists(email)  // Seed automático
- seedAllUsers()           // Seed batch
```

### supabaseDataService.ts
Datos del dashboard y actividades:

```typescript
- getVehicles()           // Obtener vehículos con JOIN
- getDashboardStats()     // KPIs del dashboard
- getActivities(limit)    // Actividades recientes
- getBuques()             // Listar buques
```

## Ventajas de esta arquitectura

✅ **Sin servidor backend**: No hay que mantener Django, solo Supabase  
✅ **Escalabilidad**: Supabase maneja el scaling automáticamente  
✅ **Seguridad**: RLS a nivel de base de datos  
✅ **Realtime**: WebSockets nativos para actualizaciones en vivo  
✅ **Storage**: Supabase Storage para fotos de impronta  
✅ **Auth**: Sistema robusto de autenticación JWT  
✅ **Costo**: Plan gratuito de Supabase suficiente para MVP  

## Desventajas (para considerar en futuro)

⚠️ **Lógica de negocio compleja**: Si crece mucho, puede ser mejor tener un backend  
⚠️ **Vendor lock-in**: Dependencia de Supabase  
⚠️ **RLS complexity**: Políticas complejas pueden ser difíciles de mantener  

## Próximos pasos

1. Implementar Supabase Realtime para notificaciones push
2. Configurar Supabase Storage para fotos de impronta
3. Agregar tests E2E (Playwright)
4. Configurar CI/CD para despliegue automático (Vercel/Netlify)
