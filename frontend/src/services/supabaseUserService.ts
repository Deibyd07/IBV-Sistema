/**
 * Servicio para gestionar usuarios desde Supabase
 * Tabla: usuarios (columnas: correo, nombres, apellidos, rol, activo, etc.)
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const getSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}

export interface SupabaseUser {
  id: number
  correo: string
  nombres: string
  apellidos: string
  rol: string
  activo: boolean
  es_personal: boolean
  es_superusuario: boolean
  fecha_registro: string
  ultimo_ingreso: string | null
  rol_id: number | null
}

// Mapeo de emails a roles para seed automÃ¡tico
const USER_SEED_MAP: Record<string, { nombres: string; apellidos: string; rol: string }> = {
  'admin1@ibv.com': { nombres: 'Admin', apellidos: 'IBV', rol: 'admin' },
  'porteria1@ibv.com': { nombres: 'PorterÃ­a', apellidos: 'IBV', rol: 'porteria' },
  'recibidor1@ibv.com': { nombres: 'Recibidor', apellidos: 'IBV', rol: 'recibidor' },
  'inventario1@ibv.com': { nombres: 'Inventario', apellidos: 'IBV', rol: 'inventario' },
  'despacho1@ibv.com': { nombres: 'Despacho', apellidos: 'IBV', rol: 'despachador' },
}

export const supabaseUserService = {
  /**
   * Obtiene el rol de un usuario por su correo desde la tabla usuarios
   */
  async getUserRole(email: string): Promise<string | null> {
    const $supabase = getSupabase()

    try {
      const { data, error } = await $supabase
        .from('usuarios')
        .select('rol')
        .eq('correo', email)
        .single()

      if (error || !data) {
        console.log('Usuario no encontrado en usuarios, intentando seed:', email)
        // Intentar crear el usuario si estÃ¡ en el mapa de seed
        const seeded = await supabaseUserService.ensureUserExists(email)
        return seeded ? seeded.rol : null
      }

      return data.rol
    } catch (err) {
      console.log('Error consultando usuarios:', err)
      return null
    }
  },

  /**
   * Obtiene el perfil completo de un usuario por correo
   */
  async getUserProfile(email: string): Promise<SupabaseUser | null> {
    const $supabase = getSupabase()

    try {
      const { data, error } = await $supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email)
        .single()

      if (error || !data) {
        return null
      }

      return data as SupabaseUser
    } catch (err) {
      console.log('Error obteniendo perfil:', err)
      return null
    }
  },

  /**
   * Obtiene todos los usuarios
   */
  async getAllUsers(): Promise<SupabaseUser[]> {
    const $supabase = getSupabase()

    const { data, error } = await $supabase
      .from('usuarios')
      .select('*')
      .order('fecha_registro', { ascending: false })

    if (error) {
      console.error('Error obteniendo usuarios:', error)
      return []
    }

    return (data || []) as SupabaseUser[]
  },

  /**
   * Crea un nuevo usuario en Supabase Auth Y en la tabla usuarios (via servidor)
   */
  async createUser(userData: {
    correo: string
    nombres: string
    apellidos: string
    rol: string
    password: string
    activo?: boolean
  }): Promise<SupabaseUser | null> {
    try {
      // Llamar al endpoint del servidor que tiene permisos de admin
      const response = (await $fetch('/api/admin/users', {
        method: 'POST',
        body: {
          correo: userData.correo,
          nombres: userData.nombres,
          apellidos: userData.apellidos,
          rol: userData.rol,
          password: userData.password,
          activo: userData.activo ?? true,
        },
      })) as any

      return response.user as SupabaseUser
    } catch (error: any) {
      console.error('Error creando usuario:', error)
      throw new Error(error.data?.message || error.message || 'Error creando usuario')
    }
  },

  /**
   * Actualiza un usuario existente (via servidor)
   */
  async updateUser(
    id: number,
    updates: Partial<{
      nombres: string
      apellidos: string
      rol: string
      activo: boolean
    }>
  ): Promise<SupabaseUser | null> {
    try {
      console.log('[supabaseUserService.updateUser] ID:', id)
      console.log('[supabaseUserService.updateUser] Updates:', updates)

      const response = (await $fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: updates,
      })) as any

      console.log('[supabaseUserService.updateUser] Response:', response)

      // Verificar respuesta JSON en vez de confiar en HTTP status
      if (response.success === false) {
        throw new Error(`[${response.error}] ${response.message}`)
      }

      return response.user as SupabaseUser
    } catch (error: any) {
      console.error('Error actualizando usuario:', error)
      // Si la respuesta viene con datos JSON de error
      const errorData = error.data || error.response?._data
      if (errorData?.error) {
        const msg = `[${errorData.error}] ${errorData.message}`
        console.error('Detalle del error:', msg)
        throw new Error(msg)
      }
      const msg =
        error.data?.statusMessage ||
        error.data?.message ||
        error.statusMessage ||
        error.message ||
        'Error actualizando usuario'
      console.error('Detalle del error:', msg)
      throw new Error(msg)
    }
  },

  /**
   * Elimina un usuario de Supabase Auth Y de la tabla usuarios (via servidor)
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await $fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })
    } catch (error: any) {
      console.error('Error eliminando usuario:', error)
      throw new Error(error.data?.message || error.message || 'Error eliminando usuario')
    }
  },

  /**
   * Asegura que un usuario de Supabase Auth exista en la tabla usuarios
   * Si no existe y está en el mapa de seed, lo crea automáticamente
   */
  async ensureUserExists(email: string): Promise<SupabaseUser | null> {
    const $supabase = getSupabase()

    // Verificar si ya existe
    const { data: existing } = await $supabase
      .from('usuarios')
      .select('*')
      .eq('correo', email)
      .single()

    if (existing) return existing as SupabaseUser

    // Buscar en el mapa de seed
    const seedInfo = USER_SEED_MAP[email.toLowerCase()]
    if (!seedInfo) return null

    // Crear el usuario
    const { data: created, error } = await $supabase
      .from('usuarios')
      .insert({
        correo: email,
        nombres: seedInfo.nombres,
        apellidos: seedInfo.apellidos,
        rol: seedInfo.rol,
        activo: true,
        es_superusuario: seedInfo.rol === 'admin',
        es_personal: true,
        fecha_registro: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error en seed de usuario:', error)
      return null
    }

    console.log(`Usuario ${email} creado automÃ¡ticamente con rol: ${seedInfo.rol}`)
    return created as SupabaseUser
  },

  /**
   * Ejecuta el seed de todos los usuarios predefinidos
   */
  async seedAllUsers(): Promise<void> {
    for (const email of Object.keys(USER_SEED_MAP)) {
      await supabaseUserService.ensureUserExists(email)
    }
    console.log('Seed de usuarios completado')
  },
}
