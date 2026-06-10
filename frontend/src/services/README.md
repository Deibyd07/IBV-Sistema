# Services

Servicios para lógica de negocio e integración con API.

## Estructura actual

- **api.ts** - Instancia de axios configurada
- **userService.ts** - Servicio para operaciones de usuarios

## Crear un nuevo servicio

```typescript
// src/services/vehicleService.ts
import { $fetch } from 'ofetch'

export const vehicleService = {
  async getAll() {
    return await $fetch('/api/vehicles')
  },

  async getById(id: string) {
    return await $fetch(`/api/vehicles/${id}`)
  },

  async create(data: any) {
    return await $fetch('/api/vehicles', {
      method: 'POST',
      body: data,
    })
  },

  async update(id: string, data: any) {
    return await $fetch(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: data,
    })
  },

  async delete(id: string) {
    return await $fetch(`/api/vehicles/${id}`, {
      method: 'DELETE',
    })
  },
}
```

## Uso en componentes

```vue
<script setup lang="ts">
import { vehicleService } from '~/services/vehicleService'

const vehicles = ref([])
const isLoading = ref(false)

const fetchVehicles = async () => {
  isLoading.value = true
  try {
    vehicles.value = await vehicleService.getAll()
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchVehicles)
</script>
```

## Convenciones

- Usar `$fetch` para peticiones (precargado en Nuxt)
- Mantener servicios stateless
- Implementar manejo de errores
- Usar TypeScript para tipado
