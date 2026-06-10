import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Interfaz de Usuario
export interface StoreUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'porteria' | 'recibidor' | 'inventario' | 'despachador'
  status: 'active' | 'inactive'
}

// Roles del sistema con metadata
export const SYSTEM_ROLES = [
  {
    value: 'admin',
    label: 'Administrador',
    color: 'bg-amber-400/15 text-amber-300',
    dotColor: 'bg-amber-400',
    description: 'Acceso total al sistema',
  },
  {
    value: 'recibidor',
    label: 'Recibidor',
    color: 'bg-sky-500/15 text-sky-300',
    dotColor: 'bg-sky-500',
    description: 'Recepción e impronta de vehículos',
  },
  {
    value: 'inventario',
    label: 'Inventario',
    color: 'bg-emerald-500/15 text-emerald-300',
    dotColor: 'bg-emerald-500',
    description: 'Inspección y checklist de vehículos',
  },
  {
    value: 'despachador',
    label: 'Despachador',
    color: 'bg-orange-500/15 text-orange-300',
    dotColor: 'bg-orange-500',
    description: 'Despacho y envío de lotes',
  },
  {
    value: 'porteria',
    label: 'Portería',
    color: 'bg-rose-500/15 text-rose-300',
    dotColor: 'bg-rose-500',
    description: 'Control de entrada/salida',
  },
] as const

const STORAGE_KEY = 'ibv_users'

// Datos mock iniciales
const INITIAL_USERS: StoreUser[] = [
  {
    id: '1',
    name: 'Carlos Administrador',
    email: 'admin@ibv.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'María Recibidora',
    email: 'recibidor@ibv.com',
    role: 'recibidor',
    status: 'active',
  },
  {
    id: '3',
    name: 'Juan Inventario',
    email: 'inventario@ibv.com',
    role: 'inventario',
    status: 'active',
  },
  {
    id: '4',
    name: 'Luis Despachador',
    email: 'despachador@ibv.com',
    role: 'despachador',
    status: 'active',
  },
  { id: '5', name: 'Ana Portería', email: 'porteria@ibv.com', role: 'porteria', status: 'active' },
  {
    id: '6',
    name: 'Pedro Inspector',
    email: 'pedro@ibv.com',
    role: 'inventario',
    status: 'active',
  },
  {
    id: '7',
    name: 'Laura Recepción',
    email: 'laura@ibv.com',
    role: 'recibidor',
    status: 'inactive',
  },
  {
    id: '8',
    name: 'Diego Despacho',
    email: 'diego@ibv.com',
    role: 'despachador',
    status: 'active',
  },
]

function loadUsers(): StoreUser[] {
  if (typeof window === 'undefined') return INITIAL_USERS
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      /* fallback */
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS))
  return [...INITIAL_USERS]
}

function persistUsers(list: StoreUser[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }
}

export const useUserStore = defineStore('user', () => {
  const users = ref<StoreUser[]>(loadUsers())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const userCount = computed(() => users.value.length)
  const activeUsers = computed(
    () => users.value.filter((u: StoreUser) => u.status === 'active').length
  )

  const getRoleInfo = (roleValue: string) => {
    return SYSTEM_ROLES.find((r) => r.value === roleValue) || SYSTEM_ROLES[0]
  }

  const fetchUsers = async () => {
    loading.value = true
    error.value = null
    try {
      // Simulamos carga con delay breve
      await new Promise((resolve) => setTimeout(resolve, 300))
      users.value = loadUsers()
    } catch (err) {
      error.value = 'Error al cargar usuarios'
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData: Omit<StoreUser, 'id'>) => {
    loading.value = true
    error.value = null
    try {
      // Verificar email duplicado
      const exists = users.value.some(
        (u: StoreUser) => u.email.toLowerCase() === userData.email.toLowerCase()
      )
      if (exists) {
        throw new Error('Ya existe un usuario con ese email')
      }
      await new Promise((resolve) => setTimeout(resolve, 300))
      const newUser: StoreUser = {
        ...userData,
        id: String(Date.now()),
      }
      users.value.push(newUser)
      persistUsers(users.value)
      return newUser
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al crear usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (id: string, userData: Partial<StoreUser>) => {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      const index = users.value.findIndex((u: StoreUser) => u.id === id)
      if (index === -1) throw new Error('Usuario no encontrado')
      // Verificar email duplicado (excluyendo el usuario actual)
      if (userData.email) {
        const emailExists = users.value.some(
          (u: StoreUser) => u.id !== id && u.email.toLowerCase() === userData.email!.toLowerCase()
        )
        if (emailExists) throw new Error('Ya existe un usuario con ese email')
      }
      users.value[index] = { ...users.value[index], ...userData }
      persistUsers(users.value)
      return users.value[index]
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al actualizar usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      users.value = users.value.filter((u: StoreUser) => u.id !== id)
      persistUsers(users.value)
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al eliminar usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleStatus = async (id: string) => {
    const user = users.value.find((u: StoreUser) => u.id === id)
    if (!user) return
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    return updateUser(id, { status: newStatus })
  }

  return {
    users,
    loading,
    error,
    userCount,
    activeUsers,
    getRoleInfo,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
    SYSTEM_ROLES,
  }
})
