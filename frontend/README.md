# Sistema IBV - Frontend

Frontend Nuxt 3 + TailwindCSS para el Sistema de Inventario y Despacho de Vehículos en Bodegas.

## 🚀 Inicio rápido

### Requisitos

- Node.js 18+
- npm o pnpm

### Instalación

```bash
cd frontend
npm install
```

### Desarrollo

```bash
npm run dev
```

Accede a `http://localhost:3000`

### Build

```bash
npm run build
npm run preview
```

## 📁 Estructura

```
frontend/
├── src/
│   ├── pages/           # Rutas (Nuxt auto-routing)
│   ├── components/      # Componentes reutilizables
│   ├── layouts/         # Layouts de página
│   ├── stores/          # Pinia stores
│   ├── services/        # Cliente API
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilidades
│   ├── assets/          # Recursos estáticos
│   └── app.vue          # Componente raíz
├── public/              # Archivos públicos
├── nuxt.config.ts       # Configuración Nuxt
├── tailwind.config.ts   # Configuración TailwindCSS
└── package.json
```

## 🎨 Tecnologías

- **Vue 3** - Framework reactivo
- **Nuxt 3** - Meta-framework
- **TailwindCSS** - Utilidades CSS
- **Pinia** - Gestión de estado
- **TypeScript** - Tipado estático
- **Axios** - Cliente HTTP
- **html5-qrcode** - Escaneo QR
- **PrintJS** - Impresión
- **XLSX** - Exportación Excel

## 🔑 Variables de Entorno

Copia `.env.example` a `.env.local`:

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000/api
DEBUG=false
```

## 📖 Páginas

- `/` - Inicio
- `/login` - Iniciar sesión
- `/admin` - Panel de administración
- `/admin/usuarios` - Gestión de usuarios (requiere autenticación)

## 🧩 Componentes

- `QrScanner` - Escaneo de códigos QR (cámara + entrada manual)

## 🏪 Stores (Pinia)

- `auth` - Autenticación y sesión de usuario

## 📝 Próximas tareas

- [ ] Conectar con API del backend
- [ ] Implementar autenticación
- [ ] Módulo de recepción de vehículos
- [ ] Módulo de impronta
- [ ] Módulo de inventario
- [ ] Módulo de despacho
- [ ] Dashboard y reportes

## 📄 Licencia

Privado - Todos los derechos reservados.
