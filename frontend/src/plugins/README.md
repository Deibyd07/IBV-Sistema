# Plugins

Plugins de Nuxt para extender funcionalidades.

## Convenciones

- Plugins automáticos: se ejecutan al iniciar la app
- Nombrar con prefijo si es específico: `vue-query.client.ts`

## Ejemplos

### `vueQuery.ts` - Integrar TanStack Query

```typescript
import { VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueQueryPlugin)
})
```

### `i18n.ts` - Internacionalización

```typescript
import i18n from './i18n.config'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(i18n)
})
```

## Uso

Los plugins se cargan automáticamente y están disponibles en toda la app.

Acceder desde componentes:

```vue
<script setup lang="ts">
const { $i18n } = useNuxtApp()
</script>
```
