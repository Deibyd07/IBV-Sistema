-- =====================================================
-- SCRIPT MAESTRO: 00_POLITICAS_RLS_CREAR_TODAS.sql
-- Crea TODAS las políticas RLS en una sola ejecución
-- =====================================================

BEGIN;

-- Funciones base para políticas
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT rol INTO user_role
    FROM usuarios
    WHERE correo = auth.email()
    LIMIT 1;

    RETURN COALESCE(user_role, 'cliente');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
    RETURN lower(coalesce(get_current_user_role(), '')) IN ('admin', 'administrador', 'superadmin', 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_admin_safe()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
    RETURN is_admin();
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Habilitar RLS en tablas objetivo
ALTER TABLE IF EXISTS buques ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contenedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS excepciones_vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS improntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS improntas_registro ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS modelos_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS movimientos_porteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehiculos_contenedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehiculos_pipeline ENABLE ROW LEVEL SECURITY;

-- Borrar políticas existentes solo de tablas objetivo
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'buques','contenedores','despachos','excepciones_vehiculos','improntas','improntas_registro',
        'inventarios','modelos_vehiculo','movimientos_porteria','notificaciones','recibos','roles',
        'usuarios','vehiculos','vehiculos_contenedor','vehiculos_pipeline'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- ===== BUQUES =====
CREATE POLICY "Todos pueden crear buques" ON buques FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Todos pueden ver buques" ON buques FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "buques_delete_admin_only" ON buques FOR DELETE TO public USING (is_admin());
CREATE POLICY "buques_insert_admin_only" ON buques FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "buques_select_all" ON buques FOR SELECT TO public USING (true);
CREATE POLICY "buques_update_admin_only" ON buques FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());

-- ===== CONTENEDORES =====
CREATE POLICY "contenedores_delete_admin" ON contenedores FOR DELETE TO public USING (is_admin());
CREATE POLICY "contenedores_insert_admin_or_recibidor" ON contenedores FOR INSERT TO public WITH CHECK ((is_admin() OR get_current_user_role() = ANY (ARRAY['recibidor'::text, 'inventario'::text])));
CREATE POLICY "contenedores_select_all" ON contenedores FOR SELECT TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['recibidor'::text, 'inventario'::text, 'despachador'::text])));
CREATE POLICY "contenedores_update_admin_or_roles" ON contenedores FOR UPDATE TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['recibidor'::text, 'inventario'::text, 'despachador'::text]))) WITH CHECK ((is_admin() OR get_current_user_role() = ANY (ARRAY['recibidor'::text, 'inventario'::text, 'despachador'::text])));

-- ===== DESPACHOS =====
CREATE POLICY "Todos pueden actualizar despachos" ON despachos FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Todos pueden crear despachos" ON despachos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Todos pueden ver despachos" ON despachos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "despachos_delete_admin" ON despachos FOR DELETE TO public USING (is_admin());
CREATE POLICY "despachos_insert_despachador" ON despachos FOR INSERT TO public WITH CHECK ((get_current_user_role() = 'despachador'::text) AND (usuario_id = (SELECT usuarios.id FROM usuarios WHERE usuarios.correo::text = auth.email())));
CREATE POLICY "despachos_select_allowed_roles" ON despachos FOR SELECT TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['despachador'::text, 'porteria'::text])));
CREATE POLICY "despachos_update_allowed" ON despachos FOR UPDATE TO public USING ((is_admin() OR ((get_current_user_role() = 'despachador'::text) AND (usuario_id = (SELECT usuarios.id FROM usuarios WHERE usuarios.correo::text = auth.email()))))) WITH CHECK ((is_admin() OR get_current_user_role() = 'despachador'::text));

