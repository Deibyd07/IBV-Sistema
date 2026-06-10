# Migración de Contenedores a Estructura Shipping Manifest

## 📋 Resumen

Este script actualiza la estructura de la base de datos para soportar el manejo de contenedores según manifiestos de transporte marítimo internacional (Sociedad Portuaria Buenaventura).

## 🎯 Cambios Principales

### 1. Tabla `contenedores` - Nuevos Campos
Se agregan campos específicos del shipping manifest:
- `agente_naviero` - Compañía naviera (MSC, MAERSK, HAPAG-LLOYD, etc.)
- `motonave` - Nombre del buque
- `viaje` - Número de viaje
- `operador_portuario` - Operador del puerto
- `tipo_operacion` - TRANSITO o REESTIBA

### 2. Nueva Tabla `vehiculos_contenedor`
Almacena los vehículos esperados según el Excel del manifiesto:
- Datos del manifiesto: cliente, modelo, BL, origen, VIN, destino, ag_aduanas, peso, volumen
- Control de recepción: escaneado, impronta_id, codigo_impronta
- Relación 1:N con contenedores

### 3. Índices para Performance
- Búsqueda por contenedor_id
- Búsqueda por VIN
- Búsqueda por BL (Bill of Lading)
- Filtro de vehículos no escaneados

### 4. Vista `contenedores_completos`
Vista consolidada que une contenedores con sus vehículos en formato JSON, incluyendo contadores de vehículos registrados y escaneados.

### 5. Función `crear_contenedor_con_vehiculos`
Función PostgreSQL que permite crear un contenedor con todos sus vehículos en una sola transacción desde el frontend.

## 📝 Cómo Ejecutar

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [https://supabase.com](https://supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega el contenido de `06_actualizar_contenedores_shipping.sql`
5. Click en **Run** (o presiona Ctrl+Enter)
6. Verifica que no haya errores en la consola

### Opción 2: Desde PowerShell (Con Supabase CLI)

```powershell
# Asegúrate de tener Supabase CLI instalado y autenticado
cd C:\Users\Deibyd\Sistema-IBV-1
supabase db push --file scripts/sql/06_actualizar_contenedores_shipping.sql
```

## ✅ Verificación Post-ejecución

Ejecuta este SQL para verificar que todo se creó correctamente:

```sql
-- 1. Verificar nuevos campos en contenedores
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contenedores' 
  AND column_name IN ('agente_naviero', 'motonave', 'viaje', 'operador_portuario', 'tipo_operacion');

-- 2. Verificar que existe la tabla vehiculos_contenedor
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'vehiculos_contenedor';

-- 3. Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('contenedores', 'vehiculos_contenedor');

-- 4. Verificar vista
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'contenedores_completos';

-- 5. Verificar función
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'crear_contenedor_con_vehiculos';
```

Deberías ver:
- ✅ 5 nuevos campos en `contenedores`
- ✅ Tabla `vehiculos_contenedor` creada
- ✅ 7 índices nuevos
- ✅ Vista `contenedores_completos` disponible
- ✅ Función `crear_contenedor_con_vehiculos` lista

## 🔄 Compatibilidad con Código Existente

Los campos antiguos (`origen`, `transportista`, `placa_camion`) **se mantienen** pero ya no son obligatorios y están marcados como DEPRECADOS. Esto permite:

- ✅ Código antiguo sigue funcionando
- ✅ Nuevo código usa nueva estructura
- ⚠️ Migración gradual sin romper nada

## 🚀 Uso desde el Frontend

### Crear contenedor con vehículos (desde TypeScript):

```typescript
const { data, error } = await supabase.rpc('crear_contenedor_con_vehiculos', {
  p_codigo: 'CONT-2026-0001',
  p_fecha_llegada: '2026-03-15',
  p_agente_naviero: 'MSC Mediterranean Shipping Company',
  p_motonave: 'MSC REEF',
  p_viaje: 'EP426A',
  p_operador_portuario: 'Sociedad Portuaria Buenaventura',
  p_tipo_operacion: 'TRANSITO',
  p_vehiculos: [
    {
      cliente: 'TOYOTA',
      modelo: 'COROLLA',
      bl: 'MEDUBB123456',
      origen: 'JAPON',
      vin: '1HGBH41JXMN109186',
      destino: 'VENEZUELA',
      agAduanas: 'AGENCIA MARITIMA VENEZOLANA',
      peso: '1200',
      volumen: '15'
    },
    // ... más vehículos
  ]
})
```

### Obtener contenedor completo con vehículos:

```typescript
const { data, error } = await supabase
  .from('contenedores_completos')
  .select('*')
  .eq('codigo', 'CONT-2026-0001')
  .single()

// data incluye el array de vehículos en formato JSON
console.log(data.vehiculos) // Array de vehículos
console.log(data.vehiculos_escaneados) // Contador
```

## 📊 Diagrama de Relaciones

```
contenedores (1) ----< (N) vehiculos_contenedor
     |
     | (opcional)
     v
vehiculos_contenedor (N) ----< (1) improntas_registro
```

## ⚠️ Importante

1. **Hacer backup** antes de ejecutar en producción
2. Este script es **idempotente** (se puede ejecutar múltiples veces sin problemas)
3. Los índices se crean con `IF NOT EXISTS` para evitar duplicados
4. Las políticas RLS ya están configuradas para usuarios autenticados

## 📞 Próximos Pasos

Después de ejecutar este script, actualiza el frontend:

1. Crear service para `vehiculos_contenedor`
2. Actualizar `contenedorStore` para usar Supabase en lugar de localStorage
3. Conectar el formulario de importación Excel con la función RPC

## 🐛 Rollback (si algo sale mal)

```sql
-- SOLO SI NECESITAS DESHACER LOS CAMBIOS
DROP VIEW IF EXISTS contenedores_completos CASCADE;
DROP FUNCTION IF EXISTS crear_contenedor_con_vehiculos CASCADE;
DROP TABLE IF EXISTS vehiculos_contenedor CASCADE;

ALTER TABLE contenedores 
  DROP COLUMN IF EXISTS agente_naviero,
  DROP COLUMN IF EXISTS motonave,
  DROP COLUMN IF EXISTS viaje,
  DROP COLUMN IF EXISTS operador_portuario,
  DROP COLUMN IF EXISTS tipo_operacion;
```
