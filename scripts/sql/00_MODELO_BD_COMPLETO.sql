-- =====================================================
-- SCRIPT MAESTRO: 00_MODELO_BD_COMPLETO.sql
-- Crea el modelo completo de base de datos (estructura)
-- =====================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- AUTH / DJANGO BASE
-- ============================================

CREATE TABLE IF NOT EXISTS auth_permission (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content_type_id INTEGER NOT NULL,
    codename VARCHAR(100) NOT NULL,
    UNIQUE (content_type_id, codename)
);

CREATE TABLE IF NOT EXISTS auth_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS auth_group_permissions (
    id BIGSERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES auth_group(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES auth_permission(id) ON DELETE CASCADE,
    UNIQUE (group_id, permission_id)
);

-- ============================================
-- DOMINIO PRINCIPAL
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSONB NOT NULL DEFAULT '{}'::jsonb,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    correo VARCHAR(254) NOT NULL UNIQUE,
    nombres VARCHAR(255) NOT NULL DEFAULT '',
    apellidos VARCHAR(255) NOT NULL DEFAULT '',
    rol VARCHAR(50) NOT NULL DEFAULT 'cliente',
    rol_id BIGINT REFERENCES roles(id) ON DELETE SET NULL,
    es_superusuario BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_personal BOOLEAN NOT NULL DEFAULT FALSE,
    ultimo_ingreso TIMESTAMPTZ,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_auth UUID
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGSERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    modulo VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (modulo IN ('admin', 'porteria', 'recibidor', 'inventario', 'despachador', 'general')),
    recipient_user_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_by_user_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_by_role VARCHAR(50) NOT NULL DEFAULT 'sistema',
    action_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    leida_en TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buques (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    identificacion VARCHAR(100) NOT NULL UNIQUE,
    fecha_arribo DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modelos_vehiculo (
    id BIGSERIAL PRIMARY KEY,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    anio SMALLINT,
    tipo VARCHAR(50),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (marca, modelo, anio)
);

CREATE TABLE IF NOT EXISTS vehiculos (
    id BIGSERIAL PRIMARY KEY,
    bin VARCHAR(100) NOT NULL UNIQUE,
    qr_codigo VARCHAR(100) NOT NULL UNIQUE,
    placa VARCHAR(20),
    buque_id BIGINT REFERENCES buques(id) ON DELETE SET NULL,
    modelo_id BIGINT REFERENCES modelos_vehiculo(id) ON DELETE SET NULL,
    color VARCHAR(50),
    estado VARCHAR(50),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_recibe_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS improntas (
    id BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    foto_url TEXT,
    datos_impronta JSONB NOT NULL DEFAULT '{}'::jsonb,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventarios (
    id BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    checklist_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    completo BOOLEAN NOT NULL DEFAULT FALSE,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS despachos (
    id BIGSERIAL PRIMARY KEY,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    cantidad_vehiculos INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS despacho_vehiculos (
    id BIGSERIAL PRIMARY KEY,
    despacho_id BIGINT NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
    vehiculo_id BIGINT NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    orden_escaneo INTEGER NOT NULL,
    fecha_escaneo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (despacho_id, vehiculo_id)
);

CREATE TABLE IF NOT EXISTS movimientos_porteria (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    vehiculo_id BIGINT REFERENCES vehiculos(id) ON DELETE SET NULL,
    persona VARCHAR(255),
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recibos (
    id BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    despacho_id BIGINT REFERENCES despachos(id) ON DELETE SET NULL,
    datos_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria_vehiculos (
    id BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT NOT NULL,
    cambiado_por_usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    cambiado_por_rol VARCHAR(50) NOT NULL,
    tipo_accion VARCHAR(50) NOT NULL,
    estado_anterior JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado_nuevo JSONB NOT NULL DEFAULT '{}'::jsonb,
    razon TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bloqueos_vehiculos (
    id BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT NOT NULL,
    bloqueado_por_usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    bloqueado_por_rol VARCHAR(50) NOT NULL,
    razon VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    bloqueado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    desbloqueado_en TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS excepciones_vehiculos (
    id BIGSERIAL PRIMARY KEY,
    vehiculo_id BIGINT NOT NULL,
    tipo_excepcion VARCHAR(100) NOT NULL,
    severidad VARCHAR(20) NOT NULL DEFAULT 'media',
    descripcion TEXT NOT NULL,
    assigned_to_user_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierta',
    creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resuelta_en TIMESTAMPTZ,
    resolved_by_user_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    notas_resolucion TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Tablas de contenedores y pipeline usadas por frontend/policies
CREATE TABLE IF NOT EXISTS contenedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  fecha_llegada DATE,
  hora_llegada TIME,
  agente_naviero VARCHAR(200),
  motonave VARCHAR(200),
  viaje VARCHAR(100),
  operador_portuario VARCHAR(200),
  tipo_operacion VARCHAR(20),
  origen VARCHAR(100),
  transportista VARCHAR(200),
  placa_camion VARCHAR(20),
  vehiculos_esperados INTEGER DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'pendiente',
  recibido_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS improntas_registro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(50),
  vehiculo_id BIGINT REFERENCES vehiculos(id) ON DELETE SET NULL,
  usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  estado VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehiculos_contenedor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contenedor_id UUID NOT NULL REFERENCES contenedores(id) ON DELETE CASCADE,
  cliente VARCHAR(200) NOT NULL,
  modelo VARCHAR(80) NOT NULL,
  bl VARCHAR(100) NOT NULL,
  origen VARCHAR(100) NOT NULL,
  vin VARCHAR(50) NOT NULL,
  destino VARCHAR(100) NOT NULL,
  ag_aduanas VARCHAR(200),
  peso VARCHAR(20),
  volumen VARCHAR(20),
  escaneado BOOLEAN DEFAULT FALSE,
  impronta_id UUID REFERENCES improntas_registro(id),
  codigo_impronta VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehiculos_pipeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id BIGINT REFERENCES vehiculos(id) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL,
  etapa VARCHAR(50),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES IMPORTANTES
-- ============================================

CREATE INDEX IF NOT EXISTS usuarios_correo_idx ON usuarios(correo);
CREATE INDEX IF NOT EXISTS usuarios_rol_idx ON usuarios(rol);
CREATE INDEX IF NOT EXISTS usuarios_id_auth_idx ON usuarios(id_auth);
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_id_auth_not_null ON usuarios(id_auth) WHERE id_auth IS NOT NULL;

CREATE INDEX IF NOT EXISTS notificaciones_recipient_user_id_idx ON notificaciones(recipient_user_id);
CREATE INDEX IF NOT EXISTS notificaciones_created_by_user_id_idx ON notificaciones(created_by_user_id);
CREATE INDEX IF NOT EXISTS notificaciones_modulo_idx ON notificaciones(modulo);

CREATE INDEX IF NOT EXISTS vehiculos_bin_idx ON vehiculos(bin);
CREATE INDEX IF NOT EXISTS vehiculos_qr_codigo_idx ON vehiculos(qr_codigo);
CREATE INDEX IF NOT EXISTS inventarios_vehiculo_id_idx ON inventarios(vehiculo_id);
CREATE INDEX IF NOT EXISTS improntas_vehiculo_id_idx ON improntas(vehiculo_id);
CREATE INDEX IF NOT EXISTS despachos_usuario_id_idx ON despachos(usuario_id);
CREATE INDEX IF NOT EXISTS movimientos_porteria_usuario_id_idx ON movimientos_porteria(usuario_id);
CREATE INDEX IF NOT EXISTS recibos_vehiculo_id_idx ON recibos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_contenedor_contenedor ON vehiculos_contenedor(contenedor_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_contenedor_vin ON vehiculos_contenedor(vin);
CREATE INDEX IF NOT EXISTS idx_vehiculos_contenedor_bl ON vehiculos_contenedor(bl);
CREATE INDEX IF NOT EXISTS idx_vehiculos_pipeline_vehiculo_id ON vehiculos_pipeline(vehiculo_id);

-- ============================================
-- FUNCIONES/TRIGGERS BASE
-- ============================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_vehiculos_contenedor ON vehiculos_contenedor;
CREATE TRIGGER set_timestamp_vehiculos_contenedor
  BEFORE UPDATE ON vehiculos_contenedor
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE FUNCTION public.handle_new_user_fill_id_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.usuarios
  SET id_auth = NEW.id
  WHERE lower(trim(correo)) = lower(trim(NEW.email))
    AND (id_auth IS NULL OR id_auth <> NEW.id);

  IF NOT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE lower(trim(correo)) = lower(trim(NEW.email))
  ) THEN
    INSERT INTO public.usuarios (correo, rol, nombres, apellidos, activo, id_auth)
    VALUES (
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'rol', 'recibidor'),
      COALESCE(NEW.raw_user_meta_data->>'nombres', 'Usuario'),
      COALESCE(NEW.raw_user_meta_data->>'apellidos', 'Nuevo'),
      true,
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_fill_id_auth ON auth.users;
CREATE TRIGGER on_auth_user_created_fill_id_auth
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_fill_id_auth();

-- ============================================
-- DATA INICIAL MÍNIMA
-- ============================================

INSERT INTO roles (nombre, descripcion, permisos, activo)
VALUES
    ('admin', 'Administrador del sistema', '{}'::jsonb, TRUE),
    ('porteria', 'Control de portería', '{}'::jsonb, TRUE),
    ('recibidor', 'Recepción de vehículos', '{}'::jsonb, TRUE),
    ('inventario', 'Inspección de inventario', '{}'::jsonb, TRUE),
    ('despachador', 'Despacho de vehículos', '{}'::jsonb, TRUE),
    ('cliente', 'Cliente', '{}'::jsonb, TRUE)
ON CONFLICT (nombre) DO NOTHING;

COMMIT;

-- FIN
