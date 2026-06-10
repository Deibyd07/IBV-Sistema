# Sistema IBV - Inventario y Despacho de Vehículos en Bodegas

![Frontend CI](https://github.com/CamiloTriana75/Sistema-IBV/workflows/Frontend%20CI/badge.svg)

Sistema web/responsivo para gestionar el ciclo completo de recepción, inventario, impronta y despacho de vehículos provenientes de buques hacia bodegas.

## Descripción

Sistema integral que permite controlar todo el flujo operativo de vehículos en bodegas portuarias: desde la recepción del buque, el registro e impronta de cada vehículo, la verificación de inventario, hasta el despacho condicionado y la generación de reportes.

## Funcionalidades principales

- **Escaneo QR** — Cámara de celular y pistola de escaneo
- **Recepción de vehículos** — Registro desde buques con datos y QR
- **Impronta** — Registro fotográfico y de datos por vehículo
- **Inventario** — Checklist de verificación de equipamiento
- **Despacho condicionado** — Solo si impronta e inventario están completos
- **Gestión de roles** — Administrador, Portería, Recibidor, Inventario, Despachador, Cliente
- **Reportes** — Estadísticas, exportación a Excel, recibos imprimibles

## Stack Tecnológico

| Capa | Tecnología | Estado |
|---|---|---|
| **Frontend** | Vue 3 + Nuxt 3 + TypeScript | ✅ Implementado |
| **Base de datos** | Supabase (PostgreSQL) | ✅ Implementado |
| **Autenticación** | Supabase Auth | ✅ Implementado |
| **Almacenamiento** | Supabase Storage | ✅ Implementado |
| **Estilos** | TailwindCSS | ✅ Implementado |
| **API** | Supabase (directo desde frontend) | ✅ Implementado |

## Estructura del proyecto

```
Sistema-IBV/
├── frontend/          # Nuxt 3 + Vue 3 (Aplicación completa)
│   ├── src/
│   │   ├── components/      # Componentes Vue reutilizables
│   │   ├── pages/           # Páginas/rutas (admin, porteria, etc.)
│   │   ├── services/        # Servicios de Supabase (users, data, auth)
│   │   ├── stores/          # Pinia stores (auth, stats)
│   │   ├── middleware/      # Middlewares de ruta (auth, roles)
│   │   └── plugins/         # Plugins (supabase client)
├── scripts/           # Scripts de utilidad (setup Supabase)
├── docs/              # Documentación del proyecto
└── .github/           # Templates de GitHub (PR, Issues)
```

## Requisitos previos

- **Node.js:** 18+ (recomendado 20.x)
- **npm** o **pnpm** o **yarn**
- **Cuenta de Supabase** (gratuita)
- **Git:** Para control de versiones

## CI/CD Pipeline

Este proyecto tiene configurado GitHub Actions para integración continua.

### 🔄 Workflows Automáticos

#### Frontend CI
- **Trigger:** Push o PR a `develop` o `main` con cambios en `frontend/`
- **Pasos:**
  - ✅ Linting (ESLint)
  - ✅ Formateo (Prettier)
  - ✅ Type checking (TypeScript)
  - ✅ Build del proyecto (Nuxt)
  - ✅ Tests (si existen)
- **Matrices:** Node.js 18.x y 20.x

### 🛠️ Scripts de Pre-Commit

Ejecuta verificaciones localmente antes de hacer commit:

```bash
# Frontend
.\scripts\pre-commit-frontend.ps1
```

Ver documentación completa en [.github/README.md](.github/README.md)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/CamiloTriana75/Sistema-IBV.git
cd Sistema-IBV
```

### 2. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ejecutar el SQL de configuración:
   - Ir a SQL Editor en Supabase Dashboard
   - Copiar y ejecutar `scripts/sql/00_full_setup.sql`
3. Obtener credenciales:
   - **URL del proyecto**: Settings → API → Project URL
   - **Anon key**: Settings → API → Project API keys → anon/public

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Supabase
NUXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NUXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Instalar dependencias y ejecutar

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 5. Usuarios por defecto

Al hacer login por primera vez con estos correos, se crean automáticamente en la base de datos:

| Email | Rol | Contraseña |
|---|---|---|
| admin1@ibv.com | Administrador | (configurar en Supabase Auth) |
| porteria1@ibv.com | Portería | (configurar en Supabase Auth) |
| recibidor1@ibv.com | Recibidor | (configurar en Supabase Auth) |
| inventario1@ibv.com | Inventario | (configurar en Supabase Auth) |
| despacho1@ibv.com | Despachador | (configurar en Supabase Auth) |

**Crear usuarios en Supabase:**
1. Ir a Authentication → Users
2. Click en "Add user"
3. Ingresar email y contraseña
4. El rol se asigna automáticamente al hacer login

## Despliegue

### Vercel (Recomendado para Nuxt)

1. Conectar repositorio GitHub con Vercel
2. Configurar variables de entorno (Supabase URL y Key)
3. Deploy automático en cada push a `main`

### Netlify

1. Conectar repositorio GitHub con Netlify
2. Netlify detecta automáticamente `netlify.toml` (ya incluido en la raíz)
3. Configurar variables de entorno en Netlify:
   - `NUXT_PUBLIC_SUPABASE_URL`
   - `NUXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático en cada push a `main`

## Equipo

| Rol | Enfoque |
|---|---|
| Dev 1 — Frontend Lead | Vue, Nuxt, UI/UX, componentes QR |
| Dev 2 — Fullstack | Supabase, integraciones, lógica de negocio |
| Dev 3 — Fullstack | Reportes, módulos secundarios, testing |

## Metodología

Scrum — Sprints de 2 semanas

## Estrategia de Ramas (Git Branching)

Este proyecto utiliza una estrategia basada en **Git Flow simplificado** para mantener un desarrollo ordenado y colaborativo.

### Ramas Principales

| Rama | Propósito | Protección |
|---|---|---|
| `main` | Código en producción, siempre estable | ✅ Protegida |
| `develop` | Rama de desarrollo principal, integración continua | ✅ Protegida |

### Ramas de Trabajo

#### Features (Nuevas funcionalidades)
```
feature/<nombre-descriptivo>
```
**Ejemplos:**
- `feature/qr-scanner`
- `feature/vehicle-reception`
- `feature/inventory-checklist`

**Flujo:**
1. Crear desde `develop`
2. Desarrollar la funcionalidad
3. Pull Request hacia `develop`
4. Code review y merge

#### Bugfixes (Correcciones)
```
bugfix/<descripcion-del-bug>
```
**Ejemplos:**
- `bugfix/login-validation`
- `bugfix/qr-scan-crash`

**Flujo:**
1. Crear desde `develop`
2. Corregir el bug
3. Pull Request hacia `develop`

#### Hotfixes (Correcciones urgentes en producción)
```
hotfix/<descripcion-urgente>
```
**Ejemplos:**
- `hotfix/security-patch`
- `hotfix/critical-dispatch-error`

**Flujo:**
1. Crear desde `main`
2. Corregir el problema
3. Pull Request hacia `main` **y** `develop`

#### Refactor (Mejoras de código sin cambiar funcionalidad)
```
refactor/<componente-o-modulo>
```
**Ejemplos:**
- `refactor/auth-service`
- `refactor/database-queries`

### Convenciones de Commits

Seguimos **Conventional Commits** para mensajes claros:

```
<tipo>(<scope>): <descripción corta>

[cuerpo opcional]
[footer opcional]
```

**Tipos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, espacios (sin cambios de código)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

**Ejemplos:**
```
feat(qr): agregar scanner de códigos QR
fix(login): corregir validación de credenciales
docs(readme): actualizar instrucciones de instalación
refactor(api): mejorar estructura de servicios
```

### Flujo de Trabajo

1. **Crear rama desde `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/mi-funcionalidad
   ```

2. **Desarrollar y commitear:**
   ```bash
   git add .
   git commit -m "feat(modulo): descripción del cambio"
   ```

3. **Mantener actualizado con `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/mi-funcionalidad
   git merge develop
   ```

4. **Push y crear Pull Request:**
   ```bash
   git push origin feature/mi-funcionalidad
   ```
   - Crear PR en GitHub hacia `develop`
   - Completar el template de PR
   - Solicitar code review

5. **Después del merge, eliminar rama:**
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d feature/mi-funcionalidad
   ```

### Releases

Para publicar a producción:
1. Crear PR de `develop` → `main`
2. Revisión final del equipo
3. Merge a `main`
4. Tag de versión: `git tag -a v1.0.0 -m "Release 1.0.0"`

## Licencia

Privado — Todos los derechos reservados.
