import axios, { type AxiosInstance } from 'axios'

let apiClient: AxiosInstance | null = null

export const getApiClient = (): AxiosInstance => {
  if (apiClient) return apiClient

  const config = useRuntimeConfig()
  apiClient = axios.create({
    baseURL: config.public.apiBase,
    timeout: 10000,
  })

  // Interceptor para agregar token a cada peticion en cliente
  apiClient.interceptors.request.use((request) => {
    if (process.client) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        request.headers.Authorization = `Bearer ${token}`
      }
    }
    return request
  })

  return apiClient
}
