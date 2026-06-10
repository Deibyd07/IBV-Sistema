<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  supabaseNotificationService,
  type NotificationItem,
  type NotificationModule,
} from '~/services/supabaseNotificationService'
import { supabaseUserService, type SupabaseUser } from '~/services/supabaseUserService'
import { supabaseRoleService, type SupabaseRole } from '~/services/supabaseRoleService'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notifications = ref<NotificationItem[]>([])
const users = ref<SupabaseUser[]>([])
const formError = ref('')
const adminUserId = ref<number | null>(null)
const roles = ref<SupabaseRole[]>([])

const searchQuery = ref('')
const filterModule = ref<NotificationModule | ''>('')
const filterUnread = ref(false)
const filterRole = ref('')
const filterUserId = ref('')

const SYSTEM_ROLES = computed(() =>
  roles.value.map((r) => ({ value: r.nombre.toLowerCase(), label: r.nombre }))
)

const moduleOptions: Array<{
  value: NotificationModule | 'personal'
  label: string
  description?: string
}> = [
  { value: 'personal', label: 'Personal', description: 'Enviar a un usuario específico' },
  { value: 'general', label: 'General', description: 'Visible para todos los usuarios' },
  { value: 'admin', label: 'Admin', description: 'Solo usuarios con rol Admin' },
  { value: 'recibidor', label: 'Recibidor', description: 'Solo usuarios con rol Recibidor' },
  { value: 'inventario', label: 'Inventario', description: 'Solo usuarios con rol Inventario' },
  { value: 'despachador', label: 'Despachador', description: 'Solo usuarios con rol Despachador' },
  { value: 'porteria', label: 'Porteria', description: 'Solo usuarios con rol Porteria' },
]

const form = ref({
  titulo: '',
  mensaje: '',
  modulo: 'personal' as NotificationModule | 'personal',
  targetUserId: '',
  actionUrl: '',
})

const filteredNotifications = computed(() => {
  let list = [...notifications.value]
  if (filterRole.value) {
    const ids = new Set(users.value.filter((u) => u.rol === filterRole.value).map((u) => u.id))
    list = list.filter((n) => (n.recipient_user_id ? ids.has(n.recipient_user_id) : false))
  }
  return list
})

const getUserLabel = (userId: number | null) => {
  if (!userId) return '—'
  const user = users.value.find((u) => u.id === userId)
  if (!user) return `#${userId}`
  return `${user.nombres} ${user.apellidos}`.trim() || user.correo
}

const resolveAdminUserId = async () => {
  if (adminUserId.value) return adminUserId.value
  const email = authStore.user?.email
  if (!email) return null
  const profile = await supabaseUserService.getUserProfile(email)
  adminUserId.value = profile?.id ?? null
  return adminUserId.value
}

const loadRoles = async () => {
  try {
    const allRoles = await supabaseRoleService.getAllRolesWithUsers()
    roles.value = allRoles.map((r: any) => ({
      id: r.id,
      nombre: r.name,
      descripcion: r.description || '',
      activo: r.activo !== false,
      created_at: r.created_at,
    }))
  } catch (err) {
    console.error('Error cargando roles:', err)
  }
}

const loadUsers = async () => {
  users.value = await supabaseUserService.getAllUsers()
}

const loadNotifications = async () => {
  loading.value = true
  error.value = ''
  try {
    const list = await supabaseNotificationService.getNotifications({
      limit: 50,
      onlyUnread: filterUnread.value,
      module: filterModule.value || undefined,
      search: searchQuery.value || undefined,
      recipientUserId: filterUserId.value ? Number(filterUserId.value) : undefined,
    })
    notifications.value = list
  } catch (err: any) {
    error.value = err?.message || 'Error al cargar notificaciones'
  } finally {
    loading.value = false
  }
}

const markAsRead = async (item: NotificationItem) => {
  if (item.leida_en) return
  try {
    await supabaseNotificationService.markAsRead(item.id)
    notifications.value = notifications.value.map((n) =>
      n.id === item.id ? { ...n, leida_en: new Date().toISOString() } : n
    )
  } catch (err: any) {
    error.value = err?.message || 'Error al marcar notificacion'
  }
}

const createForUser = async (
  recipientUserId: number,
  createdByUserId: number,
  createdByRole: string
) => {
  // Para notificaciones personales, usar 'general' como módulo por defecto
  return supabaseNotificationService.createNotification({
    titulo: form.value.titulo.trim(),
    mensaje: form.value.mensaje.trim(),
    modulo: 'general',
    recipientUserId,
    createdByUserId,
    createdByRole,
    actionUrl: form.value.actionUrl?.trim() || null,
  })
}

