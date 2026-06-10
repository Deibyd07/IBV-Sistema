<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import NotificationBell from '~/components/notifications/NotificationBell.vue'

const route = useRoute()
const authStore = useAuthStore()
const sidebarOpen = ref(false)

const currentUser = computed(() => {
  const u = authStore.user
  if (!u) {
    return { name: 'Usuario', initials: 'U', role: 'admin', roleName: 'Sin rol' }
  }
  const initials =
    u.name
      ?.split(' ')
      .map((w: string) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U'
  const roleNames: Record<string, string> = {
    admin: 'Administrador',
    recibidor: 'Recibidor',
    inventario: 'Inventario',
    despachador: 'Despachador',
    porteria: 'Portería',
    cliente: 'Cliente',
  }
  return {
    name: u.name || 'Usuario',
    initials,
    role: u.role || 'admin',
    roleName: roleNames[u.role] || u.role || 'Usuario',
  }
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/estadisticas': 'Estadísticas y Reportes',
    '/admin/usuarios': 'Gestión de Usuarios',
    '/admin/roles': 'Roles y Permisos',
    '/admin/notificaciones': 'Centro de Notificaciones',
    '/admin/recepcion': 'Monitoreo Recepción',
    '/admin/inventario': 'Monitoreo Inventario',
    '/admin/despacho': 'Monitoreo Despacho',
    '/admin/auditoria': 'Auditoría y Control',
    '/admin/excepciones': 'Gestión de Excepciones',
    '/recibidor': 'Panel Recibidor',
    '/recibidor/escaneo': 'Recepción de Vehículos',
    '/recibidor/impronta': 'Registro de Impronta',
    '/recibidor/improntas': 'Estado de Improntas',
    '/recibidor/recepciones': 'Recepciones Realizadas',
    '/inventario': 'Panel Inventario',
    '/inventario/checklist': 'Inspección de Vehículo',
    '/despachador': 'Panel Despachador',
    '/despachador/escaneo': 'Escaneo de Lote',
    '/porteria': 'Panel Portería',
  }
  return titles[route.path] || 'Dashboard'
})

const currentModule = computed(() => {
  const path = route.path
  if (path.startsWith('/recibidor')) return 'recibidor'
  if (path.startsWith('/inventario')) return 'inventario'
  if (path.startsWith('/despachador')) return 'despachador'
  if (path.startsWith('/porteria')) return 'porteria'
  if (path.startsWith('/admin')) return 'admin'
  return currentUser.value.role
})

// Identidad de marca: el código de módulo siempre va en amber
const moduleAccent: Record<string, string> = {
  admin: 'text-amber-300',
  recibidor: 'text-amber-300',
  inventario: 'text-amber-300',
  despachador: 'text-amber-300',
  porteria: 'text-amber-300',
}

const moduleCode: Record<string, string> = {
  admin: 'ADM',
  recibidor: 'REC',
  inventario: 'INV',
  despachador: 'DSP',
  porteria: 'PRT',
}

const menuItems = computed(() => {
  const module = currentModule.value
  const allMenus: Record<
    string,
    Array<{ to: string; label: string; icon: string; badge?: number }>
  > = {
    admin: [
      {
        to: '/admin',
        label: 'Dashboard',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
      },
      {
        to: '/admin/estadisticas',
        label: 'Estadísticas',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
      },
      {
        to: '/admin/usuarios',
        label: 'Usuarios',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
      },
      {
        to: '/admin/roles',
        label: 'Roles y Permisos',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>',
      },
      {
        to: '/admin/notificaciones',
        label: 'Notificaciones',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>',
      },
      {
        to: '/admin/recepcion',
        label: 'Recepción',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      },
      {
        to: '/admin/inventario',
        label: 'Inventario',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>',
      },
      {
        to: '/admin/despacho',
        label: 'Despacho',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>',
      },
      {
        to: '/admin/auditoria',
        label: 'Auditoría',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      },
      {
        to: '/admin/excepciones',
        label: 'Excepciones',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
      },
    ],
    recibidor: [
      {
        to: '/recibidor',
        label: 'Panel Recibidor',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
      },
      {
        to: '/recibidor/escaneo',
        label: 'Escaneo',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>',
      },
      {
        to: '/recibidor/recepciones',
        label: 'Recepciones',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>',
      },
      {
        to: '/recibidor/impronta',
        label: 'Nueva Impronta',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m8-8H4" /></svg>',
      },
      {
        to: '/recibidor/improntas',
        label: 'Estado Improntas',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>',
      },
    ],
    inventario: [
      {
        to: '/inventario',
        label: 'Panel Inventario',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
      },
      {
        to: '/inventario/checklist',
        label: 'Inspecciones',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>',
        badge: 3,
      },
    ],
    despachador: [
      {
        to: '/despachador',
        label: 'Panel Despacho',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
      },
      {
        to: '/despachador/escaneo',
        label: 'Escaneo de Lote',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>',
        badge: 2,
      },
    ],
    porteria: [
      {
        to: '/porteria',
        label: 'Panel Portería',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
      },
    ],
  }
  return allMenus[module] || allMenus.admin
})

