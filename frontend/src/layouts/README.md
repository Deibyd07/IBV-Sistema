# Layouts

Layouts que envuelven las páginas.

## Estructura

- **default.vue** - Layout por defecto para la aplicación principal
- **blank.vue** - Layout sin sidebar/header (para login, etc.)

## Uso en páginas

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})
</script>
```

Si no especificas layout, se usa `default.vue` automáticamente.

## Convenciones

- Usar `<slot />` para renderizar el contenido de la página
- Mantener layouts simples y limpios
- Los layouts pueden acceder a stores y composables
- Usar `<NuxtPage />` para renderizar la página

Ejemplo:

```vue
<template>
  <div class="layout">
    <header>
      <Navbar />
    </header>
    <main>
      <NuxtPage />
    </main>
    <footer>
      <Footer />
    </footer>
  </div>
</template>
```
