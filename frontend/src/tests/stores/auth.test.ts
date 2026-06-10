import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  // ─── Initial state ────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('starts unauthenticated when localStorage is empty', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
    })

    it('restores session from localStorage', () => {
      const mockUser = {
        email: 'admin@ibv.com',
        name: 'Carlos Administrador',
        role: 'admin',
        roleLabel: 'Administrador',
        redirect: '/admin',
        avatar: 'CA',
      }
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      localStorage.setItem('auth_token', 'test-token')

      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(true)
      expect(store.user?.name).toBe('Carlos Administrador')
    })
  })

  // ─── login ────────────────────────────────────────────────────────────────
  describe('login()', () => {
    it('authenticates an admin user and returns the redirect path', async () => {
      const store = useAuthStore()
      const redirect = await store.login('admin@ibv.com', 'cualquier_pass')
      expect(redirect).toBe('/admin')
      expect(store.isAuthenticated).toBe(true)
      expect(store.user?.role).toBe('admin')
    })

    it('is case-insensitive for email', async () => {
      const store = useAuthStore()
      await store.login('ADMIN@IBV.COM', 'pass1234')
      expect(store.user?.role).toBe('admin')
    })

    it('authenticates a recibidor user and returns /recibidor', async () => {
      const store = useAuthStore()
      const redirect = await store.login('recibidor@ibv.com', 'pass1234')
      expect(redirect).toBe('/recibidor')
    })

    it('throws on unknown email', async () => {
      const store = useAuthStore()
      await expect(store.login('unknown@ibv.com', 'pass1234')).rejects.toThrow(
        'Credenciales inválidas'
      )
    })

    it('throws when password is too short (< 4 chars)', async () => {
      const store = useAuthStore()
      await expect(store.login('admin@ibv.com', '12')).rejects.toThrow('Credenciales inválidas')
    })

    it('persists the session token to localStorage', async () => {
      const store = useAuthStore()
      await store.login('admin@ibv.com', 'pass1234')
      expect(localStorage.getItem('auth_token')).not.toBe('')
      const stored = JSON.parse(localStorage.getItem('auth_user') || 'null')
      expect(stored?.role).toBe('admin')
    })
  })

  // ─── logout ───────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('clears user data and isAuthenticated becomes false', async () => {
      const store = useAuthStore()
      await store.login('admin@ibv.com', 'pass1234')
      store.logout()
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
    })

    it('removes session from localStorage', async () => {
      const store = useAuthStore()
      await store.login('admin@ibv.com', 'pass1234')
      store.logout()
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('auth_user')).toBeNull()
    })
  })

  // ─── Multiple roles ───────────────────────────────────────────────────────
  describe('role-based redirects', () => {
    const cases: [string, string][] = [
      ['admin@ibv.com', '/admin'],
      ['recibidor@ibv.com', '/recibidor'],
      ['inventario@ibv.com', '/inventario'],
      ['despachador@ibv.com', '/despachador'],
      ['porteria@ibv.com', '/porteria'],
    ]

    it.each(cases)('%s redirects to %s', async (email, expectedRedirect) => {
      const store = useAuthStore()
      const redirect = await store.login(email, 'password123')
      expect(redirect).toBe(expectedRedirect)
    })
  })
})
