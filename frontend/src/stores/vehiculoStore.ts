import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Store central del ciclo de vida de cada vehículo en el sistema IBV.
 *
 * Flujo: Recepción (VIN escaneado) → Impronta → Inventario → Despacho
 *
 * Un vehículo NO puede despacharse si:
 * - No tiene impronta completada
 * - No tiene inventario aprobado
 */

export type EstadoVehiculo =
  | 'recibido'
  | 'impronta_pendiente'
  | 'impronta_completada'
  | 'inventario_pendiente'
  | 'inventario_aprobado'
  | 'listo_despacho'
  | 'despachado'

export interface VehiculoPipeline {
  id: string
  dbId: number // ID numérico de la tabla vehiculos en Supabase
  bin?: string
  vin: string
  placa: string
  marca: string
  modelo: string
  anio: string
  color: string
  cliente: string
  contenedorId?: string
  contenedorCodigo?: string
  // Etapas del pipeline
  fechaRecepcion: string
  horaRecepcion: string
  // Impronta
  improntaId?: string
  improntaFolio?: string
  improntaCompletada: boolean
  fechaImpronta?: string
  // Inventario
  inventarioCompletado: boolean
  inventarioAprobado: boolean
  inventarioFecha?: string
  inventarioInspector?: string
  inventarioResultado?: {
    totalItems: number
    aprobados: number
    fallas: number
    na: number
    nota?: string
  }
  // Despacho
  despachado: boolean
  fechaDespacho?: string
  horaDespacho?: string
  lotDespacho?: string
  despachador?: string
  // Estado calculado
  estado: EstadoVehiculo
}

const STORAGE_KEY = 'ibv_vehiculos_pipeline'

// Datos iniciales: vehículos que ya pasaron por distintas etapas
const INITIAL_VEHICULOS: VehiculoPipeline[] = [
  {
    id: 'vp-1',
    dbId: 1,
    vin: '1HGBH41JXMN109186',
    placa: 'ABC-1234',
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: '2024',
    color: 'Blanco Perla',
    cliente: 'Distribuidora Caracas',
    contenedorId: '3',
    contenedorCodigo: 'CONT-2026-0003',
    fechaRecepcion: '2026-02-22',
    horaRecepcion: '09:15',
    improntaId: '1',
    improntaFolio: 'IMP-0001',
    improntaCompletada: true,
    fechaImpronta: '2026-02-22',
    inventarioCompletado: true,
    inventarioAprobado: true,
    inventarioFecha: '2026-02-22',
    inventarioInspector: 'Carlos Inspector',
    inventarioResultado: { totalItems: 30, aprobados: 28, fallas: 0, na: 2 },
    despachado: false,
    estado: 'listo_despacho',
  },
  {
    id: 'vp-2',
    dbId: 2,
    vin: '3VWDX7AJ5BM123456',
    placa: 'XYZ-5678',
    marca: 'Chevrolet',
    modelo: 'Spark',
    anio: '2023',
    color: 'Rojo',
    cliente: 'AutoVentas Norte',
    contenedorId: '3',
    contenedorCodigo: 'CONT-2026-0003',
    fechaRecepcion: '2026-02-22',
    horaRecepcion: '09:20',
    improntaId: '2',
    improntaFolio: 'IMP-0002',
    improntaCompletada: true,
    fechaImpronta: '2026-02-22',
    inventarioCompletado: true,
    inventarioAprobado: true,
    inventarioFecha: '2026-02-22',
    inventarioInspector: 'Carlos Inspector',
    inventarioResultado: {
      totalItems: 30,
      aprobados: 26,
      fallas: 2,
      na: 2,
      nota: 'Rayón en lateral derecho',
    },
    despachado: false,
    estado: 'listo_despacho',
  },
  {
    id: 'vp-3',
    dbId: 3,
    vin: 'WVWZZZ3CZWE123789',
    placa: 'DEF-9012',
    marca: 'Nissan',
    modelo: 'Versa',
    anio: '2025',
    color: 'Plata',
    cliente: 'Distribuidora Valencia',
    fechaRecepcion: '2026-02-23',
    horaRecepcion: '08:00',
    improntaId: '3',
    improntaFolio: 'IMP-0003',
    improntaCompletada: false,
    inventarioCompletado: false,
    inventarioAprobado: false,
    despachado: false,
    estado: 'impronta_pendiente',
  },
  {
    id: 'vp-4',
    dbId: 4,
    vin: 'KNDJP3A53H7654321',
    placa: 'GHI-3456',
    marca: 'Kia',
    modelo: 'Rio',
    anio: '2024',
    color: 'Negro',
    cliente: 'Importadora Maracaibo',
    fechaRecepcion: '2026-02-21',
    horaRecepcion: '16:45',
    improntaId: '4',
    improntaFolio: 'IMP-0004',
    improntaCompletada: true,
    fechaImpronta: '2026-02-21',
    inventarioCompletado: false,
    inventarioAprobado: false,
    despachado: false,
    estado: 'inventario_pendiente',
  },
  {
    id: 'vp-5',
    dbId: 5,
    vin: 'KMHDN46D09U987654',
    placa: 'JKL-7890',
    marca: 'Hyundai',
    modelo: 'Accent',
    anio: '2023',
    color: 'Azul',
    cliente: 'AutoCenter Barquisimeto',
    fechaRecepcion: '2026-02-23',
    horaRecepcion: '10:20',
    improntaId: '5',
    improntaFolio: 'IMP-0005',
    improntaCompletada: true,
    fechaImpronta: '2026-02-23',
    inventarioCompletado: false,
    inventarioAprobado: false,
    despachado: false,
    estado: 'inventario_pendiente',
  },
  // Vehículo ya despachado
  {
    id: 'vp-6',
    dbId: 6,
    vin: '1FADP3F29JL234567',
    placa: 'MNO-4567',
    marca: 'Ford',
    modelo: 'Explorer',
    anio: '2025',
    color: 'Blanco Oxford',
    cliente: 'Concesionaria Capital',
    contenedorId: '3',
    contenedorCodigo: 'CONT-2026-0003',
    fechaRecepcion: '2026-02-20',
    horaRecepcion: '14:00',
    improntaCompletada: true,
    fechaImpronta: '2026-02-20',
    inventarioCompletado: true,
    inventarioAprobado: true,
    inventarioFecha: '2026-02-21',
    inventarioInspector: 'Carlos Inspector',
    inventarioResultado: { totalItems: 30, aprobados: 30, fallas: 0, na: 0 },
    despachado: true,
    fechaDespacho: '2026-02-22',
    horaDespacho: '15:30',
    lotDespacho: 'LT-2026-0001',
    despachador: 'Luis Despachador',
    estado: 'despachado',
  },
]

