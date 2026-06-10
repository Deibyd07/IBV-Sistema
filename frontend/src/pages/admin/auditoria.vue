<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVehiculoStore } from '~/stores/vehiculoStore'
import {
  getAuditLogs,
  getActiveLocks,
  getVehicleExceptions,
  unlockVehicle,
  lockVehicle,
} from '~/services/supabaseAuditService'
import type { AuditLog, VehicleLock, VehicleException } from '~/services/supabaseAuditService'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const vehiculoStore = useVehiculoStore()
const auditLogs = ref<AuditLog[]>([])
const activeLocks = ref<VehicleLock[]>([])
const vehicleExceptions = ref<VehicleException[]>([])
const loading = ref(false)
const searchTerm = ref('')
const filterType = ref<
  'all' | 'cambio_estado' | 'anulacion_admin' | 'desbloqueo_manual' | 'escalacion'
>('all')
const tab = ref<'logs' | 'locks' | 'exceptions'>('logs')

// Modal de bloqueo
const showLockModal = ref(false)
const lockFormData = ref({
  vehiculoId: '',
  reason: 'otra' as
    | 'bloqueada_en_estado'
    | 'esperando_revision_manual'
    | 'escalacion_pendiente'
    | 'mantenimiento'
    | 'otra',
  description: '',
})
const lockingVehicleId = ref<number | null>(null)

const filteredLogs = computed(() => {
  let logs = auditLogs.value

  if (filterType.value !== 'all') {
    logs = logs.filter((log) => log.tipo_accion === filterType.value)
  }

  if (searchTerm.value) {
    const q = searchTerm.value.toLowerCase()
    logs = logs.filter(
      (log) =>
        log.vehiculo_id.toString().includes(q) ||
        log.cambiado_por_rol.toLowerCase().includes(q) ||
        (log.razon && log.razon.toLowerCase().includes(q))
    )
  }

  return logs
})

const actionTypeLabel = (type: string) =>
  ({
    cambio_estado: 'Cambio de Estado',
    anulacion_admin: 'Anulación Admin',
    desbloqueo_manual: 'Desbloqueo Manual',
    escalacion: 'Escalada',
    nota_agregada: 'Nota Agregada',
  })[type] || type

const actionTypeBadge = (type: string) =>
  ({
    cambio_estado: 'bg-sky-500/10 text-sky-300',
    anulacion_admin: 'bg-red-500/10 text-red-300',
    desbloqueo_manual: 'bg-amber-400/10 text-amber-300',
    escalacion: 'bg-violet-500/10 text-violet-300',
    nota_agregada: 'bg-emerald-500/10 text-emerald-300',
  })[type] || 'bg-[#0d111a] text-zinc-200'

const lockReasonLabel = (reason: string) =>
  ({
    bloqueada_en_estado: 'Atrapado en Estado',
    esperando_revision_manual: 'Esperando Revisión',
    escalacion_pendiente: 'Escalada Pendiente',
    mantenimiento: 'Mantenimiento',
    otra: 'Otro',
  })[reason] || reason

const exceptionTypeLabel = (type: string) =>
  ({
    bloqueada_en_estado: 'Atrapado en Estado',
    retrasada_mas_de_3_dias: 'Retraso > 3 días',
    documento_faltante: 'Documento Faltante',
    problema_calidad: 'Problema de Calidad',
    otra: 'Otro',
  })[type] || type

const severityLabel = (severity: string) =>
  ({
    critica: 'CRÍTICA',
    alta: 'ALTA',
    media: 'MEDIA',
    baja: 'BAJA',
  })[severity] || severity.toUpperCase()

