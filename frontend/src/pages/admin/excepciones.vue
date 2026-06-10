<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVehiculoStore } from '~/stores/vehiculoStore'
import {
  getOpenExceptions,
  getVehicleExceptions,
  createException,
  updateExceptionStatus,
  assignException,
} from '~/services/supabaseAuditService'
import { supabaseUserService, type SupabaseUser } from '~/services/supabaseUserService'
import type {
  VehicleException,
  ExceptionSeverity,
  ExceptionType,
} from '~/services/supabaseAuditService'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const vehiculoStore = useVehiculoStore()
const exceptions = ref<VehicleException[]>([])
const users = ref<SupabaseUser[]>([])
const loading = ref(false)
const statusFilter = ref<'all' | 'abierta' | 'en_progreso' | 'resuelta' | 'escalada'>('all')
const severityFilter = ref<'all' | 'baja' | 'media' | 'alta' | 'critica'>('all')

// Modal de crear excepción
const showCreateModal = ref(false)
const formData = ref({
  vehiculoId: '',
  exceptionType: 'bloqueada_en_estado' as ExceptionType,
  severity: 'alta' as ExceptionSeverity,
  description: '',
})

const filteredExceptions = computed(() => {
  let exc = exceptions.value

  if (statusFilter.value !== 'all') {
    exc = exc.filter((e) => e.estado === statusFilter.value)
  }

  if (severityFilter.value !== 'all') {
    exc = exc.filter((e) => e.severidad === severityFilter.value)
  }

  return exc.sort((a, b) => {
    const severityOrder = { critica: 0, alta: 1, media: 2, baja: 3 }
    const aOrder = severityOrder[a.severidad as keyof typeof severityOrder] || 99
    const bOrder = severityOrder[b.severidad as keyof typeof severityOrder] || 99
    return aOrder - bOrder || new Date(b.creada_en).getTime() - new Date(a.creada_en).getTime()
  })
})

const severityBadge = (severity: string) =>
  ({
    critica: 'bg-red-500/10 text-red-300',
    alta: 'bg-orange-500/10 text-orange-300',
    media: 'bg-amber-400/10 text-amber-300',
    baja: 'bg-sky-500/10 text-sky-300',
  })[severity] || 'bg-[#0d111a] text-zinc-200'

const statusBadge = (status: string) =>
  ({
    abierta: 'bg-red-500/10 text-red-300',
    en_progreso: 'bg-sky-500/10 text-sky-300',
    resuelta: 'bg-emerald-500/10 text-emerald-300',
    escalada: 'bg-violet-500/10 text-violet-300',
  })[status] || 'bg-[#0d111a] text-zinc-200'

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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

