<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useVehiculoStore } from '~/stores/vehiculoStore'
import ForceStatusChangeModal from '~/components/admin/ForceStatusChangeModal.vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const vehiculoStore = useVehiculoStore()
const tab = ref<'listos' | 'despachados' | 'bloqueados'>('listos')
const searchTerm = ref('')
const showForceModal = ref(false)
const selectedVehiculo = ref<any>(null)
const loading = ref(false)

const listosDespachoList = computed(() => {
  const listos = vehiculoStore.vehiculos.filter(
    (v) => v.improntaCompletada && v.inventarioAprobado && !v.despachado
  )
  if (!searchTerm.value) return listos

  const q = searchTerm.value.toLowerCase()
  return listos.filter(
    (v) =>
      v.vin.toLowerCase().includes(q) ||
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.cliente.toLowerCase().includes(q)
  )
})

const despachadosVehiculos = computed(() => {
  const despachados = vehiculoStore.vehiculos.filter((v) => v.despachado)
  if (!searchTerm.value) return despachados

  const q = searchTerm.value.toLowerCase()
  return despachados.filter(
    (v) =>
      v.vin.toLowerCase().includes(q) ||
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.cliente.toLowerCase().includes(q)
  )
})

const bloqueadosVehiculos = computed(() => {
  const bloqueados = vehiculoStore.vehiculos.filter(
    (v) => !v.despachado && !(v.improntaCompletada && v.inventarioAprobado)
  )
  if (!searchTerm.value) return bloqueados

  const q = searchTerm.value.toLowerCase()
  return bloqueados.filter(
    (v) =>
      v.vin.toLowerCase().includes(q) ||
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.cliente.toLowerCase().includes(q)
  )
})

const estadisticas = computed(() => ({
  listos: listosDespachoList.value.length,
  despachados: vehiculoStore.despachados,
  bloqueados: bloqueadosVehiculos.value.length,
  total: vehiculoStore.total,
}))

const recargar = async () => {
  loading.value = true
  try {
    await vehiculoStore.loadFromSupabase()
  } finally {
    loading.value = false
  }
}

const openForceModal = (vehiculo: any) => {
  console.log('Vehículo seleccionado:', vehiculo)
  selectedVehiculo.value = vehiculo
  showForceModal.value = true
}

const closeForceModal = () => {
  showForceModal.value = false
  selectedVehiculo.value = null
}

const selectedVehiculoDbId = computed(() => {
  if (!selectedVehiculo.value) return null

  // Si tiene dbId directamente, usarlo
  if (selectedVehiculo.value.dbId) {
    return selectedVehiculo.value.dbId
  }

  // Si no, extraer del id con formato 'vp-49' -> 49
  if (selectedVehiculo.value.id) {
    const match = selectedVehiculo.value.id.match(/vp-(\d+)/)
    if (match) {
      return parseInt(match[1], 10)
    }
  }

  return null
})

const handleForceSuccess = () => {
  vehiculoStore.loadFromSupabase()
  closeForceModal()
}

