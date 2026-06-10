# Documentación de Base de Datos - Sistema IBV

## 📚 Índice de Documentación

Esta carpeta contiene toda la documentación relacionada con la configuración de base de datos PostgreSQL usando Supabase para el Sistema IBV.

---

## 📄 Documentos Disponibles

### 1. [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md) ⚡
**Inicio Rápido - 30 minutos**

**Para quién**: Desarrolladores que quieren configurar Supabase rápidamente.

**Contenido**:
- ✅ Checklist paso a paso
- ⏱️ Tiempos estimados por tarea
- 🎯 Fases de implementación
- 🔧 Troubleshooting rápido

**Cuándo usar**: Primera vez configurando Supabase o necesitas una guía práctica.

---

### 2. [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) 📖
**Guía Técnica Completa**

**Para quién**: Desarrolladores y DevOps que necesitan entender en profundidad.

**Contenido**:
- 🏗️ Arquitectura de la base de datos
- 🔐 Configuración de seguridad
- 📊 Migración de datos
- 🧪 Testing y validación
- 💰 Costos y escalabilidad
- 📝 Mejores prácticas

**Cuándo usar**: Necesitas entender el "por qué" detrás de cada configuración.

---

### 3. [SUPABASE_RLS_POLICIES.md](./SUPABASE_RLS_POLICIES.md) 🔒
**Políticas Row Level Security**

**Para quién**: Desarrolladores configurando seguridad a nivel de base de datos.

**Contenido**:
- 🛡️ Introducción a RLS
- ⚖️ Estrategia para Sistema IBV (Recomendación: SIN RLS)
- 📜 Scripts SQL completos
- 🧪 Testing de políticas
- 🔧 Troubleshooting de permisos

**Cuándo usar**: Necesitas configurar políticas de seguridad o tienes problemas de permisos.

---

## 🚀 ¿Por dónde empezar?

### Si es tu primera vez:
```
1. Lee: SUPABASE_QUICK_START.md
2. Sigue el checklist paso a paso
3. Ejecuta: scripts\setup-supabase.ps1
4. Consulta SUPABASE_SETUP_GUIDE.md si tienes dudas
```

### Si tienes problemas:
```
1. Busca en la sección Troubleshooting de SUPABASE_QUICK_START.md
2. Si es sobre permisos: SUPABASE_RLS_POLICIES.md
3. Si es sobre configuración: SUPABASE_SETUP_GUIDE.md
```

### Si necesitas entender la arquitectura:
```
1. Lee la sección "Arquitectura de la Base de Datos" en SUPABASE_SETUP_GUIDE.md
2. Revisa diagramas y decisiones de diseño
```

---

## 🛠️ Scripts Disponibles

### [`scripts/setup-supabase.ps1`](../scripts/setup-supabase.ps1)
Script de PowerShell para verificar configuración y guiar en los siguientes pasos.

**Uso:**
```powershell
cd C:\Users\Deibyd\Sistema-IBV
.\scripts\setup-supabase.ps1
```

**Qué hace:**
- ✅ Verifica Python instalado
- ✅ Verifica dependencias
- ✅ Verifica archivo .env
- ✅ Verifica conectividad a BD
- ✅ Muestra siguientes pasos

---

## 📋 Checklist de Implementación

### Configuración Inicial

- [ ] Crear cuenta en Supabase
- [ ] Crear proyecto `sistema-ibv-prod`
- [ ] Obtener credenciales (DATABASE_URL, SUPABASE_URL, keys)
- [ ] Configurar archivo `.env`
- [ ] Instalar dependencias: `pip install -r requirements.txt`
- [ ] Ejecutar migraciones: `python manage.py migrate`
- [ ] Crear superusuario: `python manage.py createsuperuser`
- [ ] Verificar conexión

### Configuración de Seguridad

- [ ] Configurar políticas RLS (o deshabilitarlas)
- [ ] Verificar permisos de usuario `postgres`
- [ ] Configurar SSL en producción
- [ ] Rotar SECRET_KEY de Django

### Producción

- [ ] Configurar backups automáticos en Supabase
- [ ] Configurar monitoreo
- [ ] Documentar credenciales en gestor seguro
- [ ] Configurar variables de entorno en servidor
- [ ] Probar migración en ambiente staging

---

## 🔑 Variables de Entorno Requeridas

Todas las variables deben estar en el archivo `.env` en la raíz del proyecto:

```env
# Django
SECRET_KEY=django-insecure-CAMBIAR-EN-PRODUCCION
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,tu-dominio.com

# Database
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Timezone
TZ=America/Bogota
```

Ver [`.env.example`](../.env.example) para plantilla completa con comentarios.

---

## 🆘 Soporte

### Recursos Oficiales

