import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { supabaseUserService } from '~/services/supabaseUserService'
import {
  supabaseNotificationService,
  type NotificationItem,
  type NotificationInput,
} from '~/services/supabaseNotificationService'

export const useNotificationStore = defineStore('notifications', () => {
  const authStore = useAuthStore()
  const notifications = ref<NotificationItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUserId = ref<number | null>(null)

  const unreadCount = computed(
    () =>
      // Solo contar notificaciones personales no leídas
      // (Las notificaciones de rol/general no se pueden marcar como leídas individualmente)
      notifications.value.filter((n) => !n.leida_en && n.recipient_user_id !== null).length
  )

  const resolveUserId = async () => {
    if (currentUserId.value) return currentUserId.value
    const email = authStore.user?.email
    if (!email) return null
    const profile = await supabaseUserService.getUserProfile(email)
    currentUserId.value = profile?.id ?? null
    return currentUserId.value
  }

  const fetchNotifications = async (limit: number = 10) => {
    loading.value = true
    error.value = null

    try {
      const list = await supabaseNotificationService.getNotifications({ limit })
      notifications.value = list
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar notificaciones'
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await supabaseNotificationService.markAsRead(id)
      notifications.value = notifications.value.map((item) =>
        item.id === id ? { ...item, leida_en: new Date().toISOString() } : item
      )
    } catch (err: any) {
      error.value = err?.message || 'Error al marcar notificacion'
    }
  }

  const markAllAsRead = async () => {
    const userId = await resolveUserId()
    if (!userId) return

    try {
      await supabaseNotificationService.markAllAsReadForUser(userId)
      const now = new Date().toISOString()
      notifications.value = notifications.value.map((item) => ({
        ...item,
        leida_en: item.leida_en || now,
      }))
    } catch (err: any) {
      error.value = err?.message || 'Error al marcar todas las notificaciones'
    }
  }

  const createNotificationForSelf = async (
    input: Omit<NotificationInput, 'recipientUserId' | 'createdByUserId' | 'createdByRole'>
  ) => {
    const userId = await resolveUserId()
    if (!userId) return null

    const createdByRole = authStore.user?.role || 'cliente'

    const created = await supabaseNotificationService.createNotification({
      ...input,
      recipientUserId: userId,
      createdByUserId: userId,
      createdByRole,
    })

    if (created) {
      notifications.value = [created, ...notifications.value]
    }

    return created
  }

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotificationForSelf,
  }
})
