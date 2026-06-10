import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  if (process.server) return

  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    const restored = await authStore.restoreSession()
    if (!restored) {
      return navigateTo('/login')
    }
  }

  if (!authStore.user) {
    await authStore.loadUser()
  }
})
