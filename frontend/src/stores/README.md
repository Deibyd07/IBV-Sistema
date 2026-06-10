# Stores (Pinia)

Estado global centralizado usando Pinia.

## Estructura actual

- **auth.ts** - Store para autenticación
- **userStore.ts** - Store para datos de usuarios

## Crear un nuevo store

```typescript
// src/stores/myStore.ts
import { defineStore } from 'pinia'

export const useMyStore = defineStore('my-store', {
  state: () => ({
    count: 0,
    items: [],
  }),

  getters: {
    doubleCount: (state) => state.count * 2,
  },

  actions: {
    increment() {
      this.count++
    },

    async fetchItems() {
      const data = await $fetch('/api/items')
      this.items = data
    },
  },
})
```

## Usar en componentes

```vue
<script setup lang="ts">
import { useMyStore } from '~/stores/myStore'

const myStore = useMyStore()

// Acceder al estado
console.log(myStore.count)

// Acceder a getters
console.log(myStore.doubleCount)

// Llamar acciones
myStore.increment()
myStore.fetchItems()
</script>

<template>
  <div>
    <p>Count: {{ myStore.count }}</p>
    <button @click="myStore.increment">Increment</button>
  </div>
</template>
```

## Convenciones

- Nombrar stores en singular: `useAuthStore`, `useUserStore`
- Usar Setup Syntax (`defineStore(..., { ... })`)
- Mantener la lógica de estado en actions
- Usar getters para datos computados
