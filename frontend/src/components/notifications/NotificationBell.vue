<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useNotificationStore } from '~/stores/notificationStore'
import type { NotificationItem, NotificationModule } from '~/services/supabaseNotificationService'

const notificationStore = useNotificationStore()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const unreadCount = computed(() => notificationStore.unreadCount)
const isLoading = computed(() => notificationStore.loading)
const notifications = computed(() => notificationStore.notifications)

const moduleConfig: Record<NotificationModule, { label: string; dot: string; text: string }> = {
  admin: { label: 'Admin', dot: 'bg-amber-400', text: 'text-amber-300' },
  recibidor: { label: 'Recibidor', dot: 'bg-sky-400', text: 'text-sky-300' },
  inventario: { label: 'Inventario', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  despachador: { label: 'Despachador', dot: 'bg-orange-400', text: 'text-orange-300' },
  porteria: { label: 'Portería', dot: 'bg-rose-400', text: 'text-rose-300' },
  general: { label: 'General', dot: 'bg-zinc-400', text: 'text-zinc-400' },
}

const formatDate = (value: string) => {
  try {
    const date = new Date(value)
    const ahora = new Date()
    const diffMs = ahora.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 60) return diffMins <= 1 ? 'Ahora' : `${diffMins} min`
    if (diffHours < 24) return `${diffHours} h`
    if (diffDays < 7) return `${diffDays} d`
    return new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: '2-digit' }).format(date)
  } catch {
    return value
  }
}

const toggleOpen = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) await notificationStore.fetchNotifications(12)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (dropdownRef.value && !dropdownRef.value.contains(target)) isOpen.value = false
}

const markAllAsRead = async () => await notificationStore.markAllAsRead()

const markAsRead = async (item: NotificationItem) => {
  if (item.leida_en) return
  await notificationStore.markAsRead(item.id)
}

const openNotification = async (item: NotificationItem) => {
  await markAsRead(item)
  if (item.action_url) navigateTo(item.action_url)
}

onMounted(() => {
  notificationStore.fetchNotifications(12)
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Bell button -->
    <button
      class="relative p-2 text-zinc-500 hover:text-amber-300 transition-colors rounded-md hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]"
      type="button"
      @click.stop="toggleOpen"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-md flex items-center justify-center font-data"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="fixed sm:absolute right-0 left-0 sm:left-auto mt-0 sm:mt-2 top-16 sm:top-auto w-full sm:w-[380px] bg-[#10141c] border border-white/[0.10] sm:rounded-lg shadow-2xl shadow-black/60 overflow-hidden z-50 max-h-[calc(100vh-4rem)] sm:max-h-[480px]"
      @click.stop
    >
      <!-- Header dropdown -->
      <div
        class="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02] shrink-0"
      >
        <div>
          <p class="font-display text-xs uppercase tracking-wide text-zinc-100">Notificaciones</p>
          <p class="font-data text-[10px] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">
            {{ unreadCount }} sin leer
          </p>
        </div>
        <button
          class="font-data text-[10px] uppercase tracking-[0.15em] text-amber-300 hover:text-amber-200 transition-colors focus:outline-none"
          type="button"
          @click="markAllAsRead"
        >
          Marcar todas
        </button>
      </div>

      <!-- Lista -->
      <div class="overflow-y-auto" style="max-height: calc(100vh - 9rem)">
        <div
          v-if="isLoading"
          class="px-4 py-8 font-data text-xs text-center text-zinc-600 uppercase tracking-[0.2em]"
        >
          Cargando...
        </div>

        <div v-else-if="notifications.length === 0" class="px-4 py-10 text-center">
          <svg
            class="w-10 h-10 mx-auto mb-3 text-zinc-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p class="font-data text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            Sin notificaciones
          </p>
        </div>

        <button
          v-for="item in notifications"
          :key="item.id"
          class="w-full text-left px-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors"
          :class="{ 'bg-amber-400/[0.03]': !item.leida_en && item.recipient_user_id !== null }"
          type="button"
          @click="openNotification(item)"
        >
          <div class="flex items-start gap-3">
            <span
              class="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
              :class="moduleConfig[item.modulo]?.dot || 'bg-zinc-500'"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-1">
                <p
                  class="text-xs font-semibold flex-1 min-w-0 break-words"
                  :class="
                    item.leida_en && item.recipient_user_id !== null
                      ? 'text-zinc-500'
                      : 'text-zinc-100'
                  "
                >
                  {{ item.titulo }}
                </p>
                <span class="font-data text-[10px] text-zinc-600 whitespace-nowrap shrink-0 mt-0.5">
                  {{ formatDate(item.created_at) }}
                </span>
              </div>
              <p class="text-xs text-zinc-500 mb-2 line-clamp-2">{{ item.mensaje }}</p>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    class="font-data text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-sm border"
                    :class="`${moduleConfig[item.modulo]?.text || 'text-zinc-400'} border-current/30 bg-current/5`"
                  >
                    {{ moduleConfig[item.modulo]?.label || 'General' }}
                  </span>
                  <span
                    v-if="item.recipient_user_id === null"
                    class="font-data text-[9px] px-1.5 py-0.5 rounded-sm bg-white/[0.04] text-zinc-600 border border-white/[0.08]"
                    title="Notificación de grupo"
                  >
                    <svg
                      class="w-2.5 h-2.5 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </span>
                </div>
                <span
                  v-if="item.recipient_user_id !== null"
                  class="font-data text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm border"
                  :class="
                    item.leida_en
                      ? 'border-white/[0.08] text-zinc-600 bg-white/[0.02]'
                      : 'border-amber-400/30 text-amber-300 bg-amber-400/[0.06]'
                  "
                >
                  {{ item.leida_en ? 'Leída' : 'Nueva' }}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-display {
  font-family: 'Archivo Black', 'Archivo', system-ui, sans-serif;
  font-weight: 400;
}

.font-data {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