-- ===== EXCEPCIONES =====
CREATE POLICY "excepciones_delete_admin_only" ON excepciones_vehiculos FOR DELETE TO public USING (get_current_user_role() = 'admin'::text);
CREATE POLICY "excepciones_insert_authenticated" ON excepciones_vehiculos FOR INSERT TO public WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "excepciones_select_authenticated" ON excepciones_vehiculos FOR SELECT TO public USING (auth.uid() IS NOT NULL);
CREATE POLICY "excepciones_update_authenticated" ON excepciones_vehiculos FOR UPDATE TO public USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ===== IMPRONTAS =====
CREATE POLICY "Todos pueden actualizar improntas" ON improntas FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Todos pueden crear improntas" ON improntas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Todos pueden ver improntas" ON improntas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "improntas_delete_admin" ON improntas FOR DELETE TO public USING (is_admin());
CREATE POLICY "improntas_insert_recibidor" ON improntas FOR INSERT TO public WITH CHECK ((get_current_user_role() = 'recibidor'::text) AND (usuario_id = (SELECT usuarios.id FROM usuarios WHERE usuarios.correo::text = auth.email())));
CREATE POLICY "improntas_select_allowed_roles" ON improntas FOR SELECT TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['recibidor'::text, 'inventario'::text])));
CREATE POLICY "improntas_update_admin" ON improntas FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());

-- ===== IMPRONTAS_REGISTRO =====
CREATE POLICY "improntas_registro_delete_admin" ON improntas_registro FOR DELETE TO public USING (is_admin());
CREATE POLICY "improntas_registro_insert_recibidor" ON improntas_registro FOR INSERT TO public WITH CHECK ((is_admin() OR get_current_user_role() = 'recibidor'::text));
CREATE POLICY "improntas_registro_select_allowed" ON improntas_registro FOR SELECT TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['recibidor'::text, 'inventario'::text])));
CREATE POLICY "improntas_registro_update_admin" ON improntas_registro FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());

-- ===== INVENTARIOS =====
CREATE POLICY "Todos pueden actualizar inventarios" ON inventarios FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Todos pueden crear inventarios" ON inventarios FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Todos pueden ver inventarios" ON inventarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "inventarios_delete_admin" ON inventarios FOR DELETE TO public USING (is_admin());
CREATE POLICY "inventarios_insert_inventario" ON inventarios FOR INSERT TO public WITH CHECK ((get_current_user_role() = 'inventario'::text) AND (usuario_id = (SELECT usuarios.id FROM usuarios WHERE usuarios.correo::text = auth.email())));
CREATE POLICY "inventarios_select_allowed_roles" ON inventarios FOR SELECT TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['inventario'::text, 'despachador'::text])));
CREATE POLICY "inventarios_update_inventario" ON inventarios FOR UPDATE TO public USING ((is_admin() OR ((get_current_user_role() = 'inventario'::text) AND (usuario_id = (SELECT usuarios.id FROM usuarios WHERE usuarios.correo::text = auth.email()))))) WITH CHECK ((is_admin() OR get_current_user_role() = 'inventario'::text));

-- ===== MODELOS =====
CREATE POLICY "Todos pueden crear modelos" ON modelos_vehiculo FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Todos pueden ver modelos" ON modelos_vehiculo FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "modelos_delete_admin_only" ON modelos_vehiculo FOR DELETE TO public USING (is_admin());
CREATE POLICY "modelos_insert_admin_only" ON modelos_vehiculo FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "modelos_select_all" ON modelos_vehiculo FOR SELECT TO public USING (true);
CREATE POLICY "modelos_update_admin_only" ON modelos_vehiculo FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());

-- ===== MOVIMIENTOS =====
CREATE POLICY "movimientos_delete_admin" ON movimientos_porteria FOR DELETE TO public USING (is_admin());
CREATE POLICY "movimientos_insert_porteria" ON movimientos_porteria FOR INSERT TO public WITH CHECK ((get_current_user_role() = 'porteria'::text) AND (usuario_id = (SELECT usuarios.id FROM usuarios WHERE usuarios.correo::text = auth.email())));
CREATE POLICY "movimientos_select_allowed" ON movimientos_porteria FOR SELECT TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['porteria'::text, 'despachador'::text])));
CREATE POLICY "movimientos_update_allowed" ON movimientos_porteria FOR UPDATE TO public USING ((is_admin() OR ((get_current_user_role() = 'porteria'::text) AND (usuario_id = (SELECT usuarios.id FROM usuarios WHERE usuarios.correo::text = auth.email()))))) WITH CHECK ((is_admin() OR get_current_user_role() = 'porteria'::text));

