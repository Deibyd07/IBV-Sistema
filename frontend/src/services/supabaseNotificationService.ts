/**
 * Servicio para gestionar notificaciones desde Supabase
 * Tabla: notificaciones
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const getSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}

export type NotificationModule =
  | 'admin'
  | 'recibidor'
  | 'inventario'
  | 'despachador'
  | 'porteria'
  | 'general'

export interface NotificationItem {
  id: number
  titulo: string
  mensaje: string
  modulo: NotificationModule
  recipient_user_id: number | null
  created_by_user_id: number | null
  created_by_role: string
  action_url: string | null
  metadata: Record<string, any>
  leida_en: string | null
  created_at: string
}

export interface NotificationInput {
  titulo: string
  mensaje: string
  modulo: NotificationModule
  recipientUserId: number | null
  createdByUserId: number | null
  createdByRole: string
  actionUrl?: string | null
  metadata?: Record<string, any>
}

export interface NotificationQueryOptions {
  limit?: number
  onlyUnread?: boolean
  recipientUserId?: number | null
  module?: NotificationModule
  createdByRole?: string
  search?: string
}

export const supabaseNotificationService = {
  async getNotifications(options?: NotificationQueryOptions): Promise<NotificationItem[]> {
    const $supabase = getSupabase()
    const limit = options?.limit ?? 10
    const onlyUnread = options?.onlyUnread ?? false
    const recipientUserId = options?.recipientUserId
    const module = options?.module
    const createdByRole = options?.createdByRole
    const search = options?.search?.trim()

    let query = $supabase
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // RLS se encargará del filtrado de visibilidad automáticamente
    // Solo aplicamos filtros adicionales si se solicitan

    if (onlyUnread) {
      query = query.is('leida_en', null)
    }

    // Filtro por usuario específico solo si se solicita explícitamente (para admin)
    if (typeof recipientUserId === 'number') {
      query = query.eq('recipient_user_id', recipientUserId)
    }

    if (module) {
      query = query.eq('modulo', module)
    }

    if (createdByRole) {
      query = query.eq('created_by_role', createdByRole)
    }

    if (search) {
      const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.or(`titulo.ilike.%${escaped}%,mensaje.ilike.%${escaped}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo notificaciones:', error)
      return []
    }

    return (data || []) as NotificationItem[]
  },

  async markAsRead(id: number): Promise<void> {
    const $supabase = getSupabase()

    // NOTA: Las políticas RLS permiten UPDATE solo para:
    // 1. Admin (puede actualizar todas)
    // 2. Usuario destinatario (solo notificaciones personales donde recipient_user_id = su ID)
    // Las notificaciones de rol/generales (recipient_user_id NULL) no se pueden marcar como leídas por usuarios normales
    const { error } = await $supabase
      .from('notificaciones')
      .update({ leida_en: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      // Si falla por RLS (notificación de rol/general), no lanzar error
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        console.info('No se puede marcar como leída: notificación de rol/general')
        return
      }
      console.error('Error marcando notificacion como leida:', error)
      throw new Error(error.message)
    }
  },

  async markAllAsReadForUser(userId: number): Promise<void> {
    const $supabase = getSupabase()

    // Solo marca como leídas las notificaciones PERSONALES del usuario
    // (Las notificaciones de rol/generales no se marcan como leídas individualmente)
    const { error } = await $supabase
      .from('notificaciones')
      .update({ leida_en: new Date().toISOString() })
      .eq('recipient_user_id', userId)
      .is('leida_en', null)

    if (error) {
      console.error('Error marcando todas las notificaciones:', error)
      throw new Error(error.message)
    }
  },

  async createNotification(input: NotificationInput): Promise<NotificationItem | null> {
    const $supabase = getSupabase()

    const { data, error } = await $supabase.rpc('create_notification_admin', {
      p_titulo: input.titulo,
      p_mensaje: input.mensaje,
      p_modulo: input.modulo,
      p_recipient_user_id: input.recipientUserId,
      p_created_by_user_id: input.createdByUserId,
      p_created_by_role: input.createdByRole,
      p_action_url: input.actionUrl ?? null,
      p_metadata: input.metadata ?? {},
    })

    if (error) {
      console.error('Error creando notificacion:', error)
      const detail = [error.code, error.message, error.details, error.hint]
        .filter(Boolean)
        .join(' | ')
      throw new Error(detail || 'Error creando notificación')
    }

    return data as NotificationItem
  },
}
