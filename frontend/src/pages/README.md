# Pages

Las páginas se generan automáticamente como rutas basadas en la estructura de archivos.

## Enrutamiento automático de Nuxt

```
pages/
├── index.vue              → /
├── login.vue              → /login
├── admin/
│   ├── index.vue          → /admin
│   ├── usuarios.vue       → /admin/usuarios
│   └── usuarios/
│       ├── [id].vue       → /admin/usuarios/:id
│       └── crear.vue      → /admin/usuarios/crear
├── vehiculos/
│   ├── index.vue          → /vehiculos
│   └── [id].vue           → /vehiculos/:id
└── [...slug].vue          → Catch-all para rutas no encontradas

```

## Convenciones

- Usar kebab-case para nombres de archivos
- Usar parámetros dinámicos entre corchetes: `[id].vue`
- Usar `[...slug].vue` para rutas catch-all
- Cada página debe definir su próprio layout usando `definePageMeta()`

Ejemplo:

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})
</script>
```

## Estructura actual

- **index.vue** - Página de inicio
- **login.vue** - Página de login
- **admin/** - Módulo administrativo
  - usuarios.vue - Listado de usuarios
  - usuarios/[id].vue - Detalle de usuario (dinámico)