-- ===== NOTIFICACIONES =====
CREATE POLICY "notificaciones_delete_admin_only" ON notificaciones FOR DELETE TO public USING (is_admin());
CREATE POLICY "notificaciones_insert_admin_by_user_role" ON notificaciones FOR INSERT TO public WITH CHECK ((created_by_user_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM usuarios u WHERE (u.id = notificaciones.created_by_user_id) AND (lower(trim(u.rol)) = ANY (ARRAY['admin'::text, 'administrador'::text, 'superadmin'::text, 'super_admin'::text])))));
CREATE POLICY "notificaciones_insert_admin_from_payload" ON notificaciones FOR INSERT TO public WITH CHECK ((lower(trim(coalesce(created_by_role, ''::varchar))) = ANY (ARRAY['admin'::text, 'administrador'::text, 'superadmin'::text, 'super_admin'::text])) AND (created_by_user_id IS NOT NULL) AND EXISTS (SELECT 1 FROM usuarios u WHERE u.id = notificaciones.created_by_user_id));
CREATE POLICY "notificaciones_insert_admin_only" ON notificaciones FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "notificaciones_insert_admin_safe" ON notificaciones FOR INSERT TO public WITH CHECK (is_admin_safe());
CREATE POLICY "notificaciones_select_intelligent" ON notificaciones FOR SELECT TO public USING (((recipient_user_id IS NOT NULL) AND (recipient_user_id = (SELECT usuarios.id FROM usuarios WHERE lower(trim(usuarios.correo)) = lower(trim(auth.email())) LIMIT 1))) OR ((recipient_user_id IS NULL) AND (modulo::text <> 'general'::text) AND (lower(trim(get_current_user_role())) = lower(trim(modulo)))) OR ((recipient_user_id IS NULL) AND (modulo::text = 'general'::text)) OR (is_admin() AND recipient_user_id IS NULL));
CREATE POLICY "notificaciones_update_admin_or_mark_read" ON notificaciones FOR UPDATE TO public USING ((is_admin() OR recipient_user_id = (SELECT usuarios.id FROM usuarios WHERE lower(trim(usuarios.correo)) = lower(trim(auth.email())) LIMIT 1))) WITH CHECK ((is_admin() OR recipient_user_id = (SELECT usuarios.id FROM usuarios WHERE lower(trim(usuarios.correo)) = lower(trim(auth.email())) LIMIT 1)));

-- ===== RECIBOS =====
CREATE POLICY "recibos_delete_admin" ON recibos FOR DELETE TO public USING (is_admin());
CREATE POLICY "recibos_insert_admin" ON recibos FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "recibos_select_allowed" ON recibos FOR SELECT TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['recibidor'::text, 'despachador'::text])));
CREATE POLICY "recibos_update_admin" ON recibos FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());

-- ===== ROLES =====
CREATE POLICY "roles_delete_admin_only" ON roles FOR DELETE TO public USING (is_admin());
CREATE POLICY "roles_insert_admin_only" ON roles FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "roles_select_all" ON roles FOR SELECT TO public USING (true);
CREATE POLICY "roles_update_admin_only" ON roles FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());

