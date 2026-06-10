export interface ApiUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'porteria' | 'recibidor' | 'inventario' | 'despachador' | 'cliente'
  is_active: boolean
  date_joined?: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'porteria' | 'recibidor' | 'inventario' | 'despachador' | 'cliente'
  status: 'active' | 'inactive'
  createdAt?: string
  password?: string
}

export interface Vehicle {
  id: string
  bin: string
  qrCode: string
  model: string
  color: string
  status: 'pending' | 'received' | 'imprinted' | 'inventoried' | 'dispatched'
  createdAt: string
}

export interface Imprint {
  id: string
  vehicleId: string
  photoUrl: string
  data: Record<string, unknown>
  createdAt: string
  status: 'completed' | 'pending'
}

export interface Inventory {
  id: string
  vehicleId: string
  checklist: Record<string, boolean>
  completed: boolean
  createdAt: string
}

export interface Dispatch {
  id: string
  date: string
  vehicles: string[]
  status: 'pending' | 'completed'
  createdAt: string
}
