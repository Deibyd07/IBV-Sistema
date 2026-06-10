# Sistema IBV - Inventario y Despacho de Vehículos en Bodegas

## Planificación General del Proyecto

**Fecha de inicio de planificación:** 21 de febrero de 2026  
**Metodología:** Scrum (Sprints de 2 semanas)  
**Equipo:** 3 desarrolladores  
**Stack Tecnológico:** Vue (Frontend) + Nuxt + Django (Backend/API) + Python + Supabase (Base de datos - plan pago)

---

## 1. RESUMEN DEL PROYECTO

Sistema web/responsivo para gestionar el ciclo completo de recepción, inventario, impronta y despacho de vehículos provenientes de buques hacia bodegas. Incluye escaneo QR (cámara y pistola), gestión de roles, generación de reportes y estadísticas.

---

## 2. ROLES DE USUARIO IDENTIFICADOS

| Rol | Responsabilidad |
|---|---|
| **Administrador** | Gestión total del sistema, usuarios, configuración y reportes |
| **Portería** | Ingreso/salida de vehículos y control de personal |
| **Recibidor** | Recepción de vehículos desde buques, carga de información inicial |
| **Inventario** | Verificación de equipamiento completo de cada vehículo |
| **Despachador** | Confirma impronta + inventario OK, genera planillas, despacha vehículos |
| **Cliente** | Consulta estado de sus vehículos (lectura) |

---

## 3. MÓDULOS DEL SISTEMA

### M1 - Autenticación y Gestión de Usuarios
- Login/logout con roles y permisos
- CRUD de usuarios por parte del administrador
- Asignación de roles

### M2 - Recepción de Vehículos (Recibidor)
- Escaneo/digitación de identificación del barco/buque
- Escaneo QR del vehículo al recibirlo (cámara o pistola)
- Carga de información base del vehículo (BIN, marca, modelo, color, etc.)
- Carga de modelos pre-establecidos desde la BD

### M3 - Impronta
- Registro de impronta por vehículo mediante código QR
- Adjuntar foto de la impronta (con opción de escaneo)
- Vincular impronta al BIN del vehículo
- Opción de impresión de la impronta

### M4 - Inventario de Vehículo
- Checklist de verificación de equipamiento del vehículo
- Estado del inventario (completo/incompleto)
- Opción de impresión del inventario
- Vinculación al vehículo por QR/BIN

### M5 - Despacho de Vehículos
- **Condición obligatoria:** Impronta ✅ + Inventario ✅
- Inicio de proceso de despacho: se digita cantidad de vehículos a despachar
- Escaneo secuencial de cada vehículo (orden de escaneo = orden de salida)
- Al escanear se carga la info del vehículo con impronta e inventario
- Generación de planillas con información general
- Selección de vehículos a despachar

### M6 - Portería
- Control de ingreso/salida de vehículos
- Control de ingreso de personal
- Registro de movimientos

### M7 - Reportes y Estadísticas
- Estadísticas generales de toda la información
- Generación de reportes exportables a Excel
- Generación de recibos con información del vehículo
- Dashboard con métricas clave

### M8 - Escaneo QR (Transversal)
- Soporte para cámara de celular (responsivo)
- Soporte para pistola de escaneo tipo supermercado
- Generación de códigos QR por vehículo

---

## 4. PLAN DE MOCKUPS / WIREFRAMES

### Pantallas a diseñar (por prioridad):

