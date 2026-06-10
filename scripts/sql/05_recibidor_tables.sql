-- ============================================
-- TABLAS DEL PANEL RECIBIDOR - SISTEMA IBV
-- ============================================
-- AUTOCONTENIDO: incluye extensiones y funciones
-- Pegar TODO en Supabase > SQL Editor > Run
-- ============================================

-- Extensión para uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. CONTENEDORES
-- ============================================

CREATE TABLE IF NOT EXISTS contenedores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    origen VARCHAR(200) NOT NULL,
    transportista VARCHAR(200) NOT NULL,
    placa_camion VARCHAR(20) NOT NULL,
    fecha_llegada DATE NOT NULL,
    hora_llegada TIME NOT NULL,
    vehiculos_esperados INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_recepcion', 'completado')),
    recibido_por VARCHAR(200),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contenedores_codigo_idx ON contenedores(codigo);
CREATE INDEX IF NOT EXISTS contenedores_estado_idx ON contenedores(estado);
CREATE INDEX IF NOT EXISTS contenedores_fecha_llegada_idx ON contenedores(fecha_llegada);

-- Trigger para updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_contenedores_updated_at'
    ) THEN
        CREATE TRIGGER update_contenedores_updated_at
            BEFORE UPDATE ON contenedores
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 2. VEHÍCULOS EN CONTENEDOR
-- ============================================

CREATE TABLE IF NOT EXISTS contenedor_vehiculos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contenedor_id UUID NOT NULL REFERENCES contenedores(id) ON DELETE CASCADE,
    vin VARCHAR(50) NOT NULL,
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio VARCHAR(10) NOT NULL,
    color VARCHAR(50) NOT NULL,
    codigo_impronta VARCHAR(50) NOT NULL,
    escaneado BOOLEAN NOT NULL DEFAULT FALSE,
    impronta_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cont_veh_contenedor_id_idx ON contenedor_vehiculos(contenedor_id);
CREATE INDEX IF NOT EXISTS cont_veh_vin_idx ON contenedor_vehiculos(vin);
CREATE INDEX IF NOT EXISTS cont_veh_codigo_impronta_idx ON contenedor_vehiculos(codigo_impronta);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_contenedor_vehiculos_updated_at'
    ) THEN
        CREATE TRIGGER update_contenedor_vehiculos_updated_at
            BEFORE UPDATE ON contenedor_vehiculos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 3. IMPRONTAS (REGISTRO COMPLETO)
-- ============================================

CREATE TABLE IF NOT EXISTS improntas_registro (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    folio VARCHAR(20) NOT NULL UNIQUE,
    vin VARCHAR(50) NOT NULL,
    placa VARCHAR(20),
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio VARCHAR(10) NOT NULL DEFAULT '',
    color VARCHAR(50) NOT NULL DEFAULT '',
    km VARCHAR(20) DEFAULT '',
    cliente VARCHAR(200) DEFAULT '',
    condicion VARCHAR(20) DEFAULT ''
        CHECK (condicion IN ('excelente', 'bueno', 'regular', 'dañado', '')),
    zonas_danadas TEXT[] DEFAULT '{}',
    danos JSONB NOT NULL DEFAULT '[]'::jsonb,
    observaciones TEXT DEFAULT '',
    fotos JSONB NOT NULL DEFAULT '{}'::jsonb,
    fotos_adicionales TEXT[] DEFAULT '{}',
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'completada', 'revisada')),
    creado_por VARCHAR(200) DEFAULT '',
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_creacion TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS improntas_reg_folio_idx ON improntas_registro(folio);
CREATE INDEX IF NOT EXISTS improntas_reg_vin_idx ON improntas_registro(vin);
CREATE INDEX IF NOT EXISTS improntas_reg_estado_idx ON improntas_registro(estado);
CREATE INDEX IF NOT EXISTS improntas_reg_fecha_idx ON improntas_registro(fecha_creacion);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_improntas_registro_updated_at'
    ) THEN
        CREATE TRIGGER update_improntas_registro_updated_at
            BEFORE UPDATE ON improntas_registro
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Secuencia para folios de impronta
CREATE SEQUENCE IF NOT EXISTS impronta_folio_seq START 1;

