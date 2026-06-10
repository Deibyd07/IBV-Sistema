# Utils

Funciones de utilidad reutilizables.

## Ejemplos

### `helpers.ts`

```typescript
// Validación
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Formateo
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('es-ES')
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Conversión
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}
```

## Convenciones

- Funciones puras sin efectos secundarios
- Nombres descriptivos: `isValidEmail`, `formatDate`
- Exportar individualmente o como objeto
- Usar en componentes y services

Uso:

```typescript
import { formatDate, formatCurrency } from '~/utils/helpers'

const formatted = formatDate(new Date())
const price = formatCurrency(99.99)
```
