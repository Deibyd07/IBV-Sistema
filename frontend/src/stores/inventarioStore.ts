import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseUserService } from '~/services/supabaseUserService'
import { useAuthStore } from '~/stores/auth'

export type EstadoVehiculo =
  | 'recibido'
  | 'impronta_pendiente'
  | 'impronta_completada'
  | 'inventario_pendiente'
  | 'inventario_aprobado'
  | 'listo_despacho'
  | 'despachado'

export interface InventarioResultado {
  totalItems: number
  aprobados: number
  fallas: number
  na: number
  nota?: string
}

export interface InventarioVehiculo {
  id: number
  vin: string
  placa: string
  marca: string
  modelo: string
  anio: string
  color: string
  cliente: string
  fechaRecepcion: string
  horaRecepcion: string
  // Impronta
  improntaId?: string
  improntaFolio?: string
  improntaCompletada: boolean
  improntaRechazada: boolean
  fechaImpronta?: string
  // Inventario
  inventarioCompletado: boolean
  inventarioAprobado: boolean
  inventarioFecha?: string
  inventarioInspector?: string
  inventarioResultado?: InventarioResultado
  // Despacho
  despachado: boolean
  fechaDespacho?: string
  horaDespacho?: string
  lotDespacho?: string
  despachador?: string
  // Estado calculado
  estado: EstadoVehiculo
}

/**
 * Fila de improntas_registro — tabla real donde el recibidor/impronta guarda datos.
 */
interface ImprontaRegistroRow {
  id: string
  folio: string
  vin: string
  placa: string | null
  marca: string
  modelo: string
  anio: string | null
  color: string | null
  km: string | null
  cliente: string | null
  condicion: string | null
  estado: string
  creado_por: string | null
  fecha_creacion: string
  hora_creacion: string | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Fila ligera de la tabla vehiculos (solo para obtener el ID numérico usado como FK
 * en la tabla inventarios).
 */
interface VehiculoLegacyRow {
  id: number
  bin: string
  estado: string | null
}

/**
 * Fila de la tabla inventarios.
 */
interface InventarioRow {
  id: number
  vehiculo_id: number
  completo: boolean
  fecha: string | null
  checklist_json: Record<string, unknown> | null
  usuario?: { nombres: string; apellidos: string } | null
}

const getSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}

const toDateOnly = (value?: string | null) => {
  if (!value) return ''
  return value.split('T')[0]
}

const calcularEstado = (v: Omit<InventarioVehiculo, 'estado'>): EstadoVehiculo => {
  if (v.despachado) return 'despachado'
  if (v.inventarioAprobado && v.improntaCompletada) return 'listo_despacho'
  if (v.inventarioCompletado) return 'inventario_pendiente'
  if (v.improntaCompletada) return 'inventario_pendiente'
  if (v.improntaRechazada) return 'recibido'
  if (v.improntaId) return 'impronta_pendiente'
  return 'recibido'
}

