/**
 * Servicio para obtener datos del dashboard directamente desde Supabase
 * Reemplaza las llamadas al backend API (/api/vehicles/, /api/stats/, /api/activities/)
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const getSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}

export interface VehicleData {
  id: number
  bin: string
  qr_codigo: string
  placa: string | null
  buque_id: number | null
  modelo_id: number | null
  color: string | null
  estado: string | null
  fecha_registro: string
  created_at: string
  updated_at: string
  buque?: { nombre: string; identificacion: string } | null
  modelo?: { marca: string; modelo: string; anio: number; tipo: string } | null
}

export interface DashboardStats {
  total_vehiculos: number
  en_impronta: number
  en_inventario: number
  listos_despacho: number
  despachados: number
  problemas_encontrados: number
}

export interface ActivityItem {
  id: number
  description: string
  timestamp: string
  user?: { nombres: string; apellidos: string } | null
  role: string
  type: string
}

export interface WeeklyTrendItem {
  label: string
  values: [number, number]
}

export interface WeeklyTrends {
  days: WeeklyTrendItem[]
  series: { label: string; color: string }[]
}

export const supabaseDataService = {
  /**
   * Obtiene todos los vehÃ­culos con sus relaciones
   */
  async getVehicles(): Promise<VehicleData[]> {
    const $supabase = getSupabase()

    const { data, error } = await $supabase
      .from('vehiculos')
      .select(
        `
        *,
        buque:buques(nombre, identificacion),
        modelo:modelos_vehiculo(marca, modelo, anio, tipo)
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo vehÃ­culos:', error)
      return []
    }

    return (data || []) as VehicleData[]
  },

  /**
   * Calcula las estadÃ­sticas del dashboard a partir de los vehÃ­culos
   */
  async getDashboardStats(startIso?: string): Promise<DashboardStats> {
    const $supabase = getSupabase()
    const baseQuery = () => {
      let query = $supabase.from('vehiculos').select('id', { count: 'exact', head: true })
      if (startIso) query = query.gte('fecha_registro', startIso)
      return query
    }

    try {
      const [totalRes, improntaRes, inventarioRes, listosRes, despachadosRes, problemasRes] =
        await Promise.all([
          baseQuery(),
          baseQuery().in('estado', ['en_impronta', 'impronta']),
          baseQuery().in('estado', ['en_inventario', 'inventario']),
          baseQuery().in('estado', ['listo_despacho', 'listo', 'aprobado']),
          baseQuery().in('estado', ['despachado', 'entregado']),
          baseQuery().in('estado', ['problema', 'rechazado', 'daÃ±ado', 'danado']),
        ])

      return {
        total_vehiculos: totalRes.count || 0,
        en_impronta: improntaRes.count || 0,
        en_inventario: inventarioRes.count || 0,
        listos_despacho: listosRes.count || 0,
        despachados: despachadosRes.count || 0,
        problemas_encontrados: problemasRes.count || 0,
      }
    } catch (error) {
      console.error('[getDashboardStats] Error from Supabase:', error)
      return {
        total_vehiculos: 0,
        en_impronta: 0,
        en_inventario: 0,
        listos_despacho: 0,
        despachados: 0,
        problemas_encontrados: 0,
      }
    }
  },

  /**
   * Obtiene las actividades recientes combinando múltiples tablas
   */
  async getActivities(limit: number = 5, startIso?: string): Promise<ActivityItem[]> {
    const $supabase = getSupabase()
    const activities: ActivityItem[] = []

    // Obtener improntas recientes
    let improntasQuery = $supabase
      .from('improntas')
      .select('id, fecha, estado, usuario:usuarios!usuario_id(nombres, apellidos)')
      .order('fecha', { ascending: false })
      .limit(limit)

    if (startIso) improntasQuery = improntasQuery.gte('fecha', startIso)

    const { data: improntas } = await improntasQuery

    if (improntas) {
      for (const imp of improntas) {
        const usuario = imp.usuario as any
        activities.push({
          id: imp.id,
          description: `realizó impronta (${imp.estado || 'completada'})`,
          timestamp: imp.fecha,
          user: usuario ? { nombres: usuario.nombres, apellidos: usuario.apellidos } : null,
          role: 'recibidor',
          type: 'impronta',
        })
      }
    }

    // Obtener inventarios recientes
    let inventariosQuery = $supabase
      .from('inventarios')
      .select('id, fecha, completo, usuario:usuarios!usuario_id(nombres, apellidos)')
      .order('fecha', { ascending: false })
      .limit(limit)

    if (startIso) inventariosQuery = inventariosQuery.gte('fecha', startIso)

    const { data: inventarios } = await inventariosQuery

    if (inventarios) {
      for (const inv of inventarios) {
        const usuario = inv.usuario as any
        activities.push({
          id: inv.id + 10000,
          description: `${inv.completo ? 'completó' : 'inició'} inventario`,
          timestamp: inv.fecha,
          user: usuario ? { nombres: usuario.nombres, apellidos: usuario.apellidos } : null,
          role: 'inventario',
          type: 'inventario',
        })
      }
    }

    // Obtener despachos recientes
    let despachosQuery = $supabase
      .from('despachos')
      .select(
        'id, fecha, estado, cantidad_vehiculos, usuario:usuarios!usuario_id(nombres, apellidos)'
      )
      .order('fecha', { ascending: false })
      .limit(limit)

    if (startIso) despachosQuery = despachosQuery.gte('fecha', startIso)

    const { data: despachos } = await despachosQuery

    if (despachos) {
      for (const desp of despachos) {
        const usuario = desp.usuario as any
        activities.push({
          id: desp.id + 20000,
          description: `despachó ${desp.cantidad_vehiculos} vehículos (${desp.estado || 'en proceso'})`,
          timestamp: desp.fecha,
          user: usuario ? { nombres: usuario.nombres, apellidos: usuario.apellidos } : null,
          role: 'despachador',
          type: 'despacho',
        })
      }
    }

    // Obtener movimientos de portería recientes
    let movimientosQuery = $supabase
      .from('movimientos_porteria')
      .select(
        'id, tipo, persona, fecha, observacion, usuario:usuarios!usuario_id(nombres, apellidos)'
      )
      .order('fecha', { ascending: false })
      .limit(limit)

    if (startIso) movimientosQuery = movimientosQuery.gte('fecha', startIso)

    const { data: movimientos } = await movimientosQuery

    if (movimientos) {
      for (const mov of movimientos) {
        const usuario = mov.usuario as any
        activities.push({
          id: mov.id + 30000,
          description: `registró movimiento ${mov.tipo}${mov.persona ? ` - ${mov.persona}` : ''}`,
          timestamp: mov.fecha,
          user: usuario ? { nombres: usuario.nombres, apellidos: usuario.apellidos } : null,
          role: 'porteria',
          type: 'porteria',
        })
      }
    }

    // Ordenar por fecha desc y limitar
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return activities.slice(0, limit)
  },

  /**
   * Obtiene tendencia semanal de recibidos vs. despachados (ultimos N dias)
   */
  async getWeeklyTrends(days: number = 7, startIso?: string): Promise<WeeklyTrends> {
    const $supabase = getSupabase()
    const endDate = new Date()
    const startDate = startIso ? new Date(startIso) : new Date()
    if (!startIso) {
      startDate.setDate(endDate.getDate() - (days - 1))
    }

    const resolvedStartIso = startDate.toISOString()
    const totalDays = startIso
      ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1)
      : days

    const [vehiculosRes, despachosRes] = await Promise.all([
      $supabase.from('vehiculos').select('fecha_registro').gte('fecha_registro', resolvedStartIso),
      $supabase
        .from('despachos')
        .select('fecha, cantidad_vehiculos')
        .gte('fecha', resolvedStartIso),
    ])

    const receivedCounts = new Map<string, number>()
    const dispatchedCounts = new Map<string, number>()

    if (vehiculosRes.data) {
      for (const v of vehiculosRes.data as Array<{ fecha_registro: string }>) {
        const key = new Date(v.fecha_registro).toISOString().slice(0, 10)
        receivedCounts.set(key, (receivedCounts.get(key) || 0) + 1)
      }
    }

    if (despachosRes.data) {
      for (const d of despachosRes.data as Array<{ fecha: string; cantidad_vehiculos: number }>) {
        const key = new Date(d.fecha).toISOString().slice(0, 10)
        dispatchedCounts.set(key, (dispatchedCounts.get(key) || 0) + (d.cantidad_vehiculos || 0))
      }
    }

    const dayLabels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    const dayList: WeeklyTrendItem[] = []
    for (let i = 0; i < totalDays; i += 1) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      const label = dayLabels[d.getDay()]
      dayList.push({
        label,
        values: [receivedCounts.get(key) || 0, dispatchedCounts.get(key) || 0],
      })
    }

    return {
      days: dayList,
      series: [
        { label: 'Recibidos', color: '#38bdf8' },
        { label: 'Despachados', color: '#34d399' },
      ],
    }
  },

  /**
   * Obtiene los buques
   */
  async getBuques() {
    const $supabase = getSupabase()

    const { data, error } = await $supabase
      .from('buques')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo buques:', error)
      return []
    }

    return data || []
  },

  /**
   * Diagnóstico: Verifica si hay datos en la BD
   */
  async checkDatabaseHealth() {
    const $supabase = getSupabase()
    console.log('[checkDatabaseHealth] Iniciando diagnóstico...')

    try {
      // Verificar usuarios
      const { data: usuarios, error: usersError } = await $supabase
        .from('usuarios')
        .select('count', { count: 'exact' })

      console.log('[checkDatabaseHealth] Usuarios:', usuarios, 'Error:', usersError)

      // Verificar vehiculos
      const { data: vehiculos, error: vehiclesError } = await $supabase
        .from('vehiculos')
        .select('count', { count: 'exact' })

      console.log('[checkDatabaseHealth] Vehículos:', vehiculos, 'Error:', vehiclesError)

      // Verificar roles
      const { data: roles, error: rolesError } = await $supabase
        .from('roles')
        .select('count', { count: 'exact' })

      console.log('[checkDatabaseHealth] Roles:', roles, 'Error:', rolesError)

      return {
        usuarios: usuarios?.length || 0,
        vehiculos: vehiculos?.length || 0,
        roles: roles?.length || 0,
      }
    } catch (error) {
      console.error('[checkDatabaseHealth] Excepción:', error)
      return { usuarios: 0, vehiculos: 0, roles: 0 }
    }
  },
}

export default supabaseDataService
