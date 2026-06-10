<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { supabaseRoleService } from '~/services/supabaseRoleService'

definePageMeta({
  layout: 'admin',
})

interface Permission {
  key: string
  label: string
  allowed: boolean
}

interface Role {
  id: number
  name: string
  description: string
  icon: string
  iconBg: string
  headerBg: string
  usersCount: number
  permissions: Permission[]
}

const showModal = ref(false)
const editingRole = ref<Role | null>(null)
const roles = ref<Role[]>([])
const loading = ref(false)
const saving = ref(false)
const expandedRoles = ref<Record<number, boolean>>({})

interface PermissionModules {
  [module: string]: Permission[]
}

const editablePermissions = ref<PermissionModules>({})

const buildEditablePermissions = (
  modules: Record<string, Array<{ key: string; label: string }>>
): PermissionModules => {
  const mapped: PermissionModules = {}
  for (const [module, perms] of Object.entries(modules)) {
    mapped[module] = perms.map((perm) => ({
      key: perm.key,
      label: perm.label,
      allowed: false,
    }))
  }
  return mapped
}

const countAllowed = (perms: Permission[]) => perms.filter((p) => p.allowed).length
const hasAllAllowed = (perms: Permission[]) => perms.every((p) => p.allowed)

const roleForm = reactive({
  name: '',
  description: '',
})

