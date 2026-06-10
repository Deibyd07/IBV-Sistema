<script setup lang="ts">
// Layout principal aplicado a todas las páginas
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import NotificationBell from '~/components/notifications/NotificationBell.vue'

const authStore = useAuthStore()
const isAuthenticated = computed(() => !!authStore.user)
</script>

<template>
  <div class="min-h-screen bg-[#0b0e14] text-zinc-100">
    <!-- Header/Navbar -->
    <header class="bg-[#0d111a]/90 backdrop-blur-lg border-b border-white/[0.08] sticky top-0 z-40">
      <nav class="container mx-auto px-4 py-3 flex justify-between items-center">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <img
            src="/logo-ibv-mark.png"
            alt="Sistema IBV"
            class="h-9 w-9 drop-shadow-[0_0_10px_rgba(251,191,36,0.2)]"
          />
          <span class="font-display text-sm uppercase tracking-wide text-zinc-100">
            Sistema
            <span class="text-amber-300">IBV</span>
          </span>
        </NuxtLink>
        <ul class="hidden md:flex gap-6">
          <li>
            <NuxtLink
              to="/"
              class="font-data text-[11px] uppercase tracking-[0.2em] text-zinc-400 hover:text-amber-300 transition"
            >
              Inicio
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/login"
              class="font-data text-[11px] uppercase tracking-[0.2em] text-zinc-400 hover:text-amber-300 transition"
            >
              Login
            </NuxtLink>
          </li>
        </ul>
        <div class="flex items-center gap-4">
          <NotificationBell v-if="isAuthenticated" />
          <button class="md:hidden text-zinc-400 hover:text-zinc-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>
      <div class="hazard h-0.5" />
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 min-h-[calc(100vh-200px)]">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-[#0d111a] border-t border-white/[0.08] mt-12 py-6">
      <div class="container mx-auto px-4 text-center">
        <p class="font-data text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          &copy; 2026 Sistema IBV · Todos los derechos reservados
        </p>
      </div>
    </footer>
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

.hazard {
  background: repeating-linear-gradient(
    -45deg,
    rgba(251, 191, 36, 0.5) 0,
    rgba(251, 191, 36, 0.5) 10px,
    transparent 10px,
    transparent 20px
  );
}
</style>