| # | Pantalla | Módulo | Prioridad |
|---|---|---|---|
| 1 | Login | M1 | Alta |
| 2 | Dashboard principal (por rol) | M1 | Alta |
| 3 | Panel de administración de usuarios | M1 | Alta |
| 4 | Recepción: Identificación de buque | M2 | Alta |
| 5 | Recepción: Escaneo y registro de vehículo | M2 | Alta |
| 6 | Registro de impronta (foto + QR) | M3 | Alta |
| 7 | Vista de impronta (imprimible) | M3 | Media |
| 8 | Checklist de inventario del vehículo | M4 | Alta |
| 9 | Vista de inventario (imprimible) | M4 | Media |
| 10 | Panel de despacho: inicio de proceso | M5 | Alta |
| 11 | Despacho: escaneo secuencial | M5 | Alta |
| 12 | Despacho: planilla generada | M5 | Alta |
| 13 | Control de portería | M6 | Media |
| 14 | Dashboard de estadísticas | M7 | Media |
| 15 | Generación de reportes Excel | M7 | Media |
| 16 | Vista de recibo de vehículo | M7 | Media |
| 17 | Escaneo QR (componente reutilizable) | M8 | Alta |
| 18 | Ficha completa del vehículo | General | Alta |
| 19 | Listado/búsqueda de vehículos | General | Alta |
| 20 | Vista del cliente (consulta de estado) | M1 | Baja |

---

