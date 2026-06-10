<div align="center">

# Sistema IBV

### Inventario y Despacho de Vehículos en Bodegas

Plataforma web responsiva para gestionar el ciclo completo de **recepción, impronta, inventario y despacho** de vehículos provenientes de buques hacia bodegas portuarias.

[![Nuxt](https://img.shields.io/badge/Nuxt-3-00DC82?logo=nuxtdotjs&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## 📑 Tabla de contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack tecnológico](#-stack-tecnológico)
- [Roles del sistema](#-roles-del-sistema)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Requisitos previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts disponibles](#-scripts-disponibles)
- [Despliegue](#-despliegue)
- [Flujo de trabajo Git](#-flujo-de-trabajo-git)
- [Licencia](#-licencia)

---

## 📖 Descripción

**Sistema IBV** controla todo el flujo operativo de vehículos en bodegas portuarias: desde la llegada del buque y el registro e impronta de cada vehículo, pasando por la verificación de inventario, hasta el **despacho condicionado** y la generación de reportes.

El sistema garantiza la **trazabilidad de extremo a extremo**: un vehículo solo puede ser despachado cuando su impronta y su inventario están completos, eliminando errores manuales y dejando un registro auditable de cada operación.

---

## ✨ Características

- **📷 Escaneo QR** — Compatible con cámara de dispositivos móviles y pistolas de escaneo.
- **🚢 Recepción de vehículos** — Registro de vehículos desde buques, con datos y generación de QR.
- **🖊️ Impronta** — Registro fotográfico y de datos por vehículo, con recibo imprimible.
- **📋 Inventario** — Checklist de verificación de equipamiento y estado del vehículo.
- **🚚 Despacho condicionado** — El despacho solo se habilita si impronta e inventario están completos.
- **🔐 Gestión de roles** — Control de acceso por rol mediante middlewares y Row Level Security.
- **🔔 Notificaciones** — Centro de notificaciones en la aplicación.
- **📊 Reportes y estadísticas** — Dashboards con KPIs, exportación a Excel y recibos imprimibles.
- **🧾 Auditoría** — Registro de actividades y excepciones operativas.

---

## 🏗️ Arquitectura

El proyecto utiliza una arquitectura **serverless** basada en Supabase como Backend as a Service. El frontend Nuxt 3 se comunica directamente con Supabase mediante su SDK, sin un servidor intermedio que mantener.

```
┌──────────────┐
│   Navegador  │
│   (Nuxt 3)   │
└──────┬───────┘
       │  Supabase Client SDK (JWT)
       ▼
┌─────────────────────────────────┐
│          Supabase Cloud         │
├─────────────────────────────────┤
│  • PostgreSQL  (base de datos)  │
│  • Auth        (autenticación)  │
│  • Storage     (archivos/fotos) │
│  • Realtime    (WebSockets)     │
│  • Row Level Security (RLS)     │
└─────────────────────────────────┘
```

> 📚 Documentación detallada en [ARQUITECTURA.md](ARQUITECTURA.md) y la carpeta [docs/](docs/).

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Framework** | Nuxt 3 + Vue 3 |
| **Lenguaje** | TypeScript |
| **Estilos** | TailwindCSS |
| **Estado** | Pinia |
| **Build** | Vite |
| **Base de datos** | Supabase (PostgreSQL) |
| **Autenticación** | Supabase Auth (JWT) |
| **Almacenamiento** | Supabase Storage |
| **Seguridad** | Row Level Security (RLS) |
| **Testing** | Vitest |

---

## 👥 Roles del sistema

| Rol | Acceso | Responsabilidad principal |
|-----|--------|---------------------------|
| **Administrador** | `/admin` | Gestión total: usuarios, roles, estadísticas, auditoría y excepciones |
| **Portería** | `/porteria` | Registro de movimientos de entrada y salida |
| **Recibidor** | `/recibidor` | Recepción de vehículos e improntas |
| **Inventario** | `/inventario` | Checklist y verificación de equipamiento |
| **Despachador** | `/despachador` | Escaneo, planillas y despacho de vehículos |
| **Cliente** | — | Consulta de sus vehículos (solo lectura) |

El rol se asigna automáticamente al iniciar sesión y se valida en cada ruta mediante middlewares y políticas RLS.

---

## 📂 Estructura del proyecto

```
Sistema-IBV/
├── frontend/                 # Aplicación Nuxt 3 + Vue 3
│   └── src/
│       ├── components/       # Componentes Vue (common, charts, admin, etc.)
│       ├── pages/            # Rutas por rol (admin, porteria, recibidor, …)
│       ├── layouts/          # Layouts (admin, default, blank)
│       ├── services/         # Capa de servicios Supabase
│       ├── stores/           # Pinia stores (auth, stats, inventario, …)
│       ├── middleware/       # Guards de ruta por rol
│       ├── composables/      # Composables (useQrScanner, …)
│       ├── plugins/          # Cliente Supabase
│       └── tests/            # Pruebas unitarias (Vitest)
├── scripts/sql/              # Scripts SQL: modelo de BD y políticas RLS
├── docs/                     # Documentación técnica y guías de Supabase
├── .github/                  # Workflows de CI y plantilla de PR
└── netlify.toml              # Configuración de despliegue en Netlify
```

---

## ✅ Requisitos previos

- **Node.js** 20.x (recomendado) o 18+
- **npm** (incluido con Node.js)
- Una cuenta de **Supabase** (el plan gratuito es suficiente)
- **Git**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Deibyd07/IBV-Sistema.git
cd IBV-Sistema
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En **SQL Editor**, ejecuta los scripts en este orden:
   - `scripts/sql/00_MODELO_BD_COMPLETO.sql` — modelo de base de datos.
   - `scripts/sql/00_POLITICAS_RLS_CREAR_TODAS.sql` — políticas de seguridad (RLS).
   - `scripts/sql/05_recibidor_tables.sql` — tablas del módulo recibidor.
3. Obtén las credenciales en **Settings → API**:
   - **Project URL**
   - **anon / public key**

### 3. Configurar variables de entorno

Crea un archivo `frontend/.env` (ver [Variables de entorno](#-variables-de-entorno)).

### 4. Instalar dependencias y ejecutar

```bash
cd frontend
npm install
npm run dev
```

La aplicación quedará disponible en **http://localhost:3000**.

### 5. Crear usuarios

En Supabase, ve a **Authentication → Users → Add user** y crea las cuentas. Al iniciar sesión por primera vez, el rol se asigna automáticamente según el correo:

| Email | Rol |
|-------|-----|
| `admin1@ibv.com` | Administrador |
| `porteria1@ibv.com` | Portería |
| `recibidor1@ibv.com` | Recibidor |
| `inventario1@ibv.com` | Inventario |
| `despacho1@ibv.com` | Despachador |

---

## 🔑 Variables de entorno

Crea `frontend/.env` con las siguientes claves:

```bash
# Supabase
NUXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

> ⚠️ El archivo `.env` está incluido en `.gitignore` y **nunca debe subirse al repositorio**.

---

## 📜 Scripts disponibles

Ejecutar desde la carpeta `frontend/`:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila la aplicación para producción |
| `npm run preview` | Previsualiza el build de producción |
| `npm run generate` | Genera el sitio estático |
| `npm run lint` | Analiza el código con ESLint |
| `npm run lint:fix` | Corrige automáticamente errores de lint |
| `npm run format` | Formatea el código con Prettier |
| `npm run type-check` | Verifica los tipos con TypeScript |
| `npm run test` | Ejecuta las pruebas con Vitest |

---

## ☁️ Despliegue

### Netlify

1. Conecta el repositorio con Netlify.
2. Netlify detecta automáticamente [netlify.toml](netlify.toml).
3. Configura las variables `NUXT_PUBLIC_SUPABASE_URL` y `NUXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Despliegue automático en cada push a `main`.

### Vercel

1. Importa el repositorio en Vercel (preset Nuxt).
2. Define el directorio raíz como `frontend/`.
3. Configura las mismas variables de entorno.
4. Despliegue automático en cada push a `main`.

---

## 🌿 Flujo de trabajo Git

El proyecto sigue un **Git Flow simplificado**.

| Rama | Propósito |
|------|-----------|
| `main` | Código en producción, siempre estable |
| `develop` | Integración de desarrollo |
| `feature/*` | Nuevas funcionalidades (parten de `develop`) |
| `bugfix/*` | Correcciones (parten de `develop`) |
| `hotfix/*` | Correcciones urgentes (parten de `main`) |

Se utilizan [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(qr): agregar scanner de códigos QR
fix(login): corregir validación de credenciales
docs(readme): actualizar instrucciones de instalación
```

---

## 📄 Licencia

Privado — Todos los derechos reservados.

<div align="center">

**Sistema IBV** · Hecho con Nuxt 3 + Supabase

</div>
