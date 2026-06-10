import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface DañoZona {
  zona: string
  tipo: string
  severidad: 'Baja' | 'Media' | 'Alta'
}

export interface Impronta {
  id: string
  folio: string
  vin: string
  placa: string
  marca: string
  modelo: string
  anio: string
  color: string
  km: string
  cliente: string
  condicion: 'excelente' | 'bueno' | 'regular' | 'dañado' | ''
  zonasDañadas: string[]
  daños: DañoZona[]
  observaciones: string
  fotos: Record<string, string>
  fotosAdicionales: string[]
  estado: 'borrador' | 'completada' | 'revisada'
  creadoPor: string
  fechaCreacion: string
  horaCreacion: string
  fechaActualizacion: string
}

interface ImprontaRow {
  id: string
  folio: string
  vin: string
  placa?: string
  marca: string
  modelo: string
  anio?: string
  color?: string
  km?: string
  cliente?: string
  condicion?: string
  zonas_danadas?: string[]
  danos?: DañoZona[]
  observaciones?: string
  fotos?: Record<string, string>
  fotos_adicionales?: string[]
  estado: 'borrador' | 'completada' | 'revisada'
  creado_por?: string
  fecha_creacion: string
  hora_creacion?: string
  updated_at?: string
}

function mapRowToImpronta(row: ImprontaRow): Impronta {
  return {
    id: row.id,
    folio: row.folio,
    vin: row.vin,
    placa: row.placa || '',
    marca: row.marca,
    modelo: row.modelo,
    anio: row.anio || '',
    color: row.color || '',
    km: row.km || '',
    cliente: row.cliente || '',
    condicion: (row.condicion || '') as Impronta['condicion'],
    zonasDañadas: row.zonas_danadas || [],
    daños: row.danos || [],
    observaciones: row.observaciones || '',
    fotos: row.fotos || {},
    fotosAdicionales: row.fotos_adicionales || [],
    estado: row.estado,
    creadoPor: row.creado_por || '',
    fechaCreacion: row.fecha_creacion,
    horaCreacion: row.hora_creacion?.substring(0, 5) || '',
    fechaActualizacion: row.updated_at?.split('T')[0] || row.fecha_creacion,
  }
}

export const useImprontaStore = defineStore('impronta', () => {
  const { $supabase } = useNuxtApp()
  const supabase = $supabase as SupabaseClient

  const improntas = ref<Impronta[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computados
  const totalImprontas = computed(() => improntas.value.length)
  const completadas = computed(
    () => improntas.value.filter((i) => i.estado === 'completada').length
  )
  const borradores = computed(() => improntas.value.filter((i) => i.estado === 'borrador').length)
  const revisadas = computed(() => improntas.value.filter((i) => i.estado === 'revisada').length)
  const hoy = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return improntas.value.filter((i) => i.fechaCreacion === today).length
  })

  // ===== Fetch =====
  const fetchImprontas = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('improntas_registro')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      improntas.value = ((data || []) as ImprontaRow[]).map(mapRowToImpronta)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al cargar improntas'
      console.error('Error fetchImprontas:', err)
    } finally {
      loading.value = false
    }
  }

  const getById = (id: string): Impronta | undefined => {
    return improntas.value.find((i) => i.id === id)
  }

  const getByFolio = (folio: string): Impronta | undefined => {
    return improntas.value.find((i) => i.folio === folio)
  }

  const crear = async (
    data: Omit<Impronta, 'id' | 'folio' | 'fechaCreacion' | 'horaCreacion' | 'fechaActualizacion'>
  ): Promise<Impronta> => {
    loading.value = true
    error.value = null
    try {
      const insertData = {
        vin: data.vin,
        placa: data.placa,
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio,
        color: data.color,
        km: data.km,
        cliente: data.cliente,
        condicion: data.condicion || '',
        zonas_danadas: data.zonasDañadas,
        danos: data.daños,
        observaciones: data.observaciones,
        fotos: data.fotos,
        fotos_adicionales: data.fotosAdicionales,
        estado: data.estado,
        creado_por: data.creadoPor,
      }

      const { data: rows, error: err } = await supabase
        .from('improntas_registro')
        .insert(insertData)
        .select()

      if (err) throw err
      if (!rows || rows.length === 0) throw new Error('No se pudo crear la impronta')

      const nueva = mapRowToImpronta(rows[0] as ImprontaRow)
      improntas.value.unshift(nueva)
      return nueva
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al crear impronta'
      throw err
    } finally {
      loading.value = false
    }
  }

  const actualizar = async (id: string, data: Partial<Impronta>): Promise<Impronta> => {
    loading.value = true
    error.value = null
    try {
      const updateData: Record<string, string | string[] | DañoZona[] | Record<string, string>> = {}
      if (data.vin !== undefined) updateData.vin = data.vin
      if (data.placa !== undefined) updateData.placa = data.placa
      if (data.marca !== undefined) updateData.marca = data.marca
      if (data.modelo !== undefined) updateData.modelo = data.modelo
      if (data.anio !== undefined) updateData.anio = data.anio
      if (data.color !== undefined) updateData.color = data.color
      if (data.km !== undefined) updateData.km = data.km
      if (data.cliente !== undefined) updateData.cliente = data.cliente
      if (data.condicion !== undefined) updateData.condicion = data.condicion
      if (data.zonasDañadas !== undefined) updateData.zonas_danadas = data.zonasDañadas
      if (data.daños !== undefined) updateData.danos = data.daños
      if (data.observaciones !== undefined) updateData.observaciones = data.observaciones
      if (data.fotos !== undefined) updateData.fotos = data.fotos
      if (data.fotosAdicionales !== undefined) updateData.fotos_adicionales = data.fotosAdicionales
      if (data.estado !== undefined) updateData.estado = data.estado
      if (data.creadoPor !== undefined) updateData.creado_por = data.creadoPor

      const { data: rows, error: err } = await supabase
        .from('improntas_registro')
        .update(updateData)
        .eq('id', id)
        .select()

      if (err) throw err
      if (!rows || rows.length === 0) throw new Error('Impronta no encontrada')

      const updated = mapRowToImpronta(rows[0] as ImprontaRow)
      const idx = improntas.value.findIndex((i) => i.id === id)
      if (idx !== -1) improntas.value[idx] = updated

      return updated
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar'
      throw err
    } finally {
      loading.value = false
    }
  }

  const eliminar = async (id: string) => {
    loading.value = true
    try {
      const { error: err } = await supabase.from('improntas_registro').delete().eq('id', id)

      if (err) throw err
      improntas.value = improntas.value.filter((i) => i.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cambiarEstado = async (id: string, nuevoEstado: Impronta['estado']) => {
    return actualizar(id, { estado: nuevoEstado })
  }

  // Init
  fetchImprontas()

  return {
    improntas,
    loading,
    error,
    totalImprontas,
    completadas,
    borradores,
    revisadas,
    hoy,
    fetchImprontas,
    getById,
    getByFolio,
    crear,
    actualizar,
    eliminar,
    cambiarEstado,
  }
})