const isActive = (path: string) => {
  if (path === route.path) return true
  const rolePaths = ['/admin', '/recibidor', '/inventario', '/despachador', '/porteria']
  if (rolePaths.includes(path) && route.path !== path) return false
  if (route.path.startsWith(path) && path !== route.path) return true
  return false
}

const handleLogout = () => {
  authStore.logout()
  navigateTo('/login')
}
</script>

<template>
  <ClientOnly>
    <div class="layout-root min-h-screen bg-[#0b0e14] text-zinc-100">
      <!-- Overlay mobile -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/60 z-40 lg:hidden"
        @click="sidebarOpen = false"
      />

      <!-- ════════ Sidebar ════════ -->
      <aside
        :class="[
          'fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0d111a] border-r border-white/[0.08] transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ]"
      >
        <!-- Logo -->
        <div
          class="h-16 px-5 flex items-center gap-3 border-b border-white/[0.08] shrink-0 bg-[#0d111a]"
        >
          <img
            src="/logo-ibv-mark.png"
            alt="IBV"
            class="h-12 w-12 -ml-1 drop-shadow-[0_0_10px_rgba(251,191,36,0.2)]"
          />
          <div class="leading-none">
            <p class="font-display text-sm text-white tracking-wide">Sistema IBV</p>
            <p
              class="font-data text-[9px] uppercase tracking-[0.25em] mt-1"
              :class="moduleAccent[currentModule] || 'text-amber-300'"
            >
              {{ moduleCode[currentModule] || 'ADM' }} · {{ currentUser.roleName }}
            </p>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <template v-for="item in menuItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              :class="[
                'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border-l-2',
                isActive(item.to)
                  ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                  : 'border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100',
              ]"
              @click="sidebarOpen = false"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span
                class="w-4 h-4 shrink-0 transition-colors"
                :class="
                  isActive(item.to) ? 'text-amber-300' : 'text-zinc-500 group-hover:text-zinc-300'
                "
                v-html="item.icon"
              />
              <span class="flex-1 truncate">{{ item.label }}</span>
              <span
                v-if="item.badge"
                class="font-data text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-sm"
              >
                {{ item.badge }}
              </span>
            </NuxtLink>
          </template>
        </nav>

        <!-- Franja + Logout -->
        <div class="shrink-0">
          <div class="hazard h-1" />
          <div class="px-3 py-4">
            <button
              class="group flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition-all"
              @click="handleLogout"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- ════════ Main ════════ -->
      <div class="lg:pl-64">
        <!-- Header -->
        <header
          class="sticky top-0 z-30 bg-[#0b0e14]/90 backdrop-blur-lg border-b border-white/[0.08] h-16 flex items-center justify-between px-4 sm:px-6"
        >
          <!-- Toggle mobile -->
          <button
            class="lg:hidden text-zinc-400 hover:text-zinc-100 transition p-1"
            @click="sidebarOpen = !sidebarOpen"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <!-- Breadcrumb -->
          <div class="hidden lg:flex items-center gap-3">
            <span
              class="font-data text-[10px] uppercase tracking-[0.25em]"
              :class="moduleAccent[currentModule] || 'text-amber-300'"
            >
              {{ moduleCode[currentModule] || 'ADM' }}
            </span>
            <span class="text-zinc-700" aria-hidden="true">/</span>
            <span class="font-data text-xs uppercase tracking-[0.15em] text-zinc-300">
              {{ pageTitle }}
            </span>
          </div>

          <!-- Right -->
          <div class="flex items-center gap-4 ml-auto">
            <NotificationBell />

            <div class="flex items-center gap-2.5 pl-4 border-l border-white/[0.08]">
              <div
                class="w-8 h-8 bg-amber-400 rounded-md flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
              >
                <span class="font-display text-[11px] text-black font-bold">
                  {{ currentUser.initials }}
                </span>
              </div>
              <div class="hidden sm:block leading-none">
                <p class="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
                  {{ currentUser.name }}
                </p>
                <p class="font-data text-[10px] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">
                  {{ currentUser.roleName }}
                </p>
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] grid-bg">
          <slot />
        </main>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.layout-root {
  font-family: 'Archivo', system-ui, sans-serif;
}

.font-display {
  font-family: 'Archivo Black', 'Archivo', system-ui, sans-serif;
  font-weight: 400;
}

.font-data {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}

.grid-bg {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 40px 40px;
}

.hazard {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(251, 191, 36, 0.7) 0 10px,
    #0d111a 10px 20px
  );
}
</style>