onMounted(async () => {
  console.log('[Despacho] onMounted - vehiculos.length:', vehiculoStore.vehiculos.length)
  console.log('[Despacho] Siempre cargando de Supabase para asegurar datos frescos...')
  loading.value = true
  try {
    await vehiculoStore.loadFromSupabase()
    console.log('[Despacho] Cargados:', vehiculoStore.vehiculos.length)
  } catch (e) {
    console.error('[Despacho] Error cargando:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
          ADM — Módulo Administración
        </p>
        <h1 class="font-display text-xl uppercase tracking-tight text-zinc-100">
          Monitoreo Despacho
        </h1>
        <p class="text-sm text-zinc-500 mt-1">Control sobre salida y despacho de vehículos</p>
      </div>
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

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Listos
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">{{ estadisticas.listos }}</p>
        <p class="text-sm text-zinc-500 mt-1">Aprobados para salida</p>
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
                d="M8 17h.01M12 17h.01M16 17h.01M3.5 11l.5-2a2 2 0 011.9-1.4h12.2A2 2 0 0120 9l.5 2M4 17a2 2 0 01-2-2v-2h20v2a2 2 0 01-2 2H4z"
              />
            </svg>
          </div>
          <span
            class="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-sm"
          >
            Despachados
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-emerald-400">
          {{ estadisticas.despachados }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Procesados y entregados</p>
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
            Bloqueados
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">
          {{ estadisticas.bloqueados }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Retenidos por excepción</p>
      </div>
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
        <p class="font-data text-3xl font-bold text-zinc-400">{{ estadisticas.total }}</p>
        <p class="text-sm text-zinc-500 mt-1">Vehículos en el sistema</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button
        class="px-4 py-2 text-sm font-semibold rounded-md transition"
        :class="
          tab === 'listos'
            ? 'bg-amber-400/[0.12] text-amber-200'
            : 'text-zinc-500 hover:bg-[#0b0e14]'
        "
        @click="tab = 'listos'"
      >
        Listos ({{ listosDespachoList.length }})
      </button>
      <button
        class="px-4 py-2 text-sm font-semibold rounded-md transition"
        :class="
          tab === 'despachados'
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'text-zinc-500 hover:bg-[#0b0e14]'
        "
        @click="tab = 'despachados'"
      >
        Despachados ({{ estadisticas.despachados }})
      </button>
      <button
        class="px-4 py-2 text-sm font-semibold rounded-md transition"
        :class="
          tab === 'bloqueados'
            ? 'bg-amber-400/15 text-amber-300'
            : 'text-zinc-500 hover:bg-[#0b0e14]'
        "
        @click="tab = 'bloqueados'"
      >
        Bloqueados ({{ estadisticas.bloqueados }})
      </button>
    </div>

    <!-- Búsqueda -->
    <div class="mb-6">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Buscar por VIN, placa, marca, modelo o cliente..."
        class="w-full px-4 py-2.5 border border-white/[0.08] rounded-md focus:outline-none focus:border-amber-400/70"
      />
    </div>

    <!-- Tabla Listos -->
    <div
      v-if="tab === 'listos'"
      class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">VIN / Placa</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Impronta</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Inventario</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr
              v-for="vehiculo in listosDespachoList"
              :key="vehiculo.id"
              class="hover:bg-[#0d111a] transition"
            >
              <td class="px-6 py-4 text-sm font-data text-zinc-100">
                <span class="block font-semibold">{{ vehiculo.vin }}</span>
                <span class="text-zinc-500">{{ vehiculo.placa }}</span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span class="block font-semibold text-zinc-100">
                  {{ vehiculo.marca }} {{ vehiculo.modelo }}
                </span>
                <span class="text-zinc-500">{{ vehiculo.anio }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-100">{{ vehiculo.cliente }}</td>
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  ✓ Completada
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  ✓ Aprobado
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-amber-400/[0.08] text-amber-200"
                >
                  Listo
                </span>
              </td>
              <td class="px-6 py-4">
                <button
                  @click="openForceModal(vehiculo)"
                  class="px-3 py-1 bg-red-500/10 text-red-300 text-xs font-semibold rounded-md hover:bg-red-500/15"
                >
                  Forzar Estado
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="listosDespachoList.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay vehículos listos para despacho</p>
      </div>
    </div>

    <!-- Tabla Despachados -->
    <div
      v-if="tab === 'despachados'"
      class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">VIN / Placa</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr
              v-for="vehiculo in despachadosVehiculos"
              :key="vehiculo.id"
              class="hover:bg-[#0d111a] transition"
            >
              <td class="px-6 py-4 text-sm font-data text-zinc-100">
                <span class="block font-semibold">{{ vehiculo.vin }}</span>
                <span class="text-zinc-500">{{ vehiculo.placa }}</span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span class="block font-semibold text-zinc-100">
                  {{ vehiculo.marca }} {{ vehiculo.modelo }}
                </span>
                <span class="text-zinc-500">{{ vehiculo.anio }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-100">{{ vehiculo.cliente }}</td>
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  ✓ Despachado
                </span>
              </td>
              <td class="px-6 py-4">
                <button
                  @click="openForceModal(vehiculo)"
                  class="px-3 py-1 bg-red-500/10 text-red-300 text-xs font-semibold rounded-md hover:bg-red-500/15"
                >
                  Forzar Estado
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="despachadosVehiculos.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay vehículos despachados</p>
      </div>
    </div>

    <!-- Tabla Bloqueados -->
    <div
      v-if="tab === 'bloqueados'"
      class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">VIN / Placa</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Impronta</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Inventario</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Razón Bloqueo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr
              v-for="vehiculo in bloqueadosVehiculos"
              :key="vehiculo.id"
              class="hover:bg-[#0d111a] transition"
            >
              <td class="px-6 py-4 text-sm font-data text-zinc-100">
                <span class="block font-semibold">{{ vehiculo.vin }}</span>
                <span class="text-zinc-500">{{ vehiculo.placa }}</span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span class="block font-semibold text-zinc-100">
                  {{ vehiculo.marca }} {{ vehiculo.modelo }}
                </span>
                <span class="text-zinc-500">{{ vehiculo.anio }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-100">{{ vehiculo.cliente }}</td>
              <td class="px-6 py-4">
                <span
                  v-if="vehiculo.improntaCompletada"
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  ✓ OK
                </span>
                <span
                  v-else
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-red-500/10 text-red-300"
                >
                  ✗ Pendiente
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="vehiculo.inventarioAprobado"
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  ✓ OK
                </span>
                <span
                  v-else
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-red-500/10 text-red-300"
                >
                  ✗ Pendiente
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span
                  v-if="!vehiculo.improntaCompletada && !vehiculo.inventarioAprobado"
                  class="text-amber-300 font-semibold"
                >
                  Falta Impronta e Inventario
                </span>
                <span v-else-if="!vehiculo.improntaCompletada" class="text-amber-300 font-semibold">
                  Falta Impronta
                </span>
                <span v-else class="text-amber-300 font-semibold">Falta Inventario</span>
              </td>
              <td class="px-6 py-4">
                <button
                  @click="openForceModal(vehiculo)"
                  class="px-3 py-1 bg-red-500/10 text-red-300 text-xs font-semibold rounded-md hover:bg-red-500/15"
                >
                  Forzar Estado
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="bloqueadosVehiculos.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay vehículos bloqueados</p>
      </div>
    </div>

    <!-- Force Status Modal -->
    <ForceStatusChangeModal
      v-if="selectedVehiculo"
      :is-open="showForceModal"
      :vehiculo-id="selectedVehiculoDbId"
      :current-status="selectedVehiculo.estado"
      @close="closeForceModal"
      @success="handleForceSuccess"
    />
  </div>
</template>
