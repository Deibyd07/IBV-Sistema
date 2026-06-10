# Public

Archivos estáticos servidos directamente sin procesamiento.

## Convenciones

- `robots.txt` - Para SEO
- `sitemap.xml` - Mapa del sitio
- `favicon.ico` - Icono del sitio
- Archivos que no necesitan construcción

## Acceso

```vue
<template>
  <!-- Servido desde /public/robots.txt como /robots.txt -->
  <img src="/logo.png" />
</template>
```

## Diferencia con assets/

- **public/** - Copiados tal cual, rutas absolutas
- **assets/** - Procesados por Webpack, rutas relativas con `~`