const statusLabel = (status: string) =>
  ({
    abierta: 'ABIERTA',
    en_progreso: 'EN PROGRESO',
    resuelta: 'RESUELTA',
    escalada: 'ESCALADA',
  })[status] || status.toUpperCase()

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const loadData = async () => {
  loading.value = true
  try {
    // Load vehicles if not loaded
    if (vehiculoStore.vehiculos.length === 0) {
      await vehiculoStore.loadFromSupabase()
    }

    // Get all audit logs (without filtering by vehicle - more efficient)
    auditLogs.value = await getAuditLogs()

    // Get active locks
    activeLocks.value = await getActiveLocks()

    // Get all exceptions (without filtering by vehicle - more efficient)
    vehicleExceptions.value = await getVehicleExceptions()
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const recargar = () => {
  loadData()
}

const getVehicleInfo = (vehiculoId: number) => {
  return vehiculoStore.vehiculos.find((v) => Number(v.id) === vehiculoId)
}

const openLockModal = (vehiculoId: number) => {
  lockingVehicleId.value = vehiculoId
  lockFormData.value = {
    vehiculoId: vehiculoId.toString(),
    reason: 'otra',
    description: '',
  }
  showLockModal.value = true
}

const closeLockModal = () => {
  showLockModal.value = false
  lockingVehicleId.value = null
}

const handleUnlock = async (lockId: number) => {
  try {
    const success = await unlockVehicle(lockId)
    if (success) {
      console.log('[Auditoria] Vehículo desbloqueado exitosamente')
      await loadData() // Recargar datos
    } else {
      console.error('[Auditoria] Error desbloqueando vehículo')
    }
  } catch (error) {
    console.error('[Auditoria] Exception desbloqueando:', error)
  }
}

const handleLock = async () => {
  if (!lockFormData.value.vehiculoId || !lockFormData.value.description) {
    console.warn('[Auditoria] ID vehículo y descripción son requeridos')
    return
  }

  try {
    const result = await lockVehicle({
      vehiculoId: parseInt(lockFormData.value.vehiculoId, 10),
      reason: lockFormData.value.reason,
      description: lockFormData.value.description,
    })

    if (result) {
      console.log('[Auditoria] Vehículo bloqueado exitosamente')
      await loadData() // Recargar datos
      closeLockModal()
    } else {
      console.error('[Auditoria] Error bloqueando vehículo')
    }
  } catch (error) {
    console.error('[Auditoria] Exception bloqueando:', error)
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
          ADM — Módulo Administración
        </p>
        <h1 class="font-display text-xl uppercase tracking-tight text-zinc-100">
          Auditoría y Control
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Registro completo de cambios, bloqueos y excepciones
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          @click="showLockModal = true"
          :disabled="loading"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Bloquear Vehículo
        </button>
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          @click="recargar"
          :disabled="loading"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8 8 0 104.582 9"
            />
          </svg>
          Recargar
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center">
            <svg
              class="w-5 h-5 text-amber-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Cambios
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">{{ auditLogs.length }}</p>
        <p class="text-sm text-zinc-500 mt-1">Registros de auditoría</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center">
            <svg
              class="w-5 h-5 text-amber-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Bloqueos
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">{{ activeLocks.length }}</p>
        <p class="text-sm text-zinc-500 mt-1">Vehículos bloqueados</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-red-300 bg-red-500/10 px-2 py-0.5 rounded-sm">
            Abiertas
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-red-400">
          {{ vehicleExceptions.filter((e) => e.estado === 'abierta').length }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Excepciones sin resolver</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        class="px-4 py-2 text-sm font-semibold rounded-md transition"
        :class="
          tab === 'logs' ? 'bg-amber-400/[0.12] text-amber-200' : 'text-zinc-500 hover:bg-[#0b0e14]'
        "
        @click="tab = 'logs'"
      >
        Registro de Cambios ({{ auditLogs.length }})
      </button>
      <button
        class="px-4 py-2 text-sm font-semibold rounded-md transition"
        :class="
          tab === 'locks' ? 'bg-amber-400/15 text-amber-300' : 'text-zinc-500 hover:bg-[#0b0e14]'
        "
        @click="tab = 'locks'"
      >
        Bloqueos Activos ({{ activeLocks.length }})
      </button>
      <button
        class="px-4 py-2 text-sm font-semibold rounded-md transition"
        :class="
          tab === 'exceptions' ? 'bg-red-500/15 text-red-300' : 'text-zinc-500 hover:bg-[#0b0e14]'
        "
        @click="tab = 'exceptions'"
      >
        Excepciones ({{ vehicleExceptions.length }})
      </button>
    </div>

    <!-- Audit Logs Tab -->
    <div v-if="tab === 'logs'" class="space-y-4">
      <div class="flex gap-3">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por ID vehículo, rol, razón..."
          class="flex-1 px-4 py-2.5 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
        />
        <select
          v-model="filterType"
          class="px-4 py-2.5 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
        >
          <option value="all">Todos los tipos</option>
          <option value="cambio_estado">Cambios de Estado</option>
          <option value="anulacion_admin">Anulación Admin</option>
          <option value="desbloqueo_manual">Desbloqueos</option>
          <option value="escalacion">Escaladas</option>
        </select>
      </div>

      <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[#0d111a] border-b border-white/[0.06]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">ID Vehículo</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">
                  Tipo de Acción
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">
                  Realizado por
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Cambio</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Razón</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Fecha</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.06]">
              <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-[#0d111a]">
                <td class="px-6 py-4">
                  <div class="font-data font-semibold text-zinc-100">{{ log.vehiculo_id }}</div>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="`px-3 py-1 rounded-sm text-xs font-semibold ${actionTypeBadge(log.tipo_accion)}`"
                  >
                    {{ actionTypeLabel(log.tipo_accion) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm">
                    <div class="font-semibold text-zinc-100">{{ log.cambiado_por_rol }}</div>
                    <div class="text-zinc-500 text-xs">ID: {{ log.cambiado_por_usuario_id }}</div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm max-w-xs">
                    <div class="text-red-300 font-data text-xs">
                      {{ log.estado_anterior.estado }}
                    </div>
                    <div class="text-emerald-300 font-data text-xs">
                      → {{ log.estado_nuevo.estado }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-zinc-400">{{ log.razon || '-' }}</td>
                <td class="px-6 py-4">
                  <div class="text-sm text-zinc-400 whitespace-nowrap">
                    {{ formatDate(log.creada_en) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredLogs.length === 0" class="px-6 py-12 text-center">
          <p class="text-zinc-500">No hay registros de auditoría</p>
        </div>
      </div>
    </div>

    <!-- Active Locks Tab -->
    <div
      v-if="tab === 'locks'"
      class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">ID Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Razón</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Bloqueado por</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Desde</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr v-for="lock in activeLocks" :key="lock.id" class="hover:bg-[#0d111a]">
              <td class="px-6 py-4">
                <div class="font-data font-semibold text-zinc-100">{{ lock.vehiculo_id }}</div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-amber-400/10 text-amber-300"
                >
                  {{ lockReasonLabel(lock.razon) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm text-zinc-400 max-w-xs">{{ lock.descripcion }}</p>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm">
                  <div class="font-semibold text-zinc-100">{{ lock.bloqueado_por_rol }}</div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-400 whitespace-nowrap">
                {{ formatDate(lock.bloqueado_en) }}
              </td>
              <td class="px-6 py-4">
                <button
                  class="px-3 py-1 bg-red-500/10 text-red-300 text-xs font-semibold rounded-md hover:bg-red-500/15"
                  @click="handleUnlock(lock.id)"
                >
                  Desbloquear
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="activeLocks.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay bloqueos activos</p>
      </div>
    </div>

    <!-- Exceptions Tab -->
    <div
      v-if="tab === 'exceptions'"
      class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">ID Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Severidad</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Créado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr v-for="exc in vehicleExceptions" :key="exc.id" class="hover:bg-[#0d111a]">
              <td class="px-6 py-4">
                <div class="font-data font-semibold text-zinc-100">{{ exc.vehiculo_id }}</div>
                <div v-if="getVehicleInfo(exc.vehiculo_id)" class="text-xs text-zinc-500 mt-0.5">
                  {{ getVehicleInfo(exc.vehiculo_id)?.bin }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-200">
                {{ exceptionTypeLabel(exc.tipo_excepcion) }}
              </td>
              <td class="px-6 py-4">
                <span
                  :class="{
                    'bg-red-500/10 text-red-300': exc.severidad === 'critica',
                    'bg-orange-500/10 text-orange-300': exc.severidad === 'alta',
                    'bg-amber-400/10 text-amber-300': exc.severidad === 'media',
                    'bg-sky-500/10 text-sky-300': exc.severidad === 'baja',
                  }"
                  class="px-3 py-1 rounded-sm text-xs font-semibold"
                >
                  {{ severityLabel(exc.severidad) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-400 max-w-xs">{{ exc.descripcion }}</td>
              <td class="px-6 py-4">
                <span
                  :class="{
                    'bg-red-500/10 text-red-300': exc.estado === 'abierta',
                    'bg-sky-500/10 text-sky-300': exc.estado === 'en_progreso',
                    'bg-emerald-500/10 text-emerald-300': exc.estado === 'resuelta',
                    'bg-violet-500/10 text-violet-300': exc.estado === 'escalada',
                  }"
                  class="px-3 py-1 rounded-sm text-xs font-semibold"
                >
                  {{ statusLabel(exc.estado) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-400 whitespace-nowrap">
                {{ formatDate(exc.creada_en) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="vehicleExceptions.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay excepciones registradas</p>
      </div>
    </div>

    <!-- Lock Modal -->
    <div
      v-if="showLockModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 max-w-md w-full"
      >
        <div class="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 class="font-display text-base uppercase tracking-tight text-zinc-100">
            Bloquear Vehículo
          </h3>
          <button @click="closeLockModal" class="text-zinc-500 hover:text-zinc-200 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="px-6 py-4 space-y-4">
          <div>
            <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Seleccionar Vehículo</label>
            <select
              v-model="lockFormData.vehiculoId"
              class="ibv-select"
            >
              <option value="">-- Selecciona un vehículo --</option>
              <option v-for="v in vehiculoStore.vehiculos" :key="v.id" :value="v.dbId.toString()">
                {{ v.vin || v.placa }} (ID: {{ v.dbId }})
              </option>
            </select>
          </div>

          <div>
            <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Razón del Bloqueo</label>
            <select
              v-model="lockFormData.reason"
              class="ibv-select"
            >
              <option value="bloqueada_en_estado">Atrapado en Estado</option>
              <option value="esperando_revision_manual">Esperando Revisión Manual</option>
              <option value="escalacion_pendiente">Escalada Pendiente</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="otra">Otro</option>
            </select>
          </div>

          <div>
            <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Descripción</label>
            <textarea
              v-model="lockFormData.description"
              rows="3"
              placeholder="Explica la razón del bloqueo..."
              class="ibv-textarea"
            />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-white/[0.06] flex gap-2 justify-end">
          <button
            @click="closeLockModal"
            class="px-4 py-2 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08] transition"
          >
            Cancelar
          </button>
          <button
            @click="handleLock"
            :disabled="!lockFormData.vehiculoId || !lockFormData.description"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bloquear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
