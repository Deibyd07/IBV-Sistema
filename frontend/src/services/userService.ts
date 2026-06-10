import { getApiClient } from './api'
import { formatters } from '../utils/helpers'
import type { ApiUser, User } from '../types/index'

const mapApiUserToUi = (apiUser: ApiUser): User => {
  const nameParts = [apiUser.first_name, apiUser.last_name].filter(Boolean)
  const name = nameParts.length > 0 ? nameParts.join(' ') : apiUser.email
  return {
    id: String(apiUser.id),
    name,
    email: apiUser.email,
    role: apiUser.role,
    status: apiUser.is_active ? 'active' : 'inactive',
    createdAt: apiUser.date_joined ? formatters.date(apiUser.date_joined) : undefined,
  }
}

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const firstName = parts.shift() || ''
  return { first_name: firstName, last_name: parts.join(' ') }
}

export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.get<ApiUser[]>('/users/')
      return response.data.map(mapApiUserToUi)
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async getUser(id: string): Promise<User> {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.get<ApiUser>(`/users/${id}`)
      return mapApiUserToUi(response.data)
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  },

  async createUser(data: Partial<User>): Promise<User> {
    try {
      const apiClient = getApiClient()
      const nameParts = data.name ? splitName(data.name) : { first_name: '', last_name: '' }
      const payload = {
        email: data.email,
        first_name: nameParts.first_name,
        last_name: nameParts.last_name,
        role: data.role || 'admin',
        is_active: data.status ? data.status === 'active' : true,
        password: data.password,
      }
      const response = await apiClient.post<ApiUser>('/users/', payload)
      return mapApiUserToUi(response.data)
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const apiClient = getApiClient()
      const nameParts = data.name ? splitName(data.name) : null
      const payload: Record<string, string | boolean | undefined> = {}

      if (data.email) payload.email = data.email
      if (nameParts) {
        payload.first_name = nameParts.first_name
        payload.last_name = nameParts.last_name
      }
      if (data.role) payload.role = data.role
      if (data.status !== undefined) payload.is_active = data.status === 'active'
      if (data.password) payload.password = data.password

      const response = await apiClient.put<ApiUser>(`/users/${id}`, payload)
      return mapApiUserToUi(response.data)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      const apiClient = getApiClient()
      await apiClient.delete(`/users/${id}`)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  async getRoles() {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.get('/roles/')
      return response.data
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },
}

export default userService
