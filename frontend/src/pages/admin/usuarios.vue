<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabaseUserService } from '~/services/supabaseUserService'
import type { SupabaseUser } from '~/services/supabaseUserService'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

// States
const loading = ref(false)
const error = ref('')
const users = ref<SupabaseUser[]>([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref<SupabaseUser | null>(null)
const userToDelete = ref<SupabaseUser | null>(null)
const saving = ref(false)
const formError = ref('')
const showPassword = ref(false)

// Filters
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')

// Toast
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

const SYSTEM_ROLES = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso total al sistema',
    color: 'bg-amber-400/[0.12]',
    dotColor: 'bg-amber-400',
  },
  {
    value: 'porteria',
    label: 'Portería',
    description: 'Control de acceso y portón',
    color: 'bg-rose-500/15',
    dotColor: 'bg-rose-500',
  },
  {
    value: 'recibidor',
    label: 'Recibidor',
    description: 'Recepción de vehículos e impronta',
    color: 'bg-sky-500/15',
    dotColor: 'bg-sky-500',
  },
  {
    value: 'inventario',
    label: 'Inventario',
    description: 'Verificación e inspección',
    color: 'bg-emerald-500/15',
    dotColor: 'bg-emerald-500',
  },
  {
    value: 'despachador',
    label: 'Despachador',
    description: 'Despacho y salida de vehículos',
    color: 'bg-orange-500/15',
    dotColor: 'bg-orange-500',
  },
  {
    value: 'cliente',
    label: 'Cliente',
    description: 'Consulta y seguimiento',
    color: 'bg-[#0b0e14]',
    dotColor: 'bg-zinc-700',
  },
]

const form = ref({
  nombres: '',
  apellidos: '',
  correo: '',
  password: '',
  rol: 'recibidor',
  activo: true,
})

// Computed
const filteredUsers = computed(() => {
  let result = [...users.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (u) =>
        u.nombres.toLowerCase().includes(q) ||
        u.apellidos.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q)
    )
  }
  if (filterRole.value) {
    result = result.filter((u) => u.rol === filterRole.value)
  }
  if (filterStatus.value) {
    result = result.filter((u) => u.activo === (filterStatus.value === 'active'))
  }
  return result
})

// Helpers
const getInitials = (nombres: string, apellidos: string) => {
  return (nombres?.[0] || '') + (apellidos?.[0] || '')
}

const getAvatarColor = (rol: string) => {
  const colors: Record<string, string> = {
    admin: 'bg-amber-400',
    recibidor: 'bg-sky-500',
    inventario: 'bg-emerald-500',
    despachador: 'bg-orange-500',
    porteria: 'bg-rose-500',
    cliente: 'bg-zinc-700',
  }
  return colors[rol] || 'bg-zinc-700'
}

