import { useAuthStore } from '~/stores/auth'
import type { VehiculoPipeline } from '~/stores/vehiculoStore'
import type { SupabaseClient } from '@supabase/supabase-js'

const useSupabaseClient = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}

/**
 * Helper para obtener el ID numérico del usuario desde la tabla usuarios
 * (no confundir con el UUID de Supabase Auth)
 */
async function getUserNumericId(email: string | undefined): Promise<number | null> {
  if (!email) return null

  const client = useSupabaseClient()
  try {
    const { data } = await client.from('usuarios').select('id').eq('correo', email).single()
    return data?.id || null
  } catch {
    return null
  }
}

export type AuditActionType =
  | 'cambio_estado'
  | 'anulacion_admin'
  | 'desbloqueo_manual'
  | 'escalacion'
  | 'nota_agregada'
export type LockReason =
  | 'bloqueada_en_estado'
  | 'esperando_revision_manual'
  | 'escalacion_pendiente'
  | 'mantenimiento'
  | 'otra'
export type ExceptionType =
  | 'bloqueada_en_estado'
  | 'retrasada_mas_de_3_dias'
  | 'documento_faltante'
  | 'problema_calidad'
  | 'otra'
export type ExceptionSeverity = 'baja' | 'media' | 'alta' | 'critica'
export type ExceptionStatus = 'abierta' | 'en_progreso' | 'resuelta' | 'escalada'

export interface AuditLog {
  id: number
  vehiculo_id: number
  cambiado_por_usuario_id: number | null
  cambiado_por_rol: string
  tipo_accion: AuditActionType
  estado_anterior: Record<string, any>
  estado_nuevo: Record<string, any>
  razon: string | null
  metadata: Record<string, any>
  creada_en: string
}

export interface VehicleLock {
  id: number
  vehiculo_id: number
  bloqueado_por_usuario_id: number | null
  bloqueado_por_rol: string
  razon: LockReason
  descripcion: string
  bloqueado_en: string
  desbloqueado_en: string | null
  metadata: Record<string, any>
}

export interface VehicleException {
  id: number
  vehiculo_id: number
  tipo_excepcion: ExceptionType
  severidad: ExceptionSeverity
  descripcion: string
  asignado_a_usuario_id: number | null
  estado: ExceptionStatus
  creada_en: string
  resuelta_en: string | null
  resuelta_por_usuario_id: number | null
  notas_resolucion: string | null
  metadata: Record<string, any>
}

