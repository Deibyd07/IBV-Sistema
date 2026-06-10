import { getApiClient } from './api'

export interface Vehicle {
  id: number
  bin: string
  qr_code: string
  modelo_vehiculo?: {
    marca: string
    modelo: string
    año: number
    tipo: string
  }
  estado?: string
  buque_id?: number
  creado_en?: string
  actualizado_en?: string
}

export interface Buque {
  id: number
  nombre: string
  identificacion: string
  fecha_arribo: string
  procedencia: string
  cantidad_vehiculos: number
  estado: string
}

export interface DashboardStats {
  total_vehiculos: number
  en_impronta: number
  en_inventario: number
  listos_despacho: number
  despachados: number
  problemas_encontrados: number
}

export const vehicleService = {
  async getVehicles(): Promise<Vehicle[]> {
    const apiClient = getApiClient()
    const response = await apiClient.get<Vehicle[]>('/vehicles/')
    return response.data
  },

  async getVehicleById(id: number): Promise<Vehicle> {
    const apiClient = getApiClient()
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}/`)
    return response.data
  },

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    const apiClient = getApiClient()
    const response = await apiClient.post<Vehicle>('/vehicles/', data)
    return response.data
  },

  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle> {
    const apiClient = getApiClient()
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}/`, data)
    return response.data
  },

  async getBuques(): Promise<Buque[]> {
    const apiClient = getApiClient()
    const response = await apiClient.get<Buque[]>('/buques/')
    return response.data
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const apiClient = getApiClient()
    const response = await apiClient.get<DashboardStats>('/stats/dashboard/')
    return response.data
  },

  async getActivities(limit: number = 10) {
    const apiClient = getApiClient()
    const response = await apiClient.get('/activities/', { params: { limit } })
    return response.data
  },

  async markAsImpronta(vehicleId: number, data: any) {
    const apiClient = getApiClient()
    const response = await apiClient.post(`/vehicles/${vehicleId}/marcar-impronta/`, data)
    return response.data
  },

  async markAsInventory(vehicleId: number, data: any) {
    const apiClient = getApiClient()
    const response = await apiClient.post(`/vehicles/${vehicleId}/verificar-inventario/`, data)
    return response.data
  },

  async authorizeDespacho(vehicleId: number, data?: any) {
    const apiClient = getApiClient()
    const response = await apiClient.post(`/vehicles/${vehicleId}/autorizar-despacho/`, data)
    return response.data
  },
}

export default vehicleService
