/**
 * Servicio para gestionar roles desde Supabase
 * Tabla: roles (columnas: id, nombre, descripcion, activo)
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const getSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}

export interface SupabaseRole {
  id: number
  nombre: string
  descripcion: string
  activo: boolean
  created_at: string
}

export interface RoleWithUsers extends SupabaseRole {
  usersCount: number
}

interface PermissionModuleEntry {
  key: string
  label: string
}

interface PermissionState extends PermissionModuleEntry {
  allowed: boolean
}

const ROLE_CONFIG: Record<string, { icon: string; iconBg: string; headerBg: string }> = {
  admin: {
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>',
    iconBg: 'bg-amber-400/15 text-amber-300',
    headerBg: 'border-amber-400/20 bg-amber-400/[0.06]',
  },
  porteria: {
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>',
    iconBg: 'bg-rose-500/15 text-rose-300',
    headerBg: 'border-rose-500/20 bg-rose-500/[0.06]',
  },
  recibidor: {
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M12 4v16m8-8H4" /></svg>',
    iconBg: 'bg-sky-500/15 text-sky-300',
    headerBg: 'border-sky-500/20 bg-sky-500/[0.06]',
  },
  inventario: {
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>',
    iconBg: 'bg-emerald-500/15 text-emerald-300',
    headerBg: 'border-emerald-500/20 bg-emerald-500/[0.06]',
  },
  despachador: {
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>',
    iconBg: 'bg-orange-500/15 text-orange-300',
    headerBg: 'border-orange-500/20 bg-orange-500/[0.06]',
  },
  cliente: {
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>',
    iconBg: 'bg-white/[0.06] text-zinc-400',
    headerBg: 'border-white/[0.08] bg-white/[0.02]',
  },
}

const DEFAULT_PERMISSIONS: Record<string, PermissionState[]> = {
  admin: [
    { key: 'users.manage', label: 'Gestionar usuarios', allowed: true },
    { key: 'roles.manage', label: 'Gestionar roles', allowed: true },
    { key: 'vehicles.manage', label: 'Gestionar vehículos', allowed: true },
    { key: 'reports.view', label: 'Ver reportes', allowed: true },
    { key: 'settings.manage', label: 'Configuración', allowed: true },
  ],
  porteria: [
    { key: 'gate.scan', label: 'Escanear QR', allowed: true },
    { key: 'gate.log', label: 'Ver registro', allowed: true },
    { key: 'vehicles.view', label: 'Ver vehículos', allowed: true },
    { key: 'reports.view', label: 'Ver reportes', allowed: false },
    { key: 'settings.manage', label: 'Configuración', allowed: false },
  ],
  recibidor: [
    { key: 'vehicles.receive', label: 'Recibir vehículos', allowed: true },
    { key: 'vehicles.view', label: 'Ver vehículos', allowed: true },
    { key: 'imprint.create', label: 'Crear improntas', allowed: true },
    { key: 'reports.view', label: 'Ver reportes', allowed: false },
    { key: 'settings.manage', label: 'Configuración', allowed: false },
  ],
  inventario: [
    { key: 'inventory.inspect', label: 'Inspeccionar', allowed: true },
    { key: 'inventory.checklist', label: 'Completar checklist', allowed: true },
    { key: 'vehicles.view', label: 'Ver vehículos', allowed: true },
    { key: 'reports.view', label: 'Ver reportes', allowed: true },
    { key: 'settings.manage', label: 'Configuración', allowed: false },
  ],
  despachador: [
    { key: 'dispatch.create', label: 'Crear despachos', allowed: true },
    { key: 'dispatch.manage', label: 'Gestionar lotes', allowed: true },
    { key: 'vehicles.view', label: 'Ver vehículos', allowed: true },
    { key: 'reports.view', label: 'Ver reportes', allowed: true },
    { key: 'settings.manage', label: 'Configuración', allowed: false },
  ],
  cliente: [
    { key: 'vehicles.view.own', label: 'Ver sus vehículos', allowed: true },
    { key: 'dispatch.track', label: 'Rastrear despacho', allowed: true },
    { key: 'profile.edit', label: 'Editar perfil', allowed: true },
    { key: 'reports.view', label: 'Ver reportes', allowed: false },
    { key: 'settings.manage', label: 'Configuración', allowed: false },
  ],
}

// Definición de módulos de permisos por categoría
const PERMISSION_MODULES: Record<string, PermissionModuleEntry[]> = {
  'Gestión del Sistema': [
    { key: 'users.manage', label: 'Gestionar usuarios' },
    { key: 'roles.manage', label: 'Gestionar roles' },
    { key: 'settings.manage', label: 'Configuración' },
  ],
  Vehículos: [
    { key: 'vehicles.manage', label: 'Gestionar vehículos' },
    { key: 'vehicles.view', label: 'Ver vehículos' },
    { key: 'vehicles.receive', label: 'Recibir vehículos' },
    { key: 'vehicles.view.own', label: 'Ver sus vehículos' },
  ],
  Operaciones: [
    { key: 'gate.scan', label: 'Escanear QR en puerta' },
    { key: 'gate.log', label: 'Ver registro de puerta' },
    { key: 'imprint.create', label: 'Crear improntas' },
    { key: 'inventory.inspect', label: 'Inspeccionar inventario' },
    { key: 'inventory.checklist', label: 'Completar checklist' },
    { key: 'dispatch.create', label: 'Crear despachos' },
    { key: 'dispatch.manage', label: 'Gestionar lotes' },
    { key: 'dispatch.track', label: 'Rastrear despacho' },
  ],
  'Reportes y Análisis': [
    { key: 'reports.view', label: 'Ver reportes' },
    { key: 'profile.edit', label: 'Editar perfil' },
  ],
}

export const supabaseRoleService = {
  buildPermissionModules(): Record<string, PermissionState[]> {
    const mapped: Record<string, PermissionState[]> = {}
    for (const [module, perms] of Object.entries(PERMISSION_MODULES)) {
      mapped[module] = perms.map((perm) => ({
        key: perm.key,
        label: perm.label,
        allowed: false,
      }))
    }
    return mapped
  },
  /**
   * Obtiene todos los roles con contador de usuarios
   */
  async getAllRolesWithUsers(): Promise<any[]> {
    const $supabase = getSupabase()

    try {
      const { data: roles, error: rolesError } = await $supabase
        .from('roles')
        .select('id, nombre, descripcion, activo, permisos, created_at')
        .order('nombre')

      if (rolesError) {
        console.error('Error obteniendo roles:', rolesError)
        return []
      }

      if (!roles) return []

      // Contar usuarios por rol
      const rolesWithUsers = await Promise.all(
        roles.map(async (role: SupabaseRole & { permisos?: Record<string, PermissionState[]> }) => {
          const { count } = await $supabase
            .from('usuarios')
            .select('id', { count: 'exact', head: true })
            .eq('rol', role.nombre.toLowerCase())

          const config = ROLE_CONFIG[role.nombre.toLowerCase()] || ROLE_CONFIG.cliente

          // Usar permisos guardados en BD o DEFAULT_PERMISSIONS
          let permissions: PermissionState[] = []

          if (role.permisos && Object.keys(role.permisos).length > 0) {
            // Convertir permisos de JSONB (organizados por módulo) a array plano para la tarjeta
            for (const module in role.permisos) {
              permissions = permissions.concat(role.permisos[module])
            }
          } else {
            // Fallback a DEFAULT_PERMISSIONS
            const roleKey = role.nombre.toLowerCase()
            permissions = DEFAULT_PERMISSIONS[roleKey] || DEFAULT_PERMISSIONS.cliente
          }

          return {
            id: role.id,
            name: role.nombre,
            description: role.descripcion,
            usersCount: count || 0,
            headerBg: config.headerBg,
            iconBg: config.iconBg,
            icon: config.icon,
            permissions,
            activo: role.activo,
            created_at: role.created_at,
          }
        })
      )

      return rolesWithUsers
    } catch (err: any) {
      console.error('[getAllRolesWithUsers] Error:', err)
      return []
    }
  },

  /**
   * Obtiene un rol específico por nombre
   */
  async getRoleByName(nombre: string): Promise<SupabaseRole | null> {
    const $supabase = getSupabase()

    try {
      const { data, error } = await $supabase
        .from('roles')
        .select('*')
        .eq('nombre', nombre)
        .single()

      if (error || !data) return null
      return data as SupabaseRole
    } catch (err) {
      console.error('[getRoleByName] Error:', err)
      return null
    }
  },

  /**
   * Crea un nuevo rol con permisos
   */
  async createRole(
    nombre: string,
    descripcion: string,
    permissions: Record<string, Array<{ key: string; label: string; allowed: boolean }>>
  ): Promise<SupabaseRole | null> {
    const $supabase = getSupabase()

    try {
      const { data, error } = await $supabase
        .from('roles')
        .insert({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          permisos: permissions,
          activo: true,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creando rol:', error)
        return null
      }

      return data as SupabaseRole
    } catch (err: any) {
      console.error('[createRole] Error:', err)
      throw err
    }
  },

  /**
   * Actualiza un rol
   */
  async updateRole(
    roleId: number,
    updates: { nombre?: string; descripcion?: string; activo?: boolean }
  ): Promise<SupabaseRole | null> {
    const $supabase = getSupabase()

    try {
      const { data, error } = await $supabase
        .from('roles')
        .update(updates)
        .eq('id', roleId)
        .select()
        .single()

      if (error) {
        console.error('Error actualizando rol:', error)
        return null
      }

      return data as SupabaseRole
    } catch (err: any) {
      console.error('[updateRole] Error:', err)
      throw err
    }
  },

  /**
   * Obtiene los permisos de un rol
   */
  async getRolePermissions(roleId: number): Promise<Record<string, PermissionState[]>> {
    const $supabase = getSupabase()

    try {
      const { data, error } = await $supabase
        .from('roles')
        .select('id, nombre, permisos')
        .eq('id', roleId)
        .single()

      if (error || !data) {
        console.error('Error obteniendo permisos:', error)
        return supabaseRoleService.buildPermissionModules()
      }

      // Si el rol tiene permisos guardados, usarlos
      if (data.permisos && Object.keys(data.permisos).length > 0) {
        return data.permisos as any
      }

      // Si no, retornar los permisos por defecto según el nombre del rol
      const roleKey = data.nombre.toLowerCase()
      return {
        Permisos: DEFAULT_PERMISSIONS[roleKey] || DEFAULT_PERMISSIONS.cliente,
      }
    } catch (err: any) {
      console.error('[getRolePermissions] Error:', err)
      return supabaseRoleService.buildPermissionModules()
    }
  },

  /**
   * Actualiza los permisos de un rol
   */
  async updateRolePermissions(
    roleId: number,
    permissions: Record<string, PermissionState[]>
  ): Promise<boolean> {
    const $supabase = getSupabase()

    try {
      const { error } = await $supabase
        .from('roles')
        .update({ permisos: permissions })
        .eq('id', roleId)

      if (error) {
        console.error('Error actualizando permisos:', error)
        return false
      }

      return true
    } catch (err: any) {
      console.error('[updateRolePermissions] Error:', err)
      return false
    }
  },

  /**
   * Obtiene la definición de módulos de permisos disponibles
   */
  getPermissionModules() {
    return PERMISSION_MODULES
  },
}