const loadData = async () => {
  loading.value = true
  try {
    // Cargar vehículos si no están cargados
    if (vehiculoStore.vehiculos.length === 0) {
      await vehiculoStore.loadFromSupabase()
    }

    // Cargar TODAS las excepciones (no solo las abiertas)
    exceptions.value = await getVehicleExceptions()
    users.value = await supabaseUserService.getAllUsers()
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const openCreateModal = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  formData.value = {
    vehiculoId: '',
    exceptionType: 'bloqueada_en_estado',
    severity: 'alta',
    description: '',
  }
}

const submitCreateException = async () => {
  // Validación más robusta
  if (!formData.value.vehiculoId || formData.value.vehiculoId === '') {
    alert('Por favor selecciona un vehículo')
    return
  }

  const vehiculoIdNum = parseInt(formData.value.vehiculoId, 10)

  if (isNaN(vehiculoIdNum) || vehiculoIdNum <= 0) {
    alert(`ID de vehículo inválido: "${formData.value.vehiculoId}"`)
    return
  }

  if (!formData.value.description.trim()) {
    alert('Por favor escribe una descripción')
    return
  }

  console.log('[submitCreateException] Enviando:', {
    vehiculoId: vehiculoIdNum,
    exceptionType: formData.value.exceptionType,
    severity: formData.value.severity,
    description: formData.value.description,
  })

  try {
    const result = await createException({
      vehiculoId: vehiculoIdNum,
      exceptionType: formData.value.exceptionType,
      severity: formData.value.severity,
      description: formData.value.description,
    })

    if (!result) {
      throw new Error('No se pudo crear la excepción - revisa permisos RLS')
    }

    closeCreateModal()
    await loadData()
  } catch (err) {
    console.error('Error creating exception:', err)
    alert(
      `Error al crear la excepción: ${err instanceof Error ? err.message : 'Error desconocido'}`
    )
  }
}

const updateStatus = async (exceptionId: number, newStatus: string) => {
  try {
    await updateExceptionStatus(exceptionId, newStatus as any)
    await loadData()
  } catch (err) {
    console.error('Error updating status:', err)
    alert('Error al actualizar estado')
  }
}

const assignToUser = async (exceptionId: number, userId: number) => {
  try {
    await assignException(exceptionId, userId)
    await loadData()
  } catch (err) {
    console.error('Error assigning:', err)
    alert('Error al asignar')
  }
}

const getVehicleInfo = (vehiculoId: number) => {
  return vehiculoStore.vehiculos.find((v) => Number(v.id) === vehiculoId)
}

const recargar = () => {
  loadData()
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
          Gestión de Excepciones
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Crear y resolver excepciones en el flujo de vehículos
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08]"
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
        <button
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black rounded-md font-medium text-sm hover:bg-amber-300 transition"
          @click="openCreateModal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nueva Excepción
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-sm">
            Total
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-zinc-400">{{ exceptions.length }}</p>
        <p class="text-sm text-zinc-500 mt-1">Excepciones registradas</p>
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
        <p class="font-data text-3xl font-bold text-red-300">
          {{ exceptions.filter((e) => e.estado === 'abierta').length }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Pendientes de atención</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-sm">
            En Progreso
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-sky-300">
          {{ exceptions.filter((e) => e.estado === 'en_progreso').length }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">En proceso de resolución</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <svg
              class="w-5 h-5 text-emerald-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span
            class="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-sm"
          >
            Resueltas
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-emerald-300">
          {{ exceptions.filter((e) => e.estado === 'resuelta').length }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Cerradas con solución</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-6 flex-wrap">
      <select
        v-model="statusFilter"
        class="px-4 py-2.5 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
      >
        <option value="all">Todos los estados</option>
        <option value="abierta">Abiertas</option>
        <option value="en_progreso">En Progreso</option>
        <option value="resuelta">Resueltas</option>
        <option value="escalada">Escaladas</option>
      </select>
      <select
        v-model="severityFilter"
        class="px-4 py-2.5 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
      >
        <option value="all">Todas las severidades</option>
        <option value="critica">Crítica</option>
        <option value="alta">Alta</option>
        <option value="media">Media</option>
        <option value="baja">Baja</option>
      </select>
    </div>

    <!-- Exceptions Table -->
    <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">ID Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Severidad</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Asignado a</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Creada</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr v-for="exc in filteredExceptions" :key="exc.id" class="hover:bg-[#0d111a]">
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
                  :class="`px-3 py-1 rounded-sm text-xs font-semibold ${severityBadge(exc.severidad)}`"
                >
                  {{ severityLabel(exc.severidad) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="`px-3 py-1 rounded-sm text-xs font-semibold ${statusBadge(exc.estado)}`"
                >
                  {{ statusLabel(exc.estado) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-400 max-w-xs">{{ exc.descripcion }}</td>
              <td class="px-6 py-4">
                <select
                  :value="exc.asignado_a_usuario_id || ''"
                  @change="
                    (e) => assignToUser(exc.id, parseInt((e.target as HTMLSelectElement).value))
                  "
                  class="px-3 py-1 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70"
                >
                  <option value="">Sin asignar</option>
                  <option v-for="user in users" :key="user.id" :value="user.id">
                    {{ user.nombres }} {{ user.apellidos }} ({{ user.rol }})
                  </option>
                </select>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-400 whitespace-nowrap">
                {{ formatDate(exc.creada_en) }}
              </td>
              <td class="px-6 py-4">
                <select
                  :value="exc.estado"
                  @change="(e) => updateStatus(exc.id, (e.target as HTMLSelectElement).value)"
                  class="px-3 py-1 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70"
                >
                  <option value="abierta">Abierta</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="resuelta">Resuelta</option>
                  <option value="escalada">Escalada</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredExceptions.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay excepciones que mostrar</p>
      </div>
    </div>

    <!-- Create Exception Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        @click.self="closeCreateModal"
      >
        <div
          class="bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 max-w-md w-full"
        >
          <div class="px-6 py-4 border-b border-white/[0.06]">
            <h2 class="font-display text-base uppercase tracking-tight text-zinc-100">
              Nueva Excepción
            </h2>
          </div>

          <div class="px-6 py-4 space-y-4">
            <div>
              <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">ID del Vehículo *</label>
              <select
                v-model="formData.vehiculoId"
                class="ibv-select"
              >
                <option value="">Selecciona un vehículo</option>
                <option
                  v-for="vehiculo in vehiculoStore.vehiculos"
                  :key="vehiculo.id"
                  :value="vehiculo.id.replace('vp-', '')"
                >
                  {{ vehiculo.vin }} - {{ vehiculo.placa }} ({{ vehiculo.marca }}
                  {{ vehiculo.modelo }})
                </option>
              </select>
            </div>

            <div>
              <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
                Tipo de Excepción *
              </label>
              <select
                v-model="formData.exceptionType"
                class="ibv-select"
              >
                <option value="bloqueada_en_estado">Atrapado en Estado</option>
                <option value="retrasada_mas_de_3_dias">Retardo > 3 días</option>
                <option value="documento_faltante">Documento Faltante</option>
                <option value="problema_calidad">Problema de Calidad</option>
                <option value="otra">Otro</option>
              </select>
            </div>

            <div>
              <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Severidad *</label>
              <select
                v-model="formData.severity"
                class="ibv-select"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>

            <div>
              <label class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Descripción *</label>
              <textarea
                v-model="formData.description"
                rows="4"
                class="ibv-textarea"
                placeholder="Describe el problema..."
              />
            </div>
          </div>

          <div class="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end">
            <button
              class="px-4 py-2 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08]"
              @click="closeCreateModal"
            >
              Cancelar
            </button>
            <button
              class="px-4 py-2 bg-amber-400 text-black font-semibold rounded-md hover:bg-amber-300"
              @click="submitCreateException"
            >
              Crear
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
