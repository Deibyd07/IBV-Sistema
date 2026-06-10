# Assets

Archivos estáticos: imágenes, estilos, fuentes.

## Estructura

### `styles/`

Estilos globales y de Tailwind CSS.

- `global.css` - Estilos globales
- `variables.css` - Variables CSS customizadas

### `images/`

Imágenes, iconos y recursos visuales.

- `logo.png`
- `icons/`
- `backgrounds/`

### `fonts/`

Fuentes personalizadas.

- `roboto/`
- `inter/`

## Importar en componentes

```vue
<template>
  <img src="~/assets/images/logo.png" alt="Logo" />
</template>

<style scoped>
@import '~/assets/styles/variables.css';
</style>
```

## Convenciones

- Usar alias `~` para importar desde `src`
- Optimizar imágenes antes de añadirlas
- Usar Tailwind CSS para estilos, minimizar CSS custom
