# Types

Definiciones de tipos TypeScript compartidas.

## Estructura

```typescript
// src/types/index.ts
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
}

export interface Vehicle {
  id: string
  model: string
  plate: string
  status: 'available' | 'in-use' | 'maintenance'
  warehouse: string
  createdAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

## Convenciones

- Usar PascalCase para nombres de interfaces
- Exportar desde `index.ts` para fácil acceso
- Mantener tipos relacionados juntos
- Usar tipos genéricos para respuestas API
