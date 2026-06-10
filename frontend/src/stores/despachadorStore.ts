import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'

const getSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}

/**
 * DESPACHADOR STORE
 * Gestiona los vehículos listos para despacho desde Supabase
 * - Traer vehículos con estado "listo_despacho"
 * - Crear despachos
 * - Marcar vehículos como despachados
 */

export interface VehiculoDespacho {
  id: string | number
  bin: string
  qr_codigo: string | null
  color: string | null
  estado: string
  usuario_recibe_id: string | null
  modelo_id: string | number
  buque_id: string | number | null
  modelo?: {
    id: string | number
    marca: string
    modelo: string
    anio: number
  } | null
  cliente?: string | null
  fecha_recepcion?: string
  hora_recepcion?: string
}

interface DespachoResultado {
  success: boolean
  error?: string
  despacho_id?: string | number
}

export const useDespachadorStore = defineStore('despachador', () => {
  // State
  const vehiculosListos = ref<VehiculoDespacho[]>([])
  const vehiculosDespachados = ref<VehiculoDespacho[]>([]) // Guardar los despachados
  const despachados = ref<string[]>([]) // IDs de vehículos ya despachados
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const totalListosParaDespacho = computed(() => vehiculosListos.value.length)

  const totalDespachados = computed(() => vehiculosDespachados.value.length)

  const vehiculosPendienteDespacho = computed(() =>
    vehiculosListos.value.filter((v) => !despachados.value.includes(String(v.id)))
  )

  // Métodos
  /**
   * Cargar vehículos listos para despacho desde Supabase
   * - Estado = 'listo_despacho'
   * - Con datos de modelo para mostrar marca/modelo
   */
  const load = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await getSupabase()
        .from('vehiculos')
        .select(
          `
          id,
          bin,
          qr_codigo,
          color,
          estado,
          usuario_recibe_id,
          modelo_id,
          buque_id,
          modelos_vehiculo:modelo_id (
            id,
            marca,
            modelo,
            anio
          )
        `
        )
        .eq('estado', 'listo_despacho')
        .order('created_at', { ascending: false })

      if (err) {
        console.error('Error cargando vehículos para despacho:', err)
        error.value = `Error: ${err.message}`
        return
      }

      if (!data) {
        vehiculosListos.value = []
        return
      }

      // Normalizar datos
      vehiculosListos.value = (data as unknown as VehiculoDespacho[]).map((row: any) => ({
        id: row.id,
        bin: row.bin || '',
        qr_codigo: row.qr_codigo,
        color: row.color,
        estado: row.estado,
        usuario_recibe_id: row.usuario_recibe_id,
        modelo_id: row.modelo_id,
        buque_id: row.buque_id,
        modelo: Array.isArray(row.modelos_vehiculo)
          ? row.modelos_vehiculo[0]
          : row.modelos_vehiculo,
        cliente: row.cliente || null,
      }))

      console.log(
        `Despachador: Cargados ${vehiculosListos.value.length} vehículos listos para despacho`
      )
    } catch (err) {
      console.error('Error en load():', err)
      error.value = 'Error desconocido al cargar vehículos'
    } finally {
      loading.value = false
    }
  }

  /**
   * Marcar un vehículo como despachado
   * - Cambia estado a 'despachado'
   * - Actualiza estado local
   */
  const despacharVehiculo = async (
    vehiculoId: string | number,
    numeroDespacho?: string
  ): Promise<DespachoResultado> => {
    try {
      // Encontrar el vehículo antes de actualizarlo
      const vehiculo = vehiculosListos.value.find((v) => v.id === vehiculoId)
      if (!vehiculo) {
        return { success: false, error: 'Vehículo no encontrado' }
      }

      // Actualizar estado del vehículo a 'despachado'
      const { error: err } = await (getSupabase() as any)
        .from('vehiculos')
        .update({ estado: 'despachado' })
        .eq('id', vehiculoId)

      if (err) {
        console.error('Error actualizando vehículo:', err)
        return { success: false, error: `Error: ${err.message}` }
      }

      // Actualizar estado local
      despachados.value.push(String(vehiculoId))
      vehiculosDespachados.value.push(vehiculo)

      // Remover de la lista de listos
      vehiculosListos.value = vehiculosListos.value.filter((v) => v.id !== vehiculoId)

      return { success: true, despacho_id: String(vehiculoId) }
    } catch (err) {
      console.error('Error en despacharVehiculo():', err)
      return { success: false, error: 'Error desconocido' }
    }
  }

  /**
   * Buscar vehículo por BIN/VIN en la lista
   */
  const getByBin = (bin: string): VehiculoDespacho | undefined => {
    return vehiculosListos.value.find((v) => v.bin === bin)
  }

  /**
   * Obtener detalles de un vehículo
   */
  const getDetalles = (vehiculoId: string | number) => {
    return vehiculosListos.value.find((v) => v.id === vehiculoId)
  }

  return {
    // State
    vehiculosListos,
    vehiculosDespachados,
    despachados,
    loading,
    error,

    // Computed
    totalListosParaDespacho,
    totalDespachados,
    vehiculosPendienteDespacho,

    // Methods
    load,
    despacharVehiculo,
    getByBin,
    getDetalles,
  }
})