-- ===== USUARIOS =====
CREATE POLICY "Todos pueden ver usuarios" ON usuarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden actualizar usuarios" ON usuarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios pueden insertar en usuarios" ON usuarios FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "usuarios_delete_admin_only" ON usuarios FOR DELETE TO public USING (is_admin());
CREATE POLICY "usuarios_insert_admin_only" ON usuarios FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "usuarios_select_own_or_admin" ON usuarios FOR SELECT TO public USING ((correo::text = auth.email()) OR is_admin());
CREATE POLICY "usuarios_update_own_or_admin" ON usuarios FOR UPDATE TO public USING ((correo::text = auth.email()) OR is_admin()) WITH CHECK ((correo::text = auth.email()) OR is_admin());

-- ===== VEHICULOS =====
CREATE POLICY "Todos pueden actualizar vehiculos" ON vehiculos FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Todos pueden crear vehiculos" ON vehiculos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Todos pueden ver vehiculos" ON vehiculos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "vehiculos_delete_admin" ON vehiculos FOR DELETE TO public USING (is_admin());
CREATE POLICY "vehiculos_insert_admin" ON vehiculos FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "vehiculos_insert_recibidor" ON vehiculos FOR INSERT TO public WITH CHECK ((get_current_user_role() = 'recibidor'::text) AND (usuario_recibe_id = (SELECT usuarios.id FROM usuarios WHERE usuarios.correo::text = auth.email())));
CREATE POLICY "vehiculos_select_admin" ON vehiculos FOR SELECT TO public USING (is_admin());
CREATE POLICY "vehiculos_select_recibidor" ON vehiculos FOR SELECT TO public USING ((get_current_user_role() = 'recibidor'::text) OR (get_current_user_role() = 'inventario'::text) OR (get_current_user_role() = 'despachador'::text));
CREATE POLICY "vehiculos_update_admin" ON vehiculos FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "vehiculos_update_despachador" ON vehiculos FOR UPDATE TO public USING ((get_current_user_role() = 'despachador'::text) AND (estado::text = ANY ((ARRAY['listo_despacho'::varchar, 'despachado'::varchar])::text[]))) WITH CHECK ((get_current_user_role() = 'despachador'::text) AND (estado::text = ANY ((ARRAY['listo_despacho'::varchar, 'despachado'::varchar])::text[])));
CREATE POLICY "vehiculos_update_inventario" ON vehiculos FOR UPDATE TO public USING ((get_current_user_role() = 'inventario'::text) AND (estado::text = ANY ((ARRAY['en_inventario'::varchar, 'en_impronta'::varchar])::text[]))) WITH CHECK ((get_current_user_role() = 'inventario'::text) AND (estado::text = ANY ((ARRAY['en_inventario'::varchar, 'en_impronta'::varchar, 'listo_despacho'::varchar, 'problema'::varchar])::text[])));

-- ===== VEHICULOS_CONTENEDOR =====
CREATE POLICY "Recibidores pueden actualizar vehiculos_contenedor" ON vehiculos_contenedor FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Recibidores pueden crear vehiculos_contenedor" ON vehiculos_contenedor FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Solo admins pueden eliminar vehiculos_contenedor" ON vehiculos_contenedor FOR DELETE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden ver vehiculos_contenedor" ON vehiculos_contenedor FOR SELECT TO authenticated USING (true);

-- ===== VEHICULOS_PIPELINE =====
CREATE POLICY "vehiculos_pipeline_delete_admin" ON vehiculos_pipeline FOR DELETE TO public USING (is_admin());
CREATE POLICY "vehiculos_pipeline_insert_admin_or_system" ON vehiculos_pipeline FOR INSERT TO public WITH CHECK (is_admin());
CREATE POLICY "vehiculos_pipeline_select_all_roles" ON vehiculos_pipeline FOR SELECT TO public USING ((is_admin() OR get_current_user_role() = ANY (ARRAY['recibidor'::text, 'inventario'::text, 'despachador'::text])));
CREATE POLICY "vehiculos_pipeline_update_admin_or_system" ON vehiculos_pipeline FOR UPDATE TO public USING (is_admin()) WITH CHECK (is_admin());

COMMIT;

-- Verificación rápida
SELECT tablename, COUNT(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
