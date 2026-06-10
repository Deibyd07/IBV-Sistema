import { getApiClient } from './api'
import type { ApiUser, TokenResponse } from '~/types/index'

export const authService = {
  async login(email: string, password: string): Promise<TokenResponse> {
    const apiClient = getApiClient()
    const response = await apiClient.post<TokenResponse>('/auth/login/', { email, password })
    return response.data
  },

  async getMe(): Promise<ApiUser> {
    const apiClient = getApiClient()
    const response = await apiClient.get<ApiUser>('/auth/me/')
    return response.data
  },

  async logout(): Promise<void> {
    const apiClient = getApiClient()
    await apiClient.post('/auth/logout/')
  },
}

export default authService