export const useInventarioStore = defineStore('inventario', () => {
  const vehiculos = ref<InventarioVehiculo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const total = computed(() => vehiculos.value.length)
  const conImpronta = computed(() => vehiculos.value.filter((v) => v.improntaCompletada).length)
  const listosDespacho = computed(
    () => vehiculos.value.filter((v) => v.inventarioAprobado && !v.despachado).length
  )
  const despachados = computed(() => vehiculos.value.filter((v) => v.despachado).length)
  const pendientesInventario = computed(
    () =>
      vehiculos.value.filter((v) => v.improntaCompletada && !v.inventarioAprobado && !v.despachado)
        .length
  )

  const getByVin = (vin: string) =>
    vehiculos.value.find((v) => v.vin.toLowerCase() === vin.toLowerCase())

  const getListosParaDespacho = computed(() =>
    vehiculos.value.filter(
      (v) => v.improntaCompletada && v.inventarioAprobado && !v.despachado && !v.improntaRechazada
    )
  )

  const getPendientesInventario = computed(() =>
    vehiculos.value.filter(
      (v) => v.improntaCompletada && !v.inventarioAprobado && !v.despachado && !v.improntaRechazada
    )
  )

  // =========================================================================
  // load() — lee de improntas_registro (fuente real) y cruza con vehiculos +
  //          inventarios para saber el estado de inventario de cada vehículo.
  // =========================================================================
  const load = async () => {
    if (process.server) return
    loading.value = true
    error.value = null

    try {
      const $supabase = getSupabase()

      // 1. Improntas completadas/revisadas — FUENTE PRINCIPAL de vehículos
      const { data: improntasData, error: impErr } = await $supabase
        .from('improntas_registro')
        .select('*')
        .in('estado', ['completada', 'revisada'])
        .order('created_at', { ascending: false })

      if (impErr) throw impErr

      const improntas = (improntasData || []) as ImprontaRegistroRow[]

      // 2. Tabla vehiculos (legacy) — necesitamos el id numérico para cruzar con inventarios
      const { data: vehData } = await $supabase.from('vehiculos').select('id, bin, estado')

      const vehByVin = new Map<string, VehiculoLegacyRow>()
      for (const v of (vehData || []) as VehiculoLegacyRow[]) {
        if (v.bin) vehByVin.set(v.bin.toLowerCase(), v)
      }

      // 3. Inventarios (un registro por vehículo aprobado/rechazado)
      const { data: invData } = await $supabase
        .from('inventarios')
        .select(
          'id, vehiculo_id, completo, fecha, checklist_json, usuario:usuarios!inventarios_usuario_id_fkey(nombres, apellidos)'
        )

      // Mapa: vehiculo_id → inventario más reciente
      const invByVehId = new Map<number, InventarioRow>()
      for (const row of (invData || []) as InventarioRow[]) {
        const existing = invByVehId.get(row.vehiculo_id)
        if (!existing || new Date(row.fecha || 0) > new Date(existing.fecha || 0)) {
          invByVehId.set(row.vehiculo_id, row)
        }
      }

      // 4. Mapear improntas → InventarioVehiculo
      // Deduplicar por VIN (quedarnos con la impronta más reciente de cada VIN)
      const seenVins = new Set<string>()
      const result: InventarioVehiculo[] = []

      for (const imp of improntas) {
        const vinKey = imp.vin.toLowerCase()
        if (seenVins.has(vinKey)) continue
        seenVins.add(vinKey)

        const vehLegacy = vehByVin.get(vinKey)
        const inv = vehLegacy ? invByVehId.get(vehLegacy.id) : undefined

        const improntaCompletada = imp.estado === 'completada' || imp.estado === 'revisada'
        const improntaRechazada = imp.estado === 'rechazado' || imp.estado === 'rechazada'
        const inventarioCompletado = !!inv
        const inventarioAprobado = inv?.completo ?? false
        const vehEstado = (vehLegacy?.estado || '').toLowerCase()
        const esDespachado = vehEstado === 'despachado'

        const inspectorName = inv?.usuario
          ? `${inv.usuario.nombres} ${inv.usuario.apellidos}`.trim()
          : ''
        const resultado = inv?.checklist_json?.resumen as InventarioResultado | undefined

        const base: Omit<InventarioVehiculo, 'estado'> = {
          id: vehLegacy?.id ?? 0,
          vin: imp.vin,
          placa: imp.placa || '',
          marca: imp.marca || '—',
          modelo: imp.modelo || '',
          anio: imp.anio || '',
          color: imp.color || '—',
          cliente: imp.cliente || '',
          fechaRecepcion: toDateOnly(imp.fecha_creacion || imp.created_at),
          horaRecepcion: imp.hora_creacion?.substring(0, 5) || '',
          improntaId: imp.id,
          improntaFolio: imp.folio,
          improntaCompletada,
          improntaRechazada,
          fechaImpronta: toDateOnly(imp.fecha_creacion),
          inventarioCompletado,
          inventarioAprobado,
          inventarioFecha: inv?.fecha ? toDateOnly(inv.fecha) : undefined,
          inventarioInspector: inspectorName || undefined,
          inventarioResultado: resultado,
          despachado: esDespachado,
        }

        result.push({ ...base, estado: calcularEstado(base) })
      }

      vehiculos.value = result
    } catch (err: unknown) {
      console.error('Error cargando inventario:', err)
      error.value = err instanceof Error ? err.message : 'Error cargando inventario'
      vehiculos.value = []
    } finally {
      loading.value = false
    }
  }

  // =========================================================================
  // Helpers para aprobar / rechazar
  // =========================================================================

  const getUsuarioId = async () => {
    const authStore = useAuthStore()
    const email = authStore.user?.email
    if (!email) return null
    const profile = await supabaseUserService.getUserProfile(email)
    return profile?.id ?? null
  }

  /**
   * Asegura que el vehículo exista en la tabla legacy `vehiculos` (necesaria
   * para la FK vehiculo_id de la tabla inventarios). Si no existe lo crea.
   * Retorna el id numérico.
   */
  const ensureVehiculoLegacy = async (
    $supabase: SupabaseClient,
    v: InventarioVehiculo
  ): Promise<number> => {
    if (v.id && v.id > 0) return v.id

    // Buscar por VIN
    const { data: existing } = await $supabase
      .from('vehiculos')
      .select('id')
      .eq('bin', v.vin)
      .maybeSingle()

    if (existing?.id) {
      v.id = existing.id
      return existing.id
    }

    // Buscar/crear modelo
    let modeloId: number | null = null
    const { data: mod } = await $supabase
      .from('modelos_vehiculo')
      .select('id')
      .eq('marca', v.marca)
      .eq('modelo', v.modelo)
      .limit(1)
      .maybeSingle()

    if (mod) {
      modeloId = mod.id
    } else {
      const { data: nuevoMod } = await $supabase
        .from('modelos_vehiculo')
        .insert({
          marca: v.marca,
          modelo: v.modelo,
          anio: parseInt(v.anio) || new Date().getFullYear(),
        })
        .select('id')
        .single()
      modeloId = nuevoMod?.id ?? null
    }

    // Crear vehículo legacy
    const { data: nuevoVeh } = await $supabase
      .from('vehiculos')
      .insert({
        bin: v.vin,
        qr_codigo: v.vin,
        placa: v.placa || null,
        color: v.color,
        estado: 'impronta_completada',
        fecha_registro: new Date().toISOString(),
        modelo_id: modeloId,
      })
      .select('id')
      .single()

    const newId = nuevoVeh?.id ?? 0
    v.id = newId
    return newId
  }

  const aprobarInventario = async (
    vin: string,
    resultado: InventarioResultado,
    checklistJson: unknown
  ) => {
    const vehiculo = getByVin(vin)
    if (!vehiculo) return

    const $supabase = getSupabase()
    const usuarioId = await getUsuarioId()
    const now = new Date().toISOString()

    // Asegurar que existe en tabla vehiculos (FK)
    const vehiculoId = await ensureVehiculoLegacy($supabase, vehiculo)
    if (!vehiculoId) throw new Error('No se pudo crear el vehículo en la tabla vehiculos')

    // Insertar inventario
    const { error: invError } = await $supabase.from('inventarios').insert({
      vehiculo_id: vehiculoId,
      checklist_json: checklistJson,
      completo: true,
      usuario_id: usuarioId,
      fecha: now,
    })
    if (invError) {
      console.error('Error guardando inventario:', invError)
      throw new Error(invError.message)
    }

    // Actualizar estado en vehiculos legacy
    await $supabase
      .from('vehiculos')
      .update({ estado: 'listo_despacho', updated_at: now })
      .eq('id', vehiculoId)

    // Actualizar estado local
    vehiculo.inventarioCompletado = true
    vehiculo.inventarioAprobado = true
    vehiculo.inventarioFecha = toDateOnly(now)
    vehiculo.inventarioResultado = resultado
    vehiculo.estado = calcularEstado(vehiculo)
  }

  const rechazarInventario = async (vin: string, motivo: string, checklistJson: unknown) => {
    const vehiculo = getByVin(vin)
    if (!vehiculo) return

    const $supabase = getSupabase()
    const usuarioId = await getUsuarioId()
    const now = new Date().toISOString()

    // Asegurar que existe en tabla vehiculos (FK)
    const vehiculoId = await ensureVehiculoLegacy($supabase, vehiculo)
    if (!vehiculoId) throw new Error('No se pudo crear el vehículo en la tabla vehiculos')

    // Insertar inventario rechazado
    const { error: invError } = await $supabase.from('inventarios').insert({
      vehiculo_id: vehiculoId,
      checklist_json: checklistJson,
      completo: false,
      usuario_id: usuarioId,
      fecha: now,
    })
    if (invError) {
      console.error('Error guardando inventario:', invError)
      throw new Error(invError.message)
    }

    // Actualizar estado en vehiculos legacy
    await $supabase
      .from('vehiculos')
      .update({ estado: 'rechazado', updated_at: now })
      .eq('id', vehiculoId)

    // Marcar impronta como rechazada en improntas_registro
    if (vehiculo.improntaId) {
      await $supabase
        .from('improntas_registro')
        .update({ estado: 'rechazado' })
        .eq('id', vehiculo.improntaId)
    }

    // Actualizar estado local
    vehiculo.inventarioCompletado = true
    vehiculo.inventarioAprobado = false
    vehiculo.improntaCompletada = false
    vehiculo.improntaRechazada = true
    vehiculo.inventarioFecha = toDateOnly(now)
    vehiculo.inventarioResultado = {
      totalItems: 0,
      aprobados: 0,
      fallas: 0,
      na: 0,
      nota: motivo,
    }
    vehiculo.estado = calcularEstado(vehiculo)
  }

  return {
    vehiculos,
    loading,
    error,
    total,
    conImpronta,
    listosDespacho,
    despachados,
    pendientesInventario,
    getByVin,
    getListosParaDespacho,
    getPendientesInventario,
    load,
    aprobarInventario,
    rechazarInventario,
  }
})