export async function logAuditEntry(options: {
  vehiculoId: number
  actionType: AuditActionType
  oldState: Record<string, any>
  newState: Record<string, any>
  reason?: string
  metadata?: Record<string, any>
}): Promise<AuditLog | null> {
  const client = useSupabaseClient()
  const authStore = useAuthStore()
  const user = authStore.user

  try {
    // Obtener el ID numérico del usuario desde la tabla usuarios
    const numericUserId = await getUserNumericId(user?.email)

    const { data, error } = await client
      .from('auditoria_vehiculos')
      .insert({
        vehiculo_id: options.vehiculoId,
        cambiado_por_usuario_id: numericUserId,
        cambiado_por_rol: user?.role || 'sistema',
        tipo_accion: options.actionType,
        estado_anterior: options.oldState,
        estado_nuevo: options.newState,
        razon: options.reason,
        metadata: options.metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging audit:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Exception in logAuditEntry:', err)
    return null
  }
}

export async function getAuditLogs(vehiculoId?: number): Promise<AuditLog[]> {
  const client = useSupabaseClient()

  try {
    let query = client.from('auditoria_vehiculos').select('*')

    // Only filter by vehiculoId if provided
    if (vehiculoId !== undefined) {
      query = query.eq('vehiculo_id', vehiculoId)
    }

    const { data, error } = await query.order('creada_en', { ascending: false })

    if (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception in getAuditLogs:', err)
    return []
  }
}

export async function lockVehicle(options: {
  vehiculoId: number
  reason: LockReason
  description: string
  metadata?: Record<string, any>
}): Promise<VehicleLock | null> {
  const client = useSupabaseClient()
  const authStore = useAuthStore()
  const user = authStore.user

  try {
    const numericUserId = await getUserNumericId(user?.email)

    const { data, error } = await client
      .from('bloqueos_vehiculos')
      .insert({
        vehiculo_id: options.vehiculoId,
        bloqueado_por_usuario_id: numericUserId,
        bloqueado_por_rol: user?.role || 'admin',
        razon: options.reason,
        descripcion: options.description,
        metadata: options.metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error locking vehicle:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Exception in lockVehicle:', err)
    return null
  }
}

export async function unlockVehicle(lockId: number): Promise<boolean> {
  const client = useSupabaseClient()

  try {
    const { error } = await client
      .from('bloqueos_vehiculos')
      .update({ desbloqueado_en: new Date().toISOString() })
      .eq('id', lockId)

    if (error) {
      console.error('Error unlocking vehicle:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Exception in unlockVehicle:', err)
    return false
  }
}

export async function getVehicleLocks(vehiculoId: number): Promise<VehicleLock[]> {
  const client = useSupabaseClient()

  try {
    const { data, error } = await client
      .from('bloqueos_vehiculos')
      .select('*')
      .eq('vehiculo_id', vehiculoId)
      .order('bloqueado_en', { ascending: false })

    if (error) {
      console.error('Error fetching locks:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception in getVehicleLocks:', err)
    return []
  }
}

export async function getActiveLocks(): Promise<VehicleLock[]> {
  const client = useSupabaseClient()

  try {
    const { data, error } = await client
      .from('bloqueos_vehiculos')
      .select('*')
      .is('desbloqueado_en', null)
      .order('bloqueado_en', { ascending: false })

    if (error) {
      console.error('Error fetching active locks:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception in getActiveLocks:', err)
    return []
  }
}

export async function createException(options: {
  vehiculoId: number
  exceptionType: ExceptionType
  severity: ExceptionSeverity
  description: string
  assignedToUserId?: number
  metadata?: Record<string, any>
}): Promise<VehicleException | null> {
  const client = useSupabaseClient()

  // Validar parámetros
  if (
    typeof options.vehiculoId !== 'number' ||
    isNaN(options.vehiculoId) ||
    options.vehiculoId <= 0
  ) {
    console.error(
      '[createException] vehiculoId inválido:',
      options.vehiculoId,
      'tipo:',
      typeof options.vehiculoId
    )
    throw new Error(
      `vehiculoId debe ser un número válido positivo, recibido: ${options.vehiculoId}`
    )
  }

  console.log('[createException] Creando excepción con params:', {
    vehiculo_id: options.vehiculoId,
    tipo_excepcion: options.exceptionType,
    severidad: options.severity,
    descripcion: options.description,
    asignado_a_usuario_id: options.assignedToUserId,
    estado: 'abierta',
    metadata: options.metadata || {},
  })

  try {
    const { data, error } = await client
      .from('excepciones_vehiculos')
      .insert({
        vehiculo_id: options.vehiculoId,
        tipo_excepcion: options.exceptionType,
        severidad: options.severity,
        descripcion: options.description,
        asignado_a_usuario_id: options.assignedToUserId,
        estado: 'abierta',
        metadata: options.metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('[createException] Error de Supabase:', error)
      throw new Error(`${error.code}: ${error.message} ${error.details || ''}`)
    }

    console.log('[createException] Excepción creada exitosamente:', data)
    return data
  } catch (err) {
    console.error('[createException] Exception caught:', err)
    throw err
  }
}

export async function updateExceptionStatus(
  exceptionId: number,
  status: ExceptionStatus,
  resolutionNotes?: string
): Promise<boolean> {
  const client = useSupabaseClient()
  const authStore = useAuthStore()
  const user = authStore.user

  try {
    const updateData: any = { estado: status }

    if (status === 'resuelta') {
      updateData.resuelta_en = new Date().toISOString()
      updateData.resuelta_por_usuario_id = await getUserNumericId(user?.email)
      if (resolutionNotes) updateData.notas_resolucion = resolutionNotes
    }

    const { error } = await client
      .from('excepciones_vehiculos')
      .update(updateData)
      .eq('id', exceptionId)

    if (error) {
      console.error('Error updating exception:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Exception in updateExceptionStatus:', err)
    return false
  }
}

export async function getVehicleExceptions(vehiculoId?: number): Promise<VehicleException[]> {
  const client = useSupabaseClient()

  try {
    let query = client.from('excepciones_vehiculos').select('*')

    // Only filter by vehiculoId if provided
    if (vehiculoId !== undefined) {
      query = query.eq('vehiculo_id', vehiculoId)
    }

    const { data, error } = await query.order('creada_en', { ascending: false })

    if (error) {
      console.error('Error fetching exceptions:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception in getVehicleExceptions:', err)
    return []
  }
}

export async function getOpenExceptions(limit = 100): Promise<VehicleException[]> {
  const client = useSupabaseClient()

  try {
    const { data, error } = await client
      .from('excepciones_vehiculos')
      .select('*')
      .eq('estado', 'abierta')
      .limit(limit)
      .order('severidad', { ascending: false })
      .order('creada_en', { ascending: true })

    if (error) {
      console.error('Error fetching open exceptions:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Exception in getOpenExceptions:', err)
    return []
  }
}

export async function forceStatusChange(options: {
  vehiculoId: number
  newStatus: string
  reason: string
  metadata?: Record<string, any>
}): Promise<boolean> {
  const client = useSupabaseClient()

  try {
    console.log('[forceStatusChange] Iniciando con:', options)

    // Log the change - obtener estado actual
    const { data: oldStateData, error: queryError } = await client
      .from('vehiculos')
      .select('estado')
      .eq('id', options.vehiculoId)
      .single()

    if (queryError) {
      console.error('[forceStatusChange] Error obteniendo estado actual:', queryError)
      throw new Error(`Error al obtener estado actual: ${queryError.message}`)
    }

    console.log('[forceStatusChange] Estado actual obtenido:', oldStateData)

    const oldState = { estado: oldStateData?.estado }
    const newState = { estado: options.newStatus }

    // Create audit entry
    console.log('[forceStatusChange] Creando entrada de auditoría...')
    const auditResult = await logAuditEntry({
      vehiculoId: options.vehiculoId,
      actionType: 'anulacion_admin',
      oldState,
      newState,
      reason: options.reason,
      metadata: options.metadata || {},
    })

    if (!auditResult) {
      console.error('[forceStatusChange] Falló al crear entrada de auditoría')
      throw new Error('No se pudo crear la entrada de auditoría')
    }

    console.log('[forceStatusChange] Auditoría creada:', auditResult)

    // Actually update the vehicle
    console.log('[forceStatusChange] Actualizando vehículo...')
    const { error } = await client
      .from('vehiculos')
      .update({ estado: options.newStatus, updated_at: new Date().toISOString() })
      .eq('id', options.vehiculoId)

    if (error) {
      console.error('[forceStatusChange] Error actualizando vehículo:', error)
      throw new Error(`Error al actualizar vehículo: ${error.message}`)
    }

    console.log('[forceStatusChange] ✅ Cambio de estado exitoso')
    return true
  } catch (err) {
    console.error('[forceStatusChange] Exception:', err)
    return false
  }
}

export async function assignException(
  exceptionId: number,
  assignedToUserId: number
): Promise<boolean> {
  const client = useSupabaseClient()

  try {
    const { error } = await client
      .from('excepciones_vehiculos')
      .update({ asignado_a_usuario_id: assignedToUserId, estado: 'en_progreso' })
      .eq('id', exceptionId)

    if (error) {
      console.error('Error assigning exception:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Exception in assignException:', err)
    return false
  }
}