const getRoleInfo = (rol: string) => {
  const role = SYSTEM_ROLES.find((r) => r.value === rol)
  return role || { value: rol, label: rol, color: 'bg-[#0b0e14]', dotColor: 'bg-zinc-600' }
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Load users
const loadUsers = async () => {
  try {
    loading.value = true
    users.value = await supabaseUserService.getAllUsers()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al cargar usuarios'
    showToast(error.value, 'error')
  } finally {
    loading.value = false
  }
}

// CRUD handlers
const openCreateModal = () => {
  editingUser.value = null
  formError.value = ''
  showPassword.value = false
  form.value = {
    nombres: '',
    apellidos: '',
    correo: '',
    password: '',
    rol: 'recibidor',
    activo: true,
  }
  showModal.value = true
}

const editUser = (user: SupabaseUser) => {
  editingUser.value = user
  formError.value = ''
  form.value = {
    nombres: user.nombres,
    apellidos: user.apellidos,
    correo: user.correo,
    password: '',
    rol: user.rol,
    activo: user.activo,
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingUser.value = null
  formError.value = ''
}

const saveUser = async () => {
  formError.value = ''

  if (!form.value.nombres.trim()) {
    formError.value = 'El nombre es requerido'
    return
  }
  if (!form.value.correo.trim()) {
    formError.value = 'El email es requerido'
    return
  }

  // Si es crear nuevo usuario, validar password
  if (!editingUser.value && !form.value.password.trim()) {
    formError.value = 'La contraseña es requerida para nuevos usuarios'
    return
  }

  saving.value = true
  try {
    if (editingUser.value) {
      // Actualización: no requiere password
      await supabaseUserService.updateUser(editingUser.value.id, {
        nombres: form.value.nombres,
        apellidos: form.value.apellidos,
        rol: form.value.rol,
        activo: form.value.activo,
      })
      showToast(`Usuario "${form.value.nombres}" actualizado`)
    } else {
      // Crear nuevo usuario: requiere password y crea en Auth
      await supabaseUserService.createUser({
        correo: form.value.correo,
        nombres: form.value.nombres,
        apellidos: form.value.apellidos,
        rol: form.value.rol,
        password: form.value.password,
        activo: form.value.activo,
      })
      showToast(`Usuario "${form.value.nombres}" creado exitosamente en Auth y BD`)
    }
    await loadUsers()
    closeModal()
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Error al guardar usuario'
  } finally {
    saving.value = false
  }
}

const openDeleteModal = (user: SupabaseUser) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  userToDelete.value = null
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  saving.value = true
  try {
    const name = userToDelete.value.nombres
    await supabaseUserService.deleteUser(userToDelete.value.id)
    showToast(`Usuario "${name}" eliminado`)
    await loadUsers()
    closeDeleteModal()
  } catch (err) {
    showToast('Error al eliminar usuario', 'error')
  } finally {
    saving.value = false
  }
}

const handleToggleStatus = async (user: SupabaseUser) => {
  try {
    await supabaseUserService.updateUser(user.id, { activo: !user.activo })
    showToast(`Estado de "${user.nombres}" actualizado`)
    await loadUsers()
  } catch {
    showToast('Error al cambiar estado', 'error')
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <ClientOnly>
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
            ADM — Módulo Administración
          </p>
          <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
            Gestión de Usuarios
          </h1>
          <p class="text-zinc-500 mt-1">
            {{ users.filter((u) => u.activo).length }} activos de {{ users.length }} usuarios
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            :disabled="loading"
            @click="loadUsers"
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
          <button
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black font-semibold rounded-md hover:bg-amber-300 transition shadow-sm"
            @click="openCreateModal"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1 relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por nombre o email..."
              class="w-full pl-10 pr-4 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70"
            />
          </div>
          <select
            v-model="filterRole"
            class="px-4 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 bg-[#10141c]"
          >
            <option value="">Todos los roles</option>
            <option v-for="role in SYSTEM_ROLES" :key="role.value" :value="role.value">
              {{ role.label }}
            </option>
          </select>
          <select
            v-model="filterStatus"
            class="px-4 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 bg-[#10141c]"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <!-- Toast de éxito -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div
          v-if="toast.show"
          :class="[
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg border border-white/[0.08] shadow-lg shadow-black/40 text-white font-medium',
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600',
          ]"
        >
          <svg
            v-if="toast.type === 'success'"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {{ toast.message }}
        </div>
      </Transition>

      <!-- Tabla de usuarios -->
      <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
        <!-- Loading -->
        <div v-if="loading" class="p-12 text-center">
          <div
            class="animate-spin w-8 h-8 border-4 border-amber-400/30 border-t-amber-400 rounded-full mx-auto mb-3"
          />
          <p class="text-zinc-500 text-sm">Cargando usuarios...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredUsers.length === 0" class="p-12 text-center">
          <svg
            class="w-16 h-16 text-zinc-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p class="text-zinc-500 font-medium">No se encontraron usuarios</p>
          <p class="text-zinc-600 text-sm mt-1">
            Intenta ajustar los filtros o crea un nuevo usuario
          </p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-[#0d111a] border-b border-white/[0.06]">
                <th
                  class="px-6 py-3.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                >
                  Usuario
                </th>
                <th
                  class="px-6 py-3.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                >
                  Rol
                </th>
                <th
                  class="px-6 py-3.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                >
                  Estado
                </th>
                <th
                  class="px-6 py-3.5 text-center font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.04]">
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="hover:bg-[#0d111a]/50 transition"
              >
                <!-- Usuario -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold text-white shrink-0',
                        getAvatarColor(user.rol),
                      ]"
                    >
                      {{ getInitials(user.nombres, user.apellidos) }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-zinc-100 truncate">
                        {{ user.nombres }} {{ user.apellidos }}
                      </p>
                      <p class="text-xs text-zinc-500 truncate">{{ user.correo }}</p>
                    </div>
                  </div>
                </td>
                <!-- Rol -->
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold',
                      getRoleInfo(user.rol).color,
                    ]"
                  >
                    <span :class="['w-1.5 h-1.5 rounded-full', getRoleInfo(user.rol).dotColor]" />
                    {{ getRoleInfo(user.rol).label }}
                  </span>
                </td>
                <!-- Estado -->
                <td class="px-6 py-4">
                  <button
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold cursor-pointer transition hover:opacity-80',
                      user.activo
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-red-500/10 text-red-300',
                    ]"
                    @click="handleToggleStatus(user)"
                  >
                    <span
                      :class="[
                        'w-1.5 h-1.5 rounded-full',
                        user.activo ? 'bg-emerald-500' : 'bg-red-400',
                      ]"
                    />
                    {{ user.activo ? 'Activo' : 'Inactivo' }}
                  </button>
                </td>
                <!-- Acciones -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-200 bg-amber-400/[0.08] hover:bg-amber-400/[0.12] rounded-lg transition"
                      @click="editUser(user)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </button>
                    <button
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/15 rounded-lg transition"
                      @click="openDeleteModal(user)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer con conteo -->
        <div
          v-if="filteredUsers.length > 0"
          class="px-6 py-3 bg-[#0d111a] border-t border-white/[0.06] text-xs text-zinc-500"
        >
          Mostrando {{ filteredUsers.length }} de {{ users.length }} usuarios
        </div>
      </div>

      <!-- ========== MODAL CREAR / EDITAR USUARIO ========== -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal" />

            <!-- Modal -->
            <div
              class="relative bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-md flex items-center justify-center',
                      editingUser ? 'bg-amber-400/10' : 'bg-amber-400/[0.08]',
                    ]"
                  >
                    <svg
                      v-if="!editingUser"
                      class="w-5 h-5 text-amber-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-5 h-5 text-amber-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 class="font-display text-base uppercase tracking-tight text-zinc-100">
                      {{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}
                    </h2>
                    <p class="text-xs text-zinc-500">
                      {{
                        editingUser
                          ? 'Modifica los datos del usuario'
                          : 'Completa los datos para crear un usuario'
                      }}
                    </p>
                  </div>
                </div>
                <button
                  class="p-2 text-zinc-600 hover:text-zinc-400 hover:bg-[#0b0e14] rounded-lg transition"
                  @click="closeModal"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Form -->
              <form class="p-6 space-y-5" @submit.prevent="saveUser">
                <!-- Avatar preview -->
                <div class="flex justify-center">
                  <div
                    :class="[
                      'w-16 h-16 rounded-md flex items-center justify-center text-xl font-bold text-white transition-all',
                      getAvatarColor(form.rol),
                    ]"
                  >
                    {{ form.nombres ? getInitials(form.nombres, form.apellidos) : '?' }}
                  </div>
                </div>

                <!-- Nombre completo -->
                <div class="grid grid-cols-2 gap-3">
                  <!-- Nombre -->
                  <div>
                    <label
                      class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
                    >
                      Nombre
                      <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="form.nombres"
                      type="text"
                      required
                      placeholder="Ej: Carlos"
                      class="w-full px-4 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition placeholder:text-zinc-600"
                    />
                  </div>
                  <!-- Apellido -->
                  <div>
                    <label
                      class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
                    >
                      Apellido
                      <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="form.apellidos"
                      type="text"
                      required
                      placeholder="Ej: Pérez"
                      class="w-full px-4 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <!-- Email -->
                <div>
                  <label
                    class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
                  >
                    Correo electrónico
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.correo"
                    type="email"
                    required
                    placeholder="Ej: carlos@ibv.com"
                    class="w-full px-4 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition placeholder:text-zinc-600"
                  />
                </div>

                <!-- Contraseña (solo al crear) -->
                <div v-if="!editingUser">
                  <label
                    class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
                  >
                    Contraseña
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="form.password"
                      :type="showPassword ? 'text' : 'password'"
                      required
                      placeholder="Mínimo 4 caracteres"
                      minlength="4"
                      class="w-full px-4 py-2.5 pr-12 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                      @click="showPassword = !showPassword"
                    >
                      <svg
                        v-if="!showPassword"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Rol del sistema -->
                <div>
                  <label
                    class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
                  >
                    Rol del sistema
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="grid grid-cols-1 gap-2.5">
                    <label
                      v-for="role in SYSTEM_ROLES"
                      :key="role.value"
                      :class="[
                        'flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all',
                        form.rol === role.value
                          ? 'border-amber-400/60 bg-amber-400/[0.08] shadow-md'
                          : 'border-white/[0.08] hover:border-amber-400/40 hover:bg-[#0d111a]',
                      ]"
                    >
                      <input v-model="form.rol" type="radio" :value="role.value" class="sr-only" />
                      <div
                        :class="[
                          'w-10 h-10 rounded-md flex items-center justify-center shrink-0 transition-all',
                          form.rol === role.value
                            ? role.color.replace('100', '100')
                            : 'bg-[#0b0e14]',
                        ]"
                      >
                        <span
                          :class="[
                            'w-2.5 h-2.5 rounded-full',
                            form.rol === role.value ? role.dotColor : 'bg-zinc-600',
                          ]"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p
                          :class="[
                            'text-sm font-bold',
                            form.rol === role.value ? 'text-amber-200' : 'text-zinc-100',
                          ]"
                        >
                          {{ role.label }}
                        </p>
                        <p class="text-xs text-zinc-400 mt-0.5">{{ role.description }}</p>
                      </div>
                      <div class="shrink-0">
                        <div
                          v-if="form.rol === role.value"
                          class="w-6 h-6 bg-amber-400 rounded-md flex items-center justify-center"
                        >
                          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fill-rule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                        <div v-else class="w-6 h-6 border-2 border-white/[0.12] rounded-full" />
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Estado -->
                <div>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      v-model="form.activo"
                      type="checkbox"
                      class="w-4 h-4 text-amber-300 rounded border-white/[0.12] focus:ring-amber-400"
                    />
                    <span class="text-sm font-semibold text-zinc-200">Usuario activo</span>
                  </label>
                  <p class="text-xs text-zinc-600 mt-2">El usuario podrá acceder al sistema</p>
                </div>

                <!-- Error -->
                <div
                  v-if="formError"
                  class="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-300"
                >
                  <svg
                    class="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ formError }}
                </div>

                <!-- Botones -->
                <div class="flex gap-3 pt-2">
                  <button
                    type="button"
                    class="flex-1 px-5 py-2.5 bg-[#0b0e14] text-zinc-200 font-semibold rounded-md hover:bg-white/[0.06] transition text-sm"
                    @click="closeModal"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    :disabled="saving"
                    :class="[
                      'flex-1 px-5 py-2.5 font-semibold rounded-md transition text-sm flex items-center justify-center gap-2',
                      saving
                        ? 'bg-white/[0.12] text-zinc-500 cursor-not-allowed'
                        : editingUser
                          ? 'bg-amber-400 text-black hover:bg-amber-600 shadow-sm'
                          : 'bg-amber-400 text-black hover:bg-amber-300 shadow-sm',
                    ]"
                  >
                    <div
                      v-if="saving"
                      class="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    {{ saving ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Usuario' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ========== MODAL CONFIRMAR ELIMINACIÓN ========== -->
      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeDeleteModal" />
            <div
              class="relative bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 w-full max-w-sm p-6 text-center"
            >
              <div
                class="w-14 h-14 bg-red-500/10 rounded-md flex items-center justify-center mx-auto mb-4"
              >
                <svg
                  class="w-7 h-7 text-red-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 class="font-display text-base uppercase tracking-tight text-zinc-100 mb-1">
                Eliminar Usuario
              </h3>
              <p class="text-sm text-zinc-500 mb-6">
                ¿Estás seguro de eliminar a
                <span class="font-semibold text-zinc-200">
                  {{ userToDelete?.nombres }} {{ userToDelete?.apellidos }}
                </span>
                ? Esta acción no se puede deshacer.
              </p>
              <div class="flex gap-3">
                <button
                  class="flex-1 px-4 py-2.5 bg-[#0b0e14] text-zinc-200 font-semibold rounded-md hover:bg-white/[0.06] transition text-sm"
                  @click="closeDeleteModal"
                >
                  Cancelar
                </button>
                <button
                  :disabled="saving"
                  class="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition text-sm"
                  @click="confirmDelete"
                >
                  {{ saving ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </ClientOnly>
</template>