const createNotifications = async () => {
  formError.value = ''

  if (!form.value.titulo.trim()) {
    formError.value = 'El titulo es requerido'
    return
  }
  if (!form.value.mensaje.trim()) {
    formError.value = 'El mensaje es requerido'
    return
  }

  const createdByUserId = await resolveAdminUserId()
  if (!createdByUserId) {
    formError.value = 'No se pudo resolver el usuario administrador'
    return
  }

  const createdByRole = 'admin'

  saving.value = true
  try {
    if (form.value.modulo === 'personal') {
      // Notificación para usuario específico
      const target = Number(form.value.targetUserId)
      if (!target) {
        formError.value = 'Selecciona un usuario destinatario'
        return
      }
      await createForUser(target, createdByUserId, createdByRole)
    } else {
      // Notificación para rol/módulo o general: una sola notificación con recipient_user_id NULL
      const modulo = form.value.modulo as NotificationModule

      // Validar que haya usuarios del rol si no es general
      if (modulo !== 'general') {
        const roleUsers = users.value.filter((u) => u.rol === modulo && u.activo)
        if (!roleUsers.length) {
          formError.value = `No hay usuarios activos con rol ${modulo}`
          return
        }
      }

      // Crear una sola notificación con recipientUserId null y modulo correspondiente
      await supabaseNotificationService.createNotification({
        titulo: form.value.titulo.trim(),
        mensaje: form.value.mensaje.trim(),
        modulo: modulo,
        recipientUserId: null,
        createdByUserId,
        createdByRole,
        actionUrl: form.value.actionUrl?.trim() || null,
      })
    }

    form.value.titulo = ''
    form.value.mensaje = ''
    form.value.actionUrl = ''
    form.value.targetUserId = ''
    await loadNotifications()
  } catch (err: any) {
    formError.value = err?.message || 'Error al crear notificaciones'
  } finally {
    saving.value = false
  }
}

const resetFilters = async () => {
  searchQuery.value = ''
  filterModule.value = ''
  filterUnread.value = false
  filterRole.value = ''
  filterUserId.value = ''
  await loadNotifications()
}

onMounted(async () => {
  await loadRoles()
  await loadUsers()
  await loadNotifications()
})
</script>

