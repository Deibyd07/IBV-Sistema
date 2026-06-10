import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  if (!authStore.user) {
    await authStore.loadUser()
  }

  if (authStore.user?.role !== 'recibidor' && authStore.user?.role !== 'admin') {
    return navigateTo('/')
  }
})
