# Composables

Lógica reutilizable usando Composition API.

## Convenciones

- Nombrar siempre con prefijo `use`: `useAuth`, `useFetch`, `useWindowSize`
- Un composable por archivo
- Retornar un objeto con estado y métodos

## Ejemplos

### useAuth.ts

```typescript
export const useAuth = () => {
  const user = ref(null)
  const isLoading = ref(false)

  const login = async (email: string, password: string) => {
    isLoading.value = true
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      user.value = response.user
    } finally {
      isLoading.value = false
    }
  }

  return { user, isLoading, login }
}
```

### useFetch.ts

```typescript
export const useFetch = (url: string) => {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(true)

  const fetch = async () => {
    try {
      data.value = await $fetch(url)
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  onMounted(fetch)

  return { data, error, loading, refetch: fetch }
}
```

## Uso en componentes

```vue
<script setup lang="ts">
const { user, login } = useAuth()
</script>
```
