# Middleware

Middlewares de Nuxt para proteger rutas y ejecutar lógica antes de renderizar.

## Convenciones

- Middleware automático: `src/middleware/auth.ts` → `auth`
- Retornar `navigateTo()` para redireccionar

## Ejemplos

### auth.ts - Proteger rutas autenticadas

```typescript
export default defineRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
```

### admin.ts - Proteger rutas administrativas

```typescript
export default defineRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  if (authStore.user?.role !== 'admin') {
    return navigateTo('/')
  }
})
```

## Uso en páginas

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin'],
})
</script>
```

## Tipos de middleware

- **Route middleware** - Se ejecuta en navegación entre rutas
- **Named middleware** - Se asigna explícitamente en páginas
- **Global middleware** - Se ejecuta en cada navegación (sufijo `global`)