// Cargar roles desde Supabase
const loadRoles = async () => {
  try {
    loading.value = true
    roles.value = await supabaseRoleService.getAllRolesWithUsers()
  } catch (err: any) {
    console.error('Error cargando roles:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRoles()
})

const openCreateRole = () => {
  editingRole.value = null
  roleForm.name = ''
  roleForm.description = ''
  editablePermissions.value = buildEditablePermissions(supabaseRoleService.getPermissionModules())
  showModal.value = true
}

const editRole = async (role: Role) => {
  editingRole.value = role
  roleForm.name = role.name
  roleForm.description = role.description || ''

  // Cargar permisos del rol
  try {
    const permissions = await supabaseRoleService.getRolePermissions(role.id)
    editablePermissions.value = structuredClone(permissions)
  } catch (err) {
    console.error('Error cargando permisos:', err)
    editablePermissions.value = buildEditablePermissions(supabaseRoleService.getPermissionModules())
  }

  showModal.value = true
}

const togglePermission = (module: string, permissionKey: string) => {
  if (editablePermissions.value[module]) {
    const perm = editablePermissions.value[module].find((p: Permission) => p.key === permissionKey)
    if (perm) {
      perm.allowed = !perm.allowed
    }
  }
}

const toggleAllInModule = (module: string) => {
  if (editablePermissions.value[module]) {
    const allAllowed = editablePermissions.value[module].every((p: Permission) => p.allowed)
    editablePermissions.value[module].forEach((p: Permission) => {
      p.allowed = !allAllowed
    })
  }
}

const saveRole = async () => {
  if (!roleForm.name.trim()) {
    return
  }

  try {
    saving.value = true

    if (editingRole.value) {
      // Actualizar rol existente
      const updateResult = await supabaseRoleService.updateRole(editingRole.value.id, {
        nombre: roleForm.name,
        descripcion: roleForm.description,
      })

      if (!updateResult) {
        throw new Error('Error al actualizar el rol')
      }

      // Actualizar permisos
      const permResult = await supabaseRoleService.updateRolePermissions(
        editingRole.value.id,
        editablePermissions.value
      )

      if (!permResult) {
        throw new Error('Error al guardar los permisos')
      }
    } else {
      // Crear nuevo rol
      const newRole = await supabaseRoleService.createRole(
        roleForm.name,
        roleForm.description,
        editablePermissions.value
      )

      if (!newRole) {
        throw new Error('Error al crear el rol')
      }
    }

    showModal.value = false
    await loadRoles()
  } catch (err: any) {
    console.error('Error guardando rol:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ClientOnly>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
            ADM — Módulo Administración
          </p>
          <h1 class="font-display text-2xl uppercase tracking-tight text-zinc-100">
            Roles y Permisos
          </h1>
          <p class="text-zinc-500 mt-2">Administra los roles del sistema y sus permisos</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            @click="loadRoles"
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
          <button
            class="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 text-black font-semibold rounded-md hover:shadow-lg transition-all shadow-md"
            @click="openCreateRole"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Rol
          </button>
        </div>
      </div>

      <!-- Roles Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="role in roles"
          :key="role.id"
          class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden hover:shadow-md transition-shadow"
        >
          <!-- Role Header -->
          <div :class="['px-6 py-4 border-b', role.headerBg]">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  :class="['w-10 h-10 rounded-lg flex items-center justify-center', role.iconBg]"
                >
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span class="w-5 h-5" v-html="role.icon" />
                </div>
                <div>
                  <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100">
                    {{ role.name }}
                  </h3>
                  <p class="text-xs text-zinc-500">{{ role.usersCount }} usuarios</p>
                </div>
              </div>
              <div class="flex gap-1">
                <button
                  class="p-1.5 text-zinc-600 hover:text-amber-300 hover:bg-amber-400/[0.08] rounded-lg transition"
                  @click="editRole(role)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Permisos -->
          <div class="px-6 py-4">
            <p class="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">
              Permisos
            </p>

            <!-- Permisos Visibles -->
            <div class="space-y-2.5">
              <div
                v-for="perm in expandedRoles[role.id]
                  ? role.permissions
                  : role.permissions.slice(0, 3)"
                :key="perm.key"
                class="flex items-center justify-between animate-in fade-in duration-200"
              >
                <div class="flex items-center gap-2">
                  <svg
                    v-if="perm.allowed"
                    class="w-4 h-4 text-emerald-400"
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
                  <svg
                    v-else
                    class="w-4 h-4 text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span :class="['text-sm', perm.allowed ? 'text-zinc-200' : 'text-zinc-600']">
                    {{ perm.label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Botón Ver Más/Menos -->
            <button
              v-if="role.permissions.length > 3"
              type="button"
              class="mt-3 w-full py-2 text-xs font-semibold text-amber-300 bg-amber-400/[0.08] rounded-md hover:bg-amber-400/[0.12] transition"
              @click="expandedRoles[role.id] = !expandedRoles[role.id]"
            >
              {{
                expandedRoles[role.id] ? '▲ Ver menos' : `▼ Ver ${role.permissions.length - 3} más`
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Crear/Editar Rol -->
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-[#0d111a] to-[#10141c]"
          >
            <div>
              <h2 class="font-display text-lg uppercase tracking-tight text-zinc-100">
                {{ editingRole ? 'Editar Rol' : 'Crear Nuevo Rol' }}
              </h2>
              <p class="text-sm text-zinc-500 mt-1">
                Configura el nombre, descripción y permisos del rol
              </p>
            </div>
            <button
              class="text-zinc-600 hover:text-zinc-400 transition p-2 hover:bg-[#0b0e14] rounded-lg"
              @click="showModal = false"
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

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <!-- Nombre del rol -->
            <div>
              <label
                class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
              >
                Nombre del Rol
              </label>
              <input
                v-model="roleForm.name"
                type="text"
                required
                placeholder="Ej: Gestor de Inventario"
                class="w-full px-4 py-3 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70 transition text-sm bg-[#0d111a] focus:bg-[#10141c]"
              />
            </div>

            <!-- Descripción -->
            <div>
              <label
                class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
              >
                Descripción
              </label>
              <textarea
                v-model="roleForm.description"
                rows="3"
                placeholder="Describe las responsabilidades y funciones de este rol"
                class="w-full px-4 py-3 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70 transition text-sm resize-none bg-[#0d111a] focus:bg-[#10141c]"
              />
            </div>

            <!-- Permisos por módulo -->
            <div>
              <label class="block text-sm font-semibold text-zinc-200 mb-4">
                Permisos por Categoría
              </label>
              <div class="space-y-3">
                <div
                  v-for="(perms, module) in editablePermissions"
                  :key="module"
                  class="border border-white/[0.08] rounded-lg overflow-hidden hover:border-white/[0.12] transition-colors bg-[#10141c]"
                >
                  <!-- Encabezado de categoría -->
                  <div
                    class="bg-gradient-to-r from-[#0d111a] to-[#0b0e14] px-5 py-3.5 border-b border-white/[0.08]"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full bg-amber-400" />
                        <span class="text-sm font-bold text-zinc-100">{{ module }}</span>
                        <span class="text-xs bg-white/[0.06] text-zinc-400 px-2 py-1 rounded-sm">
                          {{ countAllowed(perms) }}/{{ perms.length }}
                        </span>
                      </div>
                      <button
                        type="button"
                        class="text-xs px-3 py-1.5 bg-amber-400 text-black rounded-md hover:bg-amber-300 transition font-medium"
                        @click="toggleAllInModule(module)"
                      >
                        {{ hasAllAllowed(perms) ? '✓ Todo' : '○ Todo' }}
                      </button>
                    </div>
                  </div>

                  <!-- Permisos -->
                  <div class="px-5 py-4 grid grid-cols-2 gap-3.5">
                    <label
                      v-for="perm in perms"
                      :key="perm.key"
                      class="flex items-center gap-2.5 cursor-pointer group px-2.5 py-2 rounded-md hover:bg-amber-400/[0.08] transition"
                    >
                      <input
                        :checked="perm.allowed"
                        type="checkbox"
                        class="w-4 h-4 rounded border-white/[0.12] text-amber-300 focus:ring-2 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                        @change="togglePermission(module, perm.key)"
                      />
                      <span class="text-sm text-zinc-200 group-hover:text-amber-200 transition">
                        {{ perm.label }}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-white/[0.06] bg-[#0d111a] flex gap-3">
            <button
              :disabled="saving"
              class="flex-1 py-3 bg-amber-400 text-black font-semibold rounded-md hover:shadow-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              @click="saveRole"
            >
              <span v-if="saving" class="inline-block animate-spin">⟳</span>
              <span v-if="!saving">
                {{ editingRole ? 'Guardar Cambios' : 'Crear Rol' }}
              </span>
            </button>
            <button
              :disabled="saving"
              type="button"
              class="px-6 py-3 bg-white/[0.06] text-zinc-200 font-semibold rounded-md hover:bg-white/[0.12] transition text-sm disabled:opacity-50"
              @click="showModal = false"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
