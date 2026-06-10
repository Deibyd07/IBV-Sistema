<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVehiculoStore } from '~/stores/vehiculoStore'
import ForceStatusChangeModal from '~/components/admin/ForceStatusChangeModal.vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const vehiculoStore = useVehiculoStore()
const tab = ref<'pendientes' | 'completados'>('pendientes')
const searchTerm = ref('')
const showForceModal = ref(false)
const selectedVehiculo = ref<any>(null)
const loading = ref(false)

const pendientesInventario = computed(() => {
  const pendientes = vehiculoStore.getPendientesInventario
  if (!searchTerm.value) return pendientes

  const q = searchTerm.value.toLowerCase()
  return pendientes.filter(
    (v) =>
      v.vin.toLowerCase().includes(q) ||
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.cliente.toLowerCase().includes(q)
  )
})

const completadosInventario = computed(() => {
  const completados = vehiculoStore.getListosParaDespacho
  if (!searchTerm.value) return completados

  const q = searchTerm.value.toLowerCase()
  return completados.filter(
    (v) =>
      v.vin.toLowerCase().includes(q) ||
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.cliente.toLowerCase().includes(q)
  )
})

const estadisticas = computed(() => ({
  pendientes: vehiculoStore.pendientesInventario,
  completados: vehiculoStore.getListosParaDespacho.length,
  conImpronta: vehiculoStore.conImpronta,
  despachados: vehiculoStore.despachados,
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
  if (selectedVehiculo.value.dbId) return selectedVehiculo.value.dbId
  if (selectedVehiculo.value.id) {
    const match = selectedVehiculo.value.id.match(/vp-(\d+)/)
    if (match) return parseInt(match[1], 10)
  }
  return null
})

const handleForceSuccess = () => {
  vehiculoStore.loadFromSupabase()
  closeForceModal()
}

onMounted(async () => {
  if (vehiculoStore.vehiculos.length === 0) {
    loading.value = true
    try {
      await vehiculoStore.loadFromSupabase()
    } finally {
      loading.value = false
    }
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
          Monitoreo Inventario
        </h1>
        <p class="text-sm text-zinc-500 mt-1">Control sobre inspección y auditoría de inventario</p>
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Pendientes
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">
          {{ estadisticas.pendientes }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Vehículos por inspeccionar</p>
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
            Listos
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-emerald-400">
          {{ estadisticas.completados }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Inventario aprobado</p>
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Impronta
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">
          {{ estadisticas.conImpronta }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Con impronta completada</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 17h.01M12 17h.01M16 17h.01M3.5 11l.5-2a2 2 0 011.9-1.4h12.2A2 2 0 0120 9l.5 2M4 17a2 2 0 01-2-2v-2h20v2a2 2 0 01-2 2H4z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-sm">
            Salidos
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-zinc-400">
          {{ estadisticas.despachados }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Fuera del sistema</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-4">
      <button
        class="px-4 py-2 text-sm font-semibold rounded-md transition"
        :class="
          tab === 'pendientes'
            ? 'bg-amber-400/15 text-amber-300'
            : 'text-zinc-500 hover:bg-[#0b0e14]'
        "
        @click="tab = 'pendientes'"
      >
        Pendientes ({{ pendientesInventario.length }})
      </button>
      <button
        class="px-4 py-2 text-sm font-semibold rounded-md transition"
        :class="
          tab === 'completados'
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'text-zinc-500 hover:bg-[#0b0e14]'
        "
        @click="tab = 'completados'"
      >
        Completados ({{ completadosInventario.length }})
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

    <!-- Tabla Pendientes -->
    <div
      v-if="tab === 'pendientes'"
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
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr
              v-for="vehiculo in pendientesInventario"
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
                  ✓ Completada
                </span>
                <span
                  v-else
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-red-500/10 text-red-300"
                >
                  ✗ Sin Impronta
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-amber-400/10 text-amber-300"
                >
                  Pendiente Revisión
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
      <div v-if="pendientesInventario.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay vehículos pendientes de inventario</p>
      </div>
    </div>

    <!-- Tabla Completados -->
    <div
      v-if="tab === 'completados'"
      class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">VIN / Placa</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Inventario</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr
              v-for="vehiculo in completadosInventario"
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
                  v-if="vehiculo.inventarioAprobado"
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  ✓ Aprobado
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  Listo Despacho
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
      <div v-if="completadosInventario.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay vehículos listos para despacho</p>
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
