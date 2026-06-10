import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseUserService } from '~/services/supabaseUserService'

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin',
  porteria: '/porteria',
  recibidor: '/recibidor',
  inventario: '/inventario',
  despachador: '/despachador',
  cliente: '/',
}

export const useAuthStore = defineStore('auth', () => {
  const { $supabase } = useNuxtApp()
  const supabase = $supabase as SupabaseClient
  const isClient = typeof window !== 'undefined'

  // Limpiar tokens antiguos si existen
  if (isClient) {
    const oldToken = localStorage.getItem('auth_token')
    if (oldToken) {
      localStorage.removeItem('auth_token')
      console.log('[auth] Limpiando token antiguo del localStorage')
    }
  }

  const user = ref<AuthUser | null>(
    isClient ? JSON.parse(localStorage.getItem('auth_user') || 'null') : null
  )
  const isAuthenticated = computed(() => !!user.value)

  /**
   * Obtiene el rol del usuario desde múltiples fuentes:
   * 1. Tabla 'users' en Supabase (si existe)
   * 2. user_metadata de Supabase Auth
   * 3. app_metadata de Supabase Auth
   * 4. Default: 'cliente'
   */
  const getRoleForUser = async (
    email: string,
    authUser: {
      user_metadata?: Record<string, string>
      app_metadata?: Record<string, string>
    } | null
  ): Promise<string> => {
    // Primero intenta obtener de la tabla 'users' en Supabase
    const dbRole = await supabaseUserService.getUserRole(email)
    if (dbRole) {
      return dbRole
    }

    // Fallback a user_metadata
    if (authUser?.user_metadata?.role) {
      return authUser.user_metadata.role
    }

    // Fallback a app_metadata
    if (authUser?.app_metadata?.role) {
      return authUser.app_metadata.role
    }

    // Default
    return 'cliente'
  }

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('Credenciales requeridas')
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      throw new Error(error.message)
    }

    // Supabase guarda automáticamente la sesión (access_token + refresh_token) en localStorage

    // Obtener el rol usando múltiples fuentes
    const role = await getRoleForUser(email, data.user)

    // Obtener perfil de la tabla usuarios para el nombre
    const profile = await supabaseUserService.getUserProfile(email)

    user.value = {
      id: data.user?.id || '',
      name: profile
        ? `${profile.nombres} ${profile.apellidos}`.trim()
        : (data.user?.user_metadata?.name as string | undefined) ||
          data.user?.email?.split('@')[0] ||
          'Usuario',
      email: data.user?.email || '',
      role,
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }

    // Retornar la ruta según el rol
    return ROLE_ROUTES[role] || '/'
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user')
      // Supabase limpia automáticamente sus tokens
    }
  }

  const loadUser = async () => {
    // Intenta cargar el usuario desde localStorage
    if (!user.value && isClient) {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        user.value = JSON.parse(stored)
      }
    }
  }

  const restoreSession = async () => {
    try {
      const { data } = await $supabase.auth.getSession()
      const session = data?.session
      if (!session) return false

      // Supabase maneja automáticamente la persistencia de tokens

      const email = session.user?.email || ''
      const role = email ? await getRoleForUser(email, session.user) : 'cliente'
      const profile = email ? await supabaseUserService.getUserProfile(email) : null

      user.value = {
        id: session.user?.id || '',
        name: profile
          ? `${profile.nombres} ${profile.apellidos}`.trim()
          : (session.user?.user_metadata?.name as string | undefined) ||
            email.split('@')[0] ||
            'Usuario',
        email,
        role,
      }

      if (isClient) {
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      }

      return true
    } catch (err) {
      console.error('[restoreSession] Error:', err)
      return false
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    loadUser,
    restoreSession,
  }
})