- [Supabase Documentation](https://supabase.com/docs)
- [Django Database Settings](https://docs.djangoproject.com/en/5.0/ref/settings/#databases)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Documentación del Proyecto

- Backend: [`backend/README.md`](../backend/README.md)
- Modelos: [`backend/MODELS_DOCUMENTATION.md`](../backend/MODELS_DOCUMENTATION.md)

### Problemas Comunes

#### ❌ Error: "password authentication failed"
```
Solución: Verificar DATABASE_URL en .env
Ver: SUPABASE_QUICK_START.md > Troubleshooting
```

#### ❌ Error: "SSL connection required"
```
Solución: Verificar settings.py tenga sslmode='require'
Ver: SUPABASE_SETUP_GUIDE.md > Configuración de Django
```

#### ❌ Error: "permission denied for table"
```
Solución: Verificar políticas RLS
Ver: SUPABASE_RLS_POLICIES.md
```

#### ❌ Error: "too many connections"
```
Solución: Usar Connection Pooling (puerto 6543)
Ver: SUPABASE_SETUP_GUIDE.md > Connection Pooling
```

---

## 📊 Comparación: SQLite vs PostgreSQL (Supabase)

| Característica | SQLite (Actual) | PostgreSQL (Supabase) |
|----------------|-----------------|------------------------|
| **Tipo** | Archivo local | Cliente-servidor |
| **Concurrencia** | Limitada | Alta |
| **Backups** | Manual | Automático |
| **Escalabilidad** | No escalable | Altamente escalable |
| **Producción** | ❌ No recomendado | ✅ Recomendado |
| **Costo** | Gratis | Free tier / $25/mes Pro |
| **Mantenimiento** | Manual | Gestionado |
| **SSL/TLS** | No | Sí |
| **Monitoreo** | No | Dashboard completo |

---

## 🎯 Decisiones de Arquitectura

### ✅ ¿Por qué Supabase?

1. **PostgreSQL Gestionado**: No necesitas administrar servidores
2. **Backups Automáticos**: Protección de datos incluida
3. **Escalabilidad**: Crece con el proyecto sin cambios de código
4. **Dashboard Intuitivo**: Fácil gestión de datos
5. **Compatibilidad Django**: Funciona perfecto con Django ORM

### ✅ ¿Por qué NO usar RLS?

1. Django ya maneja autenticación y autorización
2. Todas las queries pasan por Django (no hay acceso directo)
3. Menor complejidad = menos bugs
4. Mejor rendimiento (menos overhead)

Ver justificación completa en: [SUPABASE_RLS_POLICIES.md](./SUPABASE_RLS_POLICIES.md)

---

## 🔄 Proceso de Migración

### Flujo Recomendado

```
SQLite (Desarrollo Local)
    ↓
    1. Crear proyecto Supabase
    ↓
    2. Configurar .env con credenciales
    ↓
    3. Ejecutar migraciones
    ↓
    4. [Opcional] Migrar datos con dumpdata/loaddata
    ↓
PostgreSQL/Supabase (Producción)
```

### Comandos de Migración

```powershell
# Exportar datos de SQLite
python manage.py dumpdata --natural-foreign --natural-primary > backup.json

# Cambiar a PostgreSQL (editar .env)

# Ejecutar migraciones
python manage.py migrate

# Importar datos
python manage.py loaddata backup.json
```

---

## 📅 Mantenimiento

### Tareas Periódicas

#### Diarias
- [ ] Revisar logs de errores en Supabase Dashboard
- [ ] Monitorear uso de conexiones

#### Semanales
- [ ] Revisar performance de queries lentas
- [ ] Verificar espacio en disco usado

#### Mensuales
- [ ] Revisar backups automáticos
- [ ] Analizar costos y uso
- [ ] Optimizar queries problemáticas

#### Trimestrales (cada 90 días)
- [ ] Rotar credenciales (DATABASE_URL, keys)
- [ ] Revisar y actualizar políticas de seguridad
- [ ] Evaluar necesidad de upgrade de plan

---

## 📈 Monitoreo

### Dashboards de Supabase

1. **Database > Reports**: Métricas de rendimiento
2. **Database > Logs**: Query logs y errores
3. **Usage**: Consumo de recursos

### Métricas Importantes

- **Queries/segundo**: Carga de la BD
- **Query time**: Rendimiento (objetivo: <200ms)
- **Conexiones activas**: Uso de pool
- **Disk usage**: Espacio utilizado

---

## 🎓 Aprendizaje

### Para profundizar:

1. **PostgreSQL**
   - [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
   - [Django + PostgreSQL](https://docs.djangoproject.com/en/5.0/ref/databases/#postgresql-notes)

2. **Supabase**
   - [Supabase Guides](https://supabase.com/docs/guides)
   - [Database Management](https://supabase.com/docs/guides/database)

3. **Row Level Security**
   - [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
   - [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2026-02-24 | Creación inicial de documentación de Supabase |

---

## 👥 Contribuir

Para mejorar esta documentación:

1. Identifica secciones poco claras o faltantes
2. Crea un issue describiendo la mejora
3. Envía un PR con actualizaciones

---

## ✅ Verificación Final

Antes de considerar la configuración completa:

- [ ] Todos los documentos leídos y entendidos
- [ ] Proyecto creado en Supabase
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas exitosamente
- [ ] Superusuario creado
- [ ] API funcionando correctamente
- [ ] Tests pasando
- [ ] Backups configurados
- [ ] Documentación de credenciales en lugar seguro

---

**¡Configuración de Supabase completada con éxito! 🎉**

Para comenzar, lee: [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md)