function calcularEstado(v: Omit<VehiculoPipeline, 'estado'>): EstadoVehiculo {
  if (v.despachado) return 'despachado'
  if (v.inventarioAprobado && v.improntaCompletada) return 'listo_despacho'
  if (v.inventarioCompletado) return 'inventario_aprobado'
  if (v.improntaCompletada) return 'inventario_pendiente'
  if (v.improntaId) return 'impronta_pendiente'
  return 'recibido'
}

export const useVehiculoStore = defineStore('vehiculo', () => {
  const vehiculos = ref<VehiculoPipeline[]>([])

  const init = () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        vehiculos.value = JSON.parse(stored)
      } catch {
        vehiculos.value = [...INITIAL_VEHICULOS]
        persist()
      }
    } else {
      vehiculos.value = JSON.parse(JSON.stringify(INITIAL_VEHICULOS))
      persist()
    }
  }

  const persist = () => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehiculos.value))
  }

  // === Computados ===
  const total = computed(() => vehiculos.value.length)
  const recibidos = computed(() => vehiculos.value.filter((v) => !v.despachado).length)
  const conImpronta = computed(() => vehiculos.value.filter((v) => v.improntaCompletada).length)
  const conInventario = computed(() => vehiculos.value.filter((v) => v.inventarioAprobado).length)
  const listosDespacho = computed(
    () => vehiculos.value.filter((v) => v.estado === 'listo_despacho').length
  )
  const despachados = computed(() => vehiculos.value.filter((v) => v.despachado).length)
  const pendientesImpronta = computed(
    () => vehiculos.value.filter((v) => !v.improntaCompletada && !v.despachado).length
  )
  const pendientesInventario = computed(
    () =>
      vehiculos.value.filter((v) => v.improntaCompletada && !v.inventarioAprobado && !v.despachado)
        .length
  )

  // === Getters ===
  const getByVin = (vin: string) =>
    vehiculos.value.find((v) => v.vin.toLowerCase() === vin.toLowerCase())
  const getById = (id: string) => vehiculos.value.find((v) => v.id === id)

  const getListosParaDespacho = computed(() =>
    vehiculos.value.filter((v) => v.improntaCompletada && v.inventarioAprobado && !v.despachado)
  )

  const getPendientesInventario = computed(() =>
    vehiculos.value.filter((v) => v.improntaCompletada && !v.inventarioAprobado && !v.despachado)
  )

  const getPendientesImpronta = computed(() =>
    vehiculos.value.filter((v) => !v.improntaCompletada && !v.despachado)
  )

  // === Validación de despacho ===
  const puedeDespachar = (vin: string): { ok: boolean; razon?: string } => {
    const v = getByVin(vin)
    if (!v) return { ok: false, razon: 'Vehículo no registrado en el sistema' }
    if (v.despachado) return { ok: false, razon: 'Este vehículo ya fue despachado' }
    if (!v.improntaCompletada) return { ok: false, razon: 'La impronta no ha sido completada' }
    if (!v.inventarioAprobado) return { ok: false, razon: 'El inventario no ha sido aprobado' }
    return { ok: true }
  }

  // === Actions ===
  const registrarRecepcion = (data: {
    vin: string
    placa?: string
    marca: string
    modelo: string
    anio: string
    color: string
    cliente?: string
    contenedorId?: string
    contenedorCodigo?: string
  }): VehiculoPipeline => {
    // Check if already registered
    const existing = getByVin(data.vin)
    if (existing) return existing

    const now = new Date()
    const v: VehiculoPipeline = {
      id: `vp-${Date.now()}`,
      vin: data.vin,
      placa: data.placa || '',
      marca: data.marca,
      modelo: data.modelo,
      anio: data.anio,
      color: data.color,
      cliente: data.cliente || '',
      contenedorId: data.contenedorId,
      contenedorCodigo: data.contenedorCodigo,
      fechaRecepcion: now.toISOString().split('T')[0],
      horaRecepcion: now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
      improntaCompletada: false,
      inventarioCompletado: false,
      inventarioAprobado: false,
      despachado: false,
      estado: 'recibido',
    }
    vehiculos.value.push(v)
    persist()
    return v
  }

  const vincularImpronta = (vin: string, improntaId: string, improntaFolio: string) => {
    const v = getByVin(vin)
    if (v) {
      v.improntaId = improntaId
      v.improntaFolio = improntaFolio
      v.estado = calcularEstado(v)
      persist()
    }
  }

  const completarImpronta = (vin: string) => {
    const v = getByVin(vin)
    if (v) {
      v.improntaCompletada = true
      v.fechaImpronta = new Date().toISOString().split('T')[0]
      v.estado = calcularEstado(v)
      persist()
    }
  }

  const aprobarInventario = (
    vin: string,
    resultado: VehiculoPipeline['inventarioResultado'],
    inspector: string
  ) => {
    const v = getByVin(vin)
    if (v) {
      v.inventarioCompletado = true
      v.inventarioAprobado = true
      v.inventarioFecha = new Date().toISOString().split('T')[0]
      v.inventarioInspector = inspector
      v.inventarioResultado = resultado
      v.estado = calcularEstado(v)
      persist()
    }
  }

  const rechazarInventario = (vin: string, motivo: string) => {
    const v = getByVin(vin)
    if (v) {
      v.inventarioCompletado = true
      v.inventarioAprobado = false
      v.inventarioFecha = new Date().toISOString().split('T')[0]
      v.inventarioResultado = { totalItems: 0, aprobados: 0, fallas: 0, na: 0, nota: motivo }
      v.estado = calcularEstado(v)
      persist()
    }
  }

  const despachar = (vin: string, lote: string, despachador: string): boolean => {
    const check = puedeDespachar(vin)
    if (!check.ok) return false
    const v = getByVin(vin)!
    const now = new Date()
    v.despachado = true
    v.fechaDespacho = now.toISOString().split('T')[0]
    v.horaDespacho = now.toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    v.lotDespacho = lote
    v.despachador = despachador
    v.estado = 'despachado'
    persist()
    return true
  }

  /**
   * Carga vehículos desde Supabase
   * Si la carga falla, mantiene los datos locales
   */
  const loadFromSupabase = async () => {
    interface SbUsuario {
      id: number
      nombres: string
      apellidos: string
    }
    interface SbImpronta {
      id: number
      vehiculo_id: number
      fecha: string
      estado: string
      usuario: SbUsuario[] | SbUsuario | null
    }
    interface SbInventario {
      id: number
      vehiculo_id: number
      fecha: string
      completo: boolean
      usuario: SbUsuario[] | SbUsuario | null
    }
    interface SbDespachoVeh {
      vehiculo_id: number
      despacho_id: number
      fecha: string
    }
    interface SbDespacho {
      id: number
      fecha: string
      estado: string
      usuario: SbUsuario[] | SbUsuario | null
    }
    interface SbVehiculo {
      id: number
      bin: string
      qr_codigo: string
      placa: string | null
      color: string | null
      estado: string | null
      fecha_registro: string | null
      created_at: string | null
      modelo: { marca: string; modelo: string; anio: number | null; tipo: string | null } | null
      buque: { nombre: string; identificacion: string } | null
      usuario_recibe: { id: number; nombres: string; apellidos: string } | null
    }

    try {
      const { $supabase } = useNuxtApp()
      if (!$supabase) {
        console.warn('[loadFromSupabase] Supabase no disponible')
        return false
      }

      const sb = $supabase as SupabaseClient

      const vehiculosQuery = sb
        .from('vehiculos')
        .select(
          `id, bin, qr_codigo, placa, color, estado, fecha_registro, created_at,
          modelo:modelos_vehiculo(marca, modelo, anio, tipo),
          buque:buques(nombre, identificacion),
          usuario_recibe:usuarios(id, nombres, apellidos)`
        )
        .order('created_at', { ascending: false })

      const [vehiculosRes, improntasRes, inventariosRes, despachoVehRes, despachosRes] =
        await Promise.all([
          vehiculosQuery,
          sb
            .from('improntas')
            .select('id, vehiculo_id, fecha, estado, usuario:usuarios(id, nombres, apellidos)'),
          sb
            .from('inventarios')
            .select('id, vehiculo_id, fecha, completo, usuario:usuarios(id, nombres, apellidos)'),
          sb.from('recibos').select('vehiculo_id, despacho_id, fecha'),
          sb
            .from('despachos')
            .select('id, fecha, estado, usuario:usuarios(id, nombres, apellidos)'),
        ])

      const { data, error } = vehiculosRes

      if (error) {
        console.error('[loadFromSupabase] Error from Supabase:', error)
        return false
      }

      if (!data || data.length === 0) {
        console.log('[loadFromSupabase] No vehículos encontrados en BD, usando datos locales')
        return false
      }

      // DEBUG: Log primer vehículo para ver estructura de datos
      console.log('[loadFromSupabase] Primer vehículo recibido:', JSON.stringify(data[0], null, 2))

      const latestByVehiculo = <T extends { vehiculo_id: number; fecha?: string }>(items: T[]) => {
        const map = new Map<number, T>()
        for (const item of items) {
          const current = map.get(item.vehiculo_id)
          if (!current) {
            map.set(item.vehiculo_id, item)
            continue
          }
          const currDate = current.fecha ? new Date(current.fecha).getTime() : 0
          const nextDate = item.fecha ? new Date(item.fecha).getTime() : 0
          if (nextDate >= currDate) {
            map.set(item.vehiculo_id, item)
          }
        }
        return map
      }

      const improntasMap = latestByVehiculo((improntasRes.data || []) as SbImpronta[])
      const inventariosMap = latestByVehiculo((inventariosRes.data || []) as SbInventario[])

      const despachoVehMap = new Map<number, SbDespachoVeh>()
      for (const dv of (despachoVehRes.data || []) as SbDespachoVeh[]) {
        const current = despachoVehMap.get(dv.vehiculo_id)
        if (!current) {
          despachoVehMap.set(dv.vehiculo_id, dv)
          continue
        }
        const currDate = new Date(current.fecha).getTime()
        const nextDate = new Date(dv.fecha).getTime()
        if (nextDate >= currDate) {
          despachoVehMap.set(dv.vehiculo_id, dv)
        }
      }

      const despachosMap = new Map<number, SbDespacho>()
      for (const d of (despachosRes.data || []) as SbDespacho[]) {
        despachosMap.set(d.id, d)
      }

      const toEstado = (
        despachado: boolean,
        improntaCompletada: boolean,
        inventarioCompletado: boolean,
        inventarioAprobado: boolean
      ): EstadoVehiculo => {
        if (despachado) return 'despachado'
        if (inventarioAprobado && improntaCompletada) return 'listo_despacho'
        if (inventarioAprobado) return 'inventario_aprobado'
        if (inventarioCompletado || improntaCompletada) return 'inventario_pendiente'
        if (improntaCompletada) return 'impronta_completada'
        return 'recibido'
      }

      const resolveUsuario = (u: SbUsuario[] | SbUsuario | null | undefined): SbUsuario | null => {
        if (!u) return null
        return Array.isArray(u) ? (u[0] ?? null) : u
      }

      // Mapear datos de Supabase a formato local
      vehiculos.value = (data as unknown as SbVehiculo[]).map((v) => {
        const impronta = improntasMap.get(v.id)
        const inventario = inventariosMap.get(v.id)
        const despachoVeh = despachoVehMap.get(v.id)
        const despacho = despachoVeh ? despachosMap.get(despachoVeh.despacho_id) : null

        const improntaCompletada =
          impronta?.estado === 'completada' || impronta?.estado === 'completado'
        const inventarioCompletado = Boolean(inventario)
        const inventarioAprobado = inventario?.completo === true
        const despachado = (v.estado || '').toLowerCase() === 'despachado' || Boolean(despachoVeh)

        const fechaBase = v.fecha_registro || v.created_at
        const fechaRecepcion = fechaBase ? new Date(fechaBase).toISOString().split('T')[0] : ''
        const horaRecepcion = fechaBase ? new Date(fechaBase).toLocaleTimeString('es-VE') : ''

        const modelo = v.modelo || { marca: '', modelo: '', anio: null, tipo: null }
        const usuarioRecibe = v.usuario_recibe
          ? `${v.usuario_recibe.nombres || ''} ${v.usuario_recibe.apellidos || ''}`.trim()
          : ''

        const invUsuario = resolveUsuario(inventario?.usuario)
        const despUsuario = resolveUsuario(despacho?.usuario)

        const estado = toEstado(
          despachado,
          Boolean(improntaCompletada),
          inventarioCompletado,
          inventarioAprobado
        )

        return {
          id: `vp-${v.id}`,
          dbId: v.id, // Guardar el ID numérico original de la tabla
          bin: v.bin || undefined,
          // En Supabase se usa bin/qr_codigo como identificador
          vin: v.bin || v.qr_codigo || '',
          placa: v.placa || '',
          marca: modelo.marca || '',
          modelo: modelo.modelo || '',
          anio: modelo.anio ? String(modelo.anio) : '',
          color: v.color || '',
          cliente: usuarioRecibe || '',
          contenedorId: v.buque?.identificacion || undefined,
          contenedorCodigo: v.buque?.nombre || undefined,
          fechaRecepcion,
          horaRecepcion,
          improntaId: impronta?.id ? String(impronta.id) : undefined,
          improntaFolio: impronta?.id ? `IMP-${impronta.id}` : undefined,
          improntaCompletada: Boolean(improntaCompletada),
          fechaImpronta: impronta?.fecha
            ? new Date(impronta.fecha).toISOString().split('T')[0]
            : undefined,
          inventarioCompletado,
          inventarioAprobado,
          inventarioFecha: inventario?.fecha
            ? new Date(inventario.fecha).toISOString().split('T')[0]
            : undefined,
          inventarioInspector: invUsuario
            ? `${invUsuario.nombres || ''} ${invUsuario.apellidos || ''}`.trim()
            : undefined,
          despachado,
          fechaDespacho: despacho?.fecha
            ? new Date(despacho.fecha).toISOString().split('T')[0]
            : undefined,
          horaDespacho: despacho?.fecha
            ? new Date(despacho.fecha).toLocaleTimeString('es-VE')
            : undefined,
          lotDespacho: despacho?.id ? `LT-${String(despacho.id).padStart(4, '0')}` : undefined,
          despachador: despUsuario
            ? `${despUsuario.nombres || ''} ${despUsuario.apellidos || ''}`.trim()
            : undefined,
          estado,
        }
      })

      console.log(`[loadFromSupabase] Cargados ${vehiculos.value.length} vehículos de Supabase`)
      persist()
      return true
    } catch (err: unknown) {
      console.error('[loadFromSupabase] Error:', err)
      return false
    }
  }

  init()

  return {
    vehiculos,
    total,
    recibidos,
    conImpronta,
    conInventario,
    listosDespacho,
    despachados,
    pendientesImpronta,
    pendientesInventario,
    getByVin,
    getById,
    getListosParaDespacho,
    getPendientesInventario,
    getPendientesImpronta,
    puedeDespachar,
    registrarRecepcion,
    vincularImpronta,
    completarImpronta,
    aprobarInventario,
    rechazarInventario,
    despachar,
    loadFromSupabase,
    persist,
  }
})
