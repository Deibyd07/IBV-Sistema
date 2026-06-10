# Components

Componentes reutilizables del proyecto.

## Estructura

### `common/`

Componentes comunes compartidos en toda la aplicación.

- Botones, inputs, modales, alertas, etc.

Ejemplos:

```vue
<CommonButton @click="handleClick">Click me</CommonButton>
<CommonModal v-model="isOpen">Content</CommonModal>
```

### `forms/`

Componentes específicos para formularios.

- FormInput, FormSelect, FormCheckbox, FormValidation, etc.

Ejemplo:

```vue
<FormInput v-model="email" type="email" label="Email" required />
```

### `layout/`

Componentes de layout y navegación.

- Header, Sidebar, Footer, Navigation, etc.

### `admin/`

Componentes específicos del módulo administrativo.

- AdminPanel, UserTable, VehicleTable, etc.

## Convenciones

- Usar PascalCase para nombres de componentes
- Usar scoped styles con `<style scoped>`
- Documentar props con comentarios JSDoc
- Mantener componentes pequeños y reutilizables
