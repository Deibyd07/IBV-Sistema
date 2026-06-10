# Server

Lógica de servidor Nitro (backend de Nuxt).

## Estructura

### `api/`

Rutas API del servidor Nuxt.

Ejemplo: `src/server/api/users.ts`

```typescript
export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  // Lógica del servidor
  const user = await db.users.findByEmail(email)

  return { success: true, user }
})
```

Aceso desde cliente: `GET /api/users`

### `middleware/`

Middlewares de servidor.

Ejemplo: `src/server/middleware/cors.ts`

```typescript
export default defineEventHandler((event) => {
  // Lógica compartida para todas las rutas
})
```

## Convenciones

- Usar `defineEventHandler` para definir eventos
- `readBody()` para leer el cuerpo de la request
- `setResponseStatus()` para establecer status HTTP
- `send()` o retornar objeto para responder
