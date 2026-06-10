import { getApiClient } from './api'

export interface UserResponse {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  date_joined: string
}

export interface CreateUserRequest {
  email: string
  first_name: string
  last_name: string
  password: string
  role: 'admin' | 'porteria' | 'recibidor' | 'inventario' | 'despachador' | 'cliente'
}

export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
  role?: string
  is_active?: boolean
}

export const userManagementService = {
  async getAllUsers(): Promise<UserResponse[]> {
    const apiClient = getApiClient()
    const response = await apiClient.get<UserResponse[]>('/users/')
    return response.data
  },

  async getUserById(id: number): Promise<UserResponse> {
    const apiClient = getApiClient()
    const response = await apiClient.get<UserResponse>(`/users/${id}/`)
    return response.data
  },

  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const apiClient = getApiClient()
    const response = await apiClient.post<UserResponse>('/users/', data)
    return response.data
  },

  async updateUser(id: number, data: UpdateUserRequest): Promise<UserResponse> {
    const apiClient = getApiClient()
    const response = await apiClient.patch<UserResponse>(`/users/${id}/`, data)
    return response.data
  },

  async deleteUser(id: number): Promise<void> {
    const apiClient = getApiClient()
    await apiClient.delete(`/users/${id}/`)
  },

  async getRoles() {
    const apiClient = getApiClient()
    const response = await apiClient.get('/roles/')
    return response.data
  },
}

export default userManagementService