## 5. ARQUITECTURA TÉCNICA PROPUESTA

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Vue/Nuxt)               │
│  - Vue 3 + Nuxt 3                                   │
│  - Nuxt Router (rutas protegidas por rol)           │
│  - TailwindCSS (estilos)                            │
│  - Pinia (estado global)                            │
│  - html5-qrcode (escaneo QR por camara)             │
│  - print-js (impresion)                             │
│  - xlsx / exceljs (exportacion Excel)               │
│  - echarts (graficos estadisticos)                  │
│  - PWA (para uso en celular como app)               │
├─────────────────────────────────────────────────────┤
│                    BACKEND (Django)                │
│  - Django 5+                                        │
│  - Django REST Framework (API)                      │
│  - JWT (autenticacion API)                          │
│  - Permisos por roles (Django/DRF)                  │
│  - API RESTful                                      │
│  - pandas + openpyxl (reportes Excel)               │
│  - qrcode (generacion de QR)                        │
├─────────────────────────────────────────────────────┤
│               BASE DE DATOS (Supabase)              │
│  - PostgreSQL (motor de Supabase)                   │
│  - Supabase Storage (fotos de improntas)            │
│  - Supabase Realtime (opcional: actualizaciones)    │
└─────────────────────────────────────────────────────┘
```

---

## 6. MODELO DE DATOS (ENTIDADES PRINCIPALES)

| Entidad | Campos clave |
|---|---|
| **users** | id, nombre, email, password, rol_id, estado |
| **roles** | id, nombre, permisos |
| **buques** | id, nombre, identificación, fecha_arribo |
| **vehiculos** | id, bin, qr_code, buque_id, modelo_id, color, estado, fecha_registro |
| **modelos_vehiculo** | id, marca, modelo, año, tipo (pre-establecidos) |
| **improntas** | id, vehiculo_id, foto_url, datos_impronta, usuario_id, fecha, estado |
| **inventarios** | id, vehiculo_id, checklist_json, completo (bool), usuario_id, fecha |
| **despachos** | id, fecha, usuario_id, cantidad_vehiculos, estado |
| **despacho_vehiculos** | id, despacho_id, vehiculo_id, orden_escaneo |
| **movimientos_porteria** | id, tipo (entrada/salida), vehiculo_id, persona, usuario_id, fecha |
| **recibos** | id, vehiculo_id, despacho_id, datos_json, fecha |

---

## 7. PRODUCT BACKLOG (USER STORIES)

### Épica 1: Autenticación y Usuarios
- **US-01:** Como administrador, quiero crear/editar/eliminar usuarios para gestionar el acceso al sistema.
- **US-02:** Como usuario, quiero iniciar sesión y ver un dashboard acorde a mi rol.
- **US-03:** Como administrador, quiero asignar roles y permisos a los usuarios.

### Épica 2: Recepción de Vehículos
- **US-04:** Como recibidor, quiero registrar un buque escaneando o digitando su identificación.
- **US-05:** Como recibidor, quiero escanear el QR de un vehículo para registrarlo en el sistema.
- **US-06:** Como recibidor, quiero cargar la información del vehículo usando modelos pre-establecidos.

### Épica 3: Impronta
- **US-07:** Como recibidor, quiero registrar la impronta de un vehículo adjuntando foto y datos.
- **US-08:** Como usuario, quiero imprimir la ficha de impronta de un vehículo.
- **US-09:** Como usuario, quiero vincular la impronta al vehículo mediante su QR/BIN.

### Épica 4: Inventario
- **US-10:** Como verificador de inventario, quiero completar un checklist de equipamiento del vehículo.
- **US-11:** Como verificador, quiero marcar un inventario como completo o incompleto.
- **US-12:** Como usuario, quiero imprimir la ficha de inventario.

### Épica 5: Despacho
- **US-13:** Como despachador, quiero iniciar un proceso de despacho indicando la cantidad de vehículos.
- **US-14:** Como despachador, quiero escanear vehículos secuencialmente para agregarlos al despacho.
- **US-15:** Como despachador, solo puedo despachar vehículos que tengan impronta ✅ e inventario ✅.
- **US-16:** Como despachador, quiero generar planillas con la información general del despacho.

### Épica 6: Portería
- **US-17:** Como portero, quiero registrar el ingreso/salida de vehículos.
- **US-18:** Como portero, quiero registrar el ingreso de personal.

### Épica 7: Reportes y Estadísticas
- **US-19:** Como administrador, quiero ver un dashboard con estadísticas generales.
- **US-20:** Como usuario, quiero generar reportes exportables a Excel.
- **US-21:** Como usuario, quiero generar recibos con información del vehículo.

### Épica 8: QR / Escaneo
- **US-22:** Como usuario, quiero escanear QR con la cámara del celular.
- **US-23:** Como usuario, quiero usar una pistola de escaneo para leer códigos QR.

---


## 8. SPRINT PLANNING — DISTRIBUCIÓN PARA 3 PERSONAS (con tipo y orden)

> Convenciones:
> - **[BE]** Backend (Django/DRF)
> - **[FE]** Frontend (Vue/Nuxt)
> - **[DB]** Base de datos / Supabase
> - **[INFRA]** Repositorio, ramas, CI, despliegues, configuración
> - **[INT]** Integración FE↔BE / End-to-end
> - **[UX]** Diseño / Mockups / Wireframes
>
> El **orden** está pensado para desbloquear dependencias: primero infraestructura + modelo de datos + auth, luego módulos core, luego reportes y QA.

---

### 🏃 SPRINT 0 — Configuración y Mockups (Semana 1-2)
> **Objetivo:** Infraestructura lista + Modelo de datos definido + Mockups aprobados

| Orden | Tipo | Tarea | Responsable | SP | Descripción / Dependencias |
|---:|:---:|---|---|---:|---|
| 1 | [INFRA] | Configurar repositorio Git + ramas (dev, staging, main) | Dev 2 | 2 | Definir estrategia de ramas, protección, PR template si aplica |
| 2 | [DB] | Configurar Supabase: BD + Storage + esquema inicial | Dev 3 | 5 | Crear proyecto, buckets, variables, roles básicos |
| 3 | [BE] | Definir modelo de datos y migraciones Django | Dev 2 | 5 | Modelos + migraciones alineadas con entidades principales |
| 4 | [BE] | Configurar proyecto Django + DRF + JWT + conexión Supabase | Dev 2 | 5 | Base del backend lista para endpoints |
| 5 | [FE] | Configurar proyecto Vue + Nuxt + TailwindCSS | Dev 1 | 3 | Estructura base, layout, rutas, Tailwind |
| 6 | [BE] | Definir endpoints de la API (documentación) | Dev 2 | 3 | Swagger/Postman collection, contratos request/response |
| 7 | [UX] | Diseñar mockups: Login + Dashboard + Admin usuarios (pantallas 1-3) | Dev 1 | 5 | Flujo de autenticación y administración |
| 8 | [UX] | Diseñar mockups: Recepción + Escaneo QR (pantallas 4-5, 17) | Dev 3 | 5 | Flujo de recepción y componente QR reusable |
| 9 | [UX] | Diseñar mockups: Impronta + Inventario + Despacho (pantallas 6-12) | Dev 1 | 8 | Flujos core con estados y validaciones visibles |
| 10 | [UX] | Diseñar mockups: Portería + Reportes + Ficha vehículo (pantallas 13-19) | Dev 3 | 5 | Complementarios + búsqueda/listados |

---

### 🏃 SPRINT 1 — Core: Auth + Recepción + Escaneo QR (Semana 3-4)
> **Objetivo:** Login funcional + Registro de buques y vehículos con escaneo QR

| Orden | Tipo | Tarea | Responsable | SP | User Story / Dependencias |
|---:|:---:|---|---|---:|---|
| 1 | [BE] | API de autenticación (login, logout, me) | Dev 2 | 5 | US-02. Base para todo lo demás |
| 2 | [BE] | CRUD de usuarios + roles + permisos | Dev 2 | 5 | US-01, US-03. Depende de auth |
| 3 | [FE] | Página de Login + protección de rutas por rol | Dev 1 | 5 | US-02. Depende de endpoints auth |
| 4 | [INT] | Conectar frontend auth con backend DRF/JWT | Dev 3 | 3 | US-02. Manejo de tokens, refresh si aplica |
| 5 | [FE] | Panel de administración de usuarios | Dev 1 | 5 | US-01. Depende de CRUD usuarios |
| 6 | [FE] | Componente reutilizable de escaneo QR (cámara + pistola) | Dev 1 | 8 | US-22, US-23. Debe quedar reusable |
| 7 | [BE] | API de buques (CRUD + búsqueda) | Dev 2 | 3 | US-04 |
| 8 | [BE] | API de modelos de vehículo pre-establecidos | Dev 2 | 3 | US-06 |
| 9 | [BE] | API de vehículos (registro, búsqueda, QR) | Dev 2 | 5 | US-05, US-06 |
| 10 | [FE] | Pantalla recepción — identificación de buque | Dev 3 | 5 | US-04. Depende API buques |
| 11 | [FE] | Pantalla recepción — escaneo y registro de vehículo | Dev 3 | 5 | US-05. Depende API vehículos + componente QR |
| 12 | [FE] | Selector de modelo pre-establecido | Dev 3 | 3 | US-06. Depende API modelos |

**Total SP Sprint 1: 55**

---

### 🏃 SPRINT 2 — Impronta + Inventario (Semana 5-6)
> **Objetivo:** Flujo completo de impronta y checklist de inventario

| Orden | Tipo | Tarea | Responsable | SP | User Story / Dependencias |
|---:|:---:|---|---|---:|---|
| 1 | [BE] | API de improntas (crear, editar, consultar) | Dev 2 | 5 | US-07, US-09 |
| 2 | [BE] | Subida de fotos a Supabase Storage | Dev 2 | 5 | US-07. Depende de bucket/credenciales |
| 3 | [FE] | Pantalla de registro de impronta (foto + datos + QR) | Dev 1 | 8 | US-07. Depende API improntas |
| 4 | [FE] | Captura de foto con cámara del celular | Dev 1 | 5 | US-07. Integrar con flujo de subida |
| 5 | [FE] | Vista de impronta imprimible | Dev 1 | 3 | US-08 |
| 6 | [BE] | API de inventario (checklist, completo/incompleto) | Dev 2 | 5 | US-10, US-11 |
| 7 | [FE] | Pantalla de checklist de inventario del vehículo | Dev 3 | 8 | US-10 |
| 8 | [FE] | Vista de inventario imprimible | Dev 3 | 3 | US-12 |
| 9 | [FE] | Ficha completa del vehículo (impronta + inventario + estado) | Dev 3 | 5 | General. Depende de endpoints de consulta |
| 10 | [BE] | Validación: vehículo apto para despacho (impronta + inventario OK) | Dev 2 | 3 | US-15. Regla de negocio central |
| 11 | [INT] | Flujo recepción → impronta → inventario end-to-end | Dev 3 | 3 | Validar estados, permisos, errores |

**Total SP Sprint 2: 53**

---

### 🏃 SPRINT 3 — Despacho + Portería (Semana 7-8)
> **Objetivo:** Proceso de despacho completo y módulo de portería

| Orden | Tipo | Tarea | Responsable | SP | User Story / Dependencias |
|---:|:---:|---|---|---:|---|
| 1 | [BE] | API de despacho (crear proceso, agregar vehículos) | Dev 2 | 5 | US-13 |
| 2 | [BE] | Lógica de escaneo secuencial + validación aptitud | Dev 2 | 5 | US-14, US-15. Depende reglas Sprint 2 |
| 3 | [FE] | Pantalla inicio de despacho (digitar cantidad) | Dev 1 | 3 | US-13 |
| 4 | [FE] | Pantalla de escaneo secuencial de despacho | Dev 1 | 8 | US-14. Depende componente QR + API despacho |
| 5 | [BE] | Generación de planillas (PDF/imprimible) | Dev 2 | 5 | US-16 |
| 6 | [FE] | Vista de planilla de despacho generada | Dev 1 | 5 | US-16. Depende endpoint planilla |
| 7 | [BE] | API de portería (ingreso/salida vehículos y personal) | Dev 2 | 3 | US-17, US-18 |
| 8 | [FE] | Panel de portería | Dev 3 | 5 | US-17, US-18 |
| 9 | [FE] | Listado/búsqueda general de vehículos con filtros | Dev 3 | 5 | General (apoya portería y despacho) |
| 10 | [INT] | Flujo despacho end-to-end con validaciones | Dev 3 | 5 | US-15. Pruebas con casos borde |

**Total SP Sprint 3: 49**

---

### 🏃 SPRINT 4 — Reportes, Estadísticas y Pulido (Semana 9-10)
> **Objetivo:** Dashboard, reportes Excel, recibos y QoL

| Orden | Tipo | Tarea | Responsable | SP | User Story / Dependencias |
|---:|:---:|---|---|---:|---|
| 1 | [BE] | API de estadísticas (recibidos, despachados, pendientes) | Dev 2 | 5 | US-19 |
| 2 | [FE] | Dashboard de estadísticas con gráficos | Dev 1 | 8 | US-19. Depende API estadísticas |
| 3 | [BE] | Exportación a Excel (pandas + openpyxl) | Dev 2 | 5 | US-20 |
| 4 | [FE] | Botones/flujo de exportación a Excel | Dev 1 | 3 | US-20 |
| 5 | [BE] | Generación de recibos | Dev 2 | 3 | US-21 |
| 6 | [FE] | Vista/impresión de recibos | Dev 1 | 3 | US-21 |
| 7 | [FE] | Vista del cliente (consulta de estado de vehículos) | Dev 3 | 5 | (Nota: en tu tabla estaba US-20, pero corresponde más a “consulta” que a Excel) |
| 8 | [FE] | Responsive / PWA — optimización móvil | Dev 3 | 5 | General |
| 9 | [INT] | Testing end-to-end de todos los flujos | Dev 3 | 5 | - |
| 10 | [INT] | Corrección de bugs y ajustes de UX | Todos | 8 | - |

**Total SP Sprint 4: 50**

---

### 🏃 SPRINT 5 — QA, Deploy y Entrega (Semana 11-12)
> **Objetivo:** Sistema estable, desplegado y documentado

| Orden | Tipo | Tarea | Responsable | SP | Descripción / Dependencias |
|---:|:---:|---|---|---:|---|
| 1 | [INT] | Testing integral de todos los módulos | Todos | 8 | Pruebas funcionales + regresión |
| 2 | [INT] | Corrección de bugs críticos | Todos | 8 | Bloqueante antes de deploy final |
| 3 | [INFRA] | Despliegue frontend (Vercel/Netlify) | Dev 1 | 3 | Variables de entorno, builds |
| 4 | [INFRA] | Despliegue backend (Railway/Forge/servidor) | Dev 2 | 5 | Migraciones, secretos, CORS |
| 5 | [INFRA] | Configuración de dominio y SSL | Dev 2 | 2 | DNS + certs |
| 6 | [DB] | Seed de datos iniciales (modelos vehículos, roles) | Dev 3 | 3 | Datos base para producción/demo |
| 7 | [DOC] | Documentación de uso del sistema | Dev 3 | 5 | Manual por rol + FAQs |
| 8 | [INT] | Capacitación / demo al cliente | Todos | 3 | Checklist de entrega |

**Total SP Sprint 5: 37**

---

### Nota rápida (recomendación)
En **Sprint 4** tu tabla decía: “Vista del cliente (consulta de estado de vehículos) | US-20”. Esa user story (US-20) es exportar a Excel. Si quieres, puedo:
- crear una US nueva tipo **US-24: Cliente consulta estado de vehículos**, o
- reasignar esa tarea a **US-02/General**.

---

Si me confirmas si quieres el orden **global** (como arriba) o **por responsable**, también puedo devolverte una segunda versión con el formato exacto de tu archivo (sin tablas extra, o con tablas iguales a las tuyas) para que quede 100% consistente.

## 9. RESUMEN DE CARGA POR DESARROLLADOR

| Sprint | Dev 1 (Frontend) | Dev 2 (Backend) | Dev 3 (Fullstack) |
|---|---|---|---|
| Sprint 0 | Mockups UI principal + config Vue/Nuxt | Config Django + Supabase + modelo datos | Mockups complementarios + Config DB |
| Sprint 1 | Login, Admin, Componente QR | Auth API, CRUD usuarios, API buques/vehículos | Pantallas recepción, integración auth |
| Sprint 2 | Impronta (foto+QR), vista imprimible | API impronta, storage, API inventario | Checklist inventario, ficha vehículo |
| Sprint 3 | Despacho (inicio, escaneo, planilla) | API despacho, lógica validación, portería | Panel portería, listados, integración |
| Sprint 4 | Dashboard estadísticas, Excel, recibos | APIs estadísticas, Excel export, recibos | Vista cliente, PWA, testing e2e |
| Sprint 5 | Deploy frontend, QA | Deploy backend, dominio | Docs, seeds, QA |

---

## 10. DEFINICIÓN DE DONE (DoD)

- [ ] Código revisado por al menos 1 compañero (Code Review)
- [ ] Sin errores en consola ni warnings críticos
- [ ] Responsive en móvil (mínimo 375px)
- [ ] Endpoint documentado en Postman/Swagger
- [ ] Funciona con escaneo QR (cámara y pistola)
- [ ] Datos se persisten correctamente en Supabase

---

## 11. HERRAMIENTAS DE TRABAJO SUGERIDAS

| Herramienta | Uso |
|---|---|
| **GitHub** | Repositorio + Pull Requests + Code Review |
| **Jira / Trello / Linear** | Board Scrum (Backlog, To Do, In Progress, Done) |
| **Figma** | Diseño de mockups y wireframes |
| **Postman** | Testing de API |
| **Discord / Slack** | Comunicación del equipo |
| **Supabase Dashboard** | Monitoreo de BD y Storage |

---

## 12. RIESGOS IDENTIFICADOS

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Compatibilidad de pistola de escaneo con navegador | Alto | Probar con dispositivos reales en Sprint 1 |
| Rendimiento de cámara QR en celulares de gama baja | Medio | Tener fallback de digitación manual |
| Complejidad del flujo de despacho condicionado | Alto | Definir bien reglas de negocio en Sprint 0 |
| Costo de Supabase si escala mucho | Medio | Monitorear uso y optimizar queries |
| Conexión a internet inestable en bodega | Alto | Considerar modo offline/PWA con sync |

---

> **Próximo paso:** Aprobar esta planificación, asignar los 3 desarrolladores y comenzar el Sprint 0 con la creación de mockups y configuración de infraestructura.