-- Función para generar folio automático
CREATE OR REPLACE FUNCTION generate_impronta_folio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.folio IS NULL OR NEW.folio = '' THEN
        NEW.folio := 'IMP-' || LPAD(nextval('impronta_folio_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_impronta_folio ON improntas_registro;
CREATE TRIGGER set_impronta_folio
    BEFORE INSERT ON improntas_registro
    FOR EACH ROW
    EXECUTE FUNCTION generate_impronta_folio();

-- ============================================
-- 4. VEHÍCULOS PIPELINE (CICLO DE VIDA)
-- ============================================

CREATE TABLE IF NOT EXISTS vehiculos_pipeline (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vin VARCHAR(50) NOT NULL UNIQUE,
    placa VARCHAR(20) DEFAULT '',
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    anio VARCHAR(10) NOT NULL DEFAULT '',
    color VARCHAR(50) NOT NULL DEFAULT '',
    cliente VARCHAR(200) DEFAULT '',
    contenedor_id UUID REFERENCES contenedores(id) ON DELETE SET NULL,
    contenedor_codigo VARCHAR(50),
    fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_recepcion TIME NOT NULL DEFAULT CURRENT_TIME,
    -- Impronta
    impronta_id UUID REFERENCES improntas_registro(id) ON DELETE SET NULL,
    impronta_folio VARCHAR(20),
    impronta_completada BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_impronta DATE,
    -- Inventario
    inventario_completado BOOLEAN NOT NULL DEFAULT FALSE,
    inventario_aprobado BOOLEAN NOT NULL DEFAULT FALSE,
    inventario_fecha DATE,
    inventario_inspector VARCHAR(200),
    inventario_resultado JSONB,
    -- Despacho
    despachado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_despacho DATE,
    hora_despacho TIME,
    lot_despacho VARCHAR(50),
    despachador VARCHAR(200),
    -- Estado
    estado VARCHAR(30) NOT NULL DEFAULT 'recibido'
        CHECK (estado IN (
            'recibido',
            'impronta_pendiente',
            'impronta_completada',
            'inventario_pendiente',
            'inventario_aprobado',
            'listo_despacho',
            'despachado'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS veh_pipe_vin_idx ON vehiculos_pipeline(vin);
CREATE INDEX IF NOT EXISTS veh_pipe_estado_idx ON vehiculos_pipeline(estado);
CREATE INDEX IF NOT EXISTS veh_pipe_contenedor_id_idx ON vehiculos_pipeline(contenedor_id);
CREATE INDEX IF NOT EXISTS veh_pipe_fecha_recepcion_idx ON vehiculos_pipeline(fecha_recepcion);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_vehiculos_pipeline_updated_at'
    ) THEN
        CREATE TRIGGER update_vehiculos_pipeline_updated_at
            BEFORE UPDATE ON vehiculos_pipeline
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 5. FK de contenedor_vehiculos a improntas_registro
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cont_veh_impronta_id_fkey'
    ) THEN
        ALTER TABLE contenedor_vehiculos
        ADD CONSTRAINT cont_veh_impronta_id_fkey
        FOREIGN KEY (impronta_id) REFERENCES improntas_registro(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 6. DESHABILITAR RLS EN NUEVAS TABLAS
-- ============================================

ALTER TABLE contenedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE contenedor_vehiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE improntas_registro DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos_pipeline DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. PERMISOS PÚBLICOS (para acceso con anon key)
-- ============================================

GRANT ALL ON contenedores TO anon, authenticated;
GRANT ALL ON contenedor_vehiculos TO anon, authenticated;
GRANT ALL ON improntas_registro TO anon, authenticated;
GRANT ALL ON vehiculos_pipeline TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE impronta_folio_seq TO anon, authenticated;

-- Notificar a PostgREST para recargar schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Tablas creadas exitosamente:';
    RAISE NOTICE '  - contenedores';
    RAISE NOTICE '  - contenedor_vehiculos';
    RAISE NOTICE '  - improntas_registro';
    RAISE NOTICE '  - vehiculos_pipeline';
    RAISE NOTICE 'Script completado sin errores.';
END $$;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