<template>
  <ClientOnly>
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
            ADM — Módulo Administración
          </p>
          <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
            Centro de Notificaciones
          </h1>
          <p class="text-zinc-500 mt-1">Controla y envía notificaciones a usuarios y roles</p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          @click="loadNotifications"
          :disabled="loading"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8 8 0 104.582 9"
            />
          </svg>
          Recargar
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 bg-[#10141c] rounded-lg border border-white/[0.08] p-5">
          <h2 class="font-display text-base uppercase tracking-tight text-zinc-100">
            Crear notificacion
          </h2>
          <p class="text-xs text-zinc-500 mt-1">Personal, por rol o general para todos</p>

          <div class="mt-4 space-y-3">
            <div>
              <label class="text-sm font-medium text-zinc-200">Titulo</label>
              <input
                v-model="form.titulo"
                class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
                placeholder="Titulo de la notificacion"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-zinc-200">Mensaje</label>
              <textarea
                v-model="form.mensaje"
                rows="3"
                class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
                placeholder="Detalle del mensaje"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-zinc-200">Tipo de notificación</label>
              <select
                v-model="form.modulo"
                class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
              >
                <option v-for="opt in moduleOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <p class="text-xs text-zinc-500 mt-1">
                {{ moduleOptions.find((o) => o.value === form.modulo)?.description }}
              </p>
            </div>
            <div v-if="form.modulo === 'personal'">
              <label class="text-sm font-medium text-zinc-200">Usuario destinatario</label>
              <select
                v-model="form.targetUserId"
                class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
              >
                <option value="">Selecciona un usuario</option>
                <option v-for="user in users" :key="user.id" :value="String(user.id)">
                  {{ user.nombres }} {{ user.apellidos }} ({{ user.correo }})
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-zinc-200">URL de accion (opcional)</label>
              <input
                v-model="form.actionUrl"
                class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
                placeholder="/admin/usuarios"
              />
            </div>

            <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>

            <button
              class="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 text-black rounded-md hover:bg-amber-300 disabled:opacity-70"
              type="button"
              :disabled="saving"
              @click="createNotifications"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {{ saving ? 'Enviando...' : 'Enviar notificacion' }}
            </button>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-4">
          <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div class="lg:col-span-2">
                <label class="text-xs font-semibold text-zinc-500">Buscar</label>
                <input
                  v-model="searchQuery"
                  class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
                  placeholder="Titulo o mensaje"
                />
              </div>
              <div>
                <label class="text-xs font-semibold text-zinc-500">Modulo</label>
                <select
                  v-model="filterModule"
                  class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
                >
                  <option value="">Todos</option>
                  <option v-for="opt in moduleOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-zinc-500">Usuario</label>
                <select
                  v-model="filterUserId"
                  class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
                >
                  <option value="">Todos</option>
                  <option v-for="user in users" :key="user.id" :value="String(user.id)">
                    {{ user.nombres }} {{ user.apellidos }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-zinc-500">Rol</label>
                <select
                  v-model="filterRole"
                  class="mt-1 w-full px-3 py-2 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
                >
                  <option value="">Todos</option>
                  <option v-for="role in SYSTEM_ROLES" :key="role.value" :value="role.value">
                    {{ role.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="flex items-center justify-between mt-3">
              <label class="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                <input v-model="filterUnread" type="checkbox" class="w-4 h-4 rounded" />
                Solo no leidas
              </label>
              <div class="flex items-center gap-2">
                <button
                  class="px-3 py-2 text-sm rounded-lg border border-white/[0.08] hover:bg-[#0d111a]"
                  type="button"
                  @click="resetFilters"
                >
                  Limpiar
                </button>
                <button
                  class="px-3 py-2 text-sm rounded-lg bg-amber-400 text-black hover:bg-amber-300"
                  type="button"
                  @click="loadNotifications"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>

          <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
            <div class="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold text-zinc-100">Listado</p>
                <p class="text-xs text-zinc-500">{{ filteredNotifications.length }} registros</p>
              </div>
            </div>

            <div v-if="loading" class="px-4 py-6 text-sm text-zinc-500">Cargando...</div>
            <div v-else-if="error" class="px-4 py-6 text-sm text-red-400">{{ error }}</div>
            <div
              v-else-if="filteredNotifications.length === 0"
              class="px-4 py-6 text-sm text-zinc-500"
            >
              Sin notificaciones
            </div>

            <div v-else class="divide-y">
              <div v-for="item in filteredNotifications" :key="item.id" class="px-4 py-3">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-start gap-2 mb-1">
                      <p
                        class="text-sm font-semibold flex-1"
                        :class="
                          item.leida_en && item.recipient_user_id !== null
                            ? 'text-zinc-400'
                            : 'text-zinc-100'
                        "
                      >
                        {{ item.titulo }}
                      </p>
                      <!-- Indicador de tipo -->
                      <span
                        v-if="item.recipient_user_id === null"
                        class="text-[10px] px-2 py-0.5 rounded-sm bg-sky-500/15 text-sky-300 whitespace-nowrap"
                        title="Notificación de grupo (rol o general)"
                      >
                        Grupo
                      </span>
                      <span
                        v-else
                        class="text-[10px] px-2 py-0.5 rounded-sm bg-violet-500/15 text-violet-300 whitespace-nowrap"
                        title="Notificación personal"
                      >
                        Personal
                      </span>
                    </div>
                    <p class="text-xs text-zinc-500 mt-1">{{ item.mensaje }}</p>
                    <div class="flex flex-wrap items-center gap-3 text-[11px] text-zinc-600 mt-2">
                      <span>Modulo: {{ item.modulo }}</span>
                      <span v-if="item.recipient_user_id !== null">
                        Usuario: {{ getUserLabel(item.recipient_user_id) }}
                      </span>
                      <span v-else>
                        Destinatarios:
                        {{ item.modulo === 'general' ? 'Todos' : `Rol ${item.modulo}` }}
                      </span>
                      <span>Rol origen: {{ item.created_by_role }}</span>
                      <span>{{ item.created_at }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Solo permitir marcar como leída notificaciones personales -->
                    <button
                      v-if="!item.leida_en && item.recipient_user_id !== null"
                      class="text-xs text-amber-300 hover:text-amber-200 whitespace-nowrap"
                      type="button"
                      @click="markAsRead(item)"
                    >
                      Marcar leida
                    </button>
                    <!-- Solo mostrar estado leída para notificaciones personales -->
                    <span
                      v-if="item.recipient_user_id !== null"
                      class="text-[10px] px-2 py-1 rounded-sm whitespace-nowrap"
                      :class="
                        item.leida_en
                          ? 'bg-[#0b0e14] text-zinc-500'
                          : 'bg-emerald-500/15 text-emerald-400'
                      "
                    >
                      {{ item.leida_en ? 'Leida' : 'Nueva' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
