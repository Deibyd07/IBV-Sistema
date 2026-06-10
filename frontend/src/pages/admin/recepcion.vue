<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVehiculoStore } from '~/stores/vehiculoStore'
import ForceStatusChangeModal from '~/components/admin/ForceStatusChangeModal.vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const vehiculoStore = useVehiculoStore()
const searchTerm = ref('')
const showForceModal = ref(false)
const selectedVehiculo = ref<any>(null)
const loading = ref(false)

const recibidosVehiculos = computed(() => {
  const recibidos = vehiculoStore.vehiculos.filter((v) => !v.despachado)
  if (!searchTerm.value) return recibidos

  const q = searchTerm.value.toLowerCase()
  return recibidos.filter(
    (v) =>
      v.vin.toLowerCase().includes(q) ||
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.cliente.toLowerCase().includes(q)
  )
})

const estadoVehLabel = (e: string) =>
  ({
    recibido: 'Recibido',
    impronta_pendiente: 'Impronta Pend.',
    impronta_completada: 'Impronta OK',
    inventario_pendiente: 'Inventario Pend.',
    inventario_aprobado: 'Inventario OK',
    listo_despacho: 'Listo Despacho',
    despachado: 'Despachado',
  })[e] || e

const estadoVehBadge = (e: string) =>
  ({
    recibido: 'bg-sky-500/10 text-sky-300',
    impronta_pendiente: 'bg-amber-400/10 text-amber-300',
    impronta_completada: 'bg-emerald-500/10 text-emerald-300',
    inventario_pendiente: 'bg-orange-500/10 text-orange-300',
    inventario_aprobado: 'bg-teal-500/10 text-teal-300',
    listo_despacho: 'bg-violet-500/10 text-violet-300',
    despachado: 'bg-[#0b0e14] text-zinc-500',
  })[e] || 'bg-[#0b0e14] text-zinc-500'

const estadisticas = computed(() => ({
  recibidos: vehiculoStore.vehiculos.filter((v) => v.estado === 'recibido').length,
  improntaPend: vehiculoStore.vehiculos.filter((v) => v.estado === 'impronta_pendiente').length,
  improntaOk: vehiculoStore.vehiculos.filter((v) => v.estado === 'impronta_completada').length,
  inventarioPend: vehiculoStore.vehiculos.filter((v) => v.estado === 'inventario_pendiente').length,
  inventarioOk: vehiculoStore.vehiculos.filter((v) => v.estado === 'inventario_aprobado').length,
  listoDespacho: vehiculoStore.listosDespacho,
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
          Monitoreo Recepción
        </h1>
        <p class="text-sm text-zinc-500 mt-1">
          Control sobre el proceso de recepción e impronta de vehículos
        </p>
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
    <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      <div class="bg-[#10141c] rounded-lg p-4 shadow-sm border border-white/[0.06]">
        <div class="w-9 h-9 bg-sky-500/10 rounded-lg flex items-center justify-center mb-2">
          <svg class="w-4 h-4 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        </div>
        <p class="font-data text-2xl font-bold text-sky-300">{{ estadisticas.recibidos }}</p>
        <p class="text-xs text-zinc-500 mt-1">Recibidos</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-4 shadow-sm border border-white/[0.06]">
        <div class="w-9 h-9 bg-amber-400/10 rounded-lg flex items-center justify-center mb-2">
          <svg
            class="w-4 h-4 text-amber-300"
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
        <p class="font-data text-2xl font-bold text-amber-300">
          {{ estadisticas.improntaPend }}
        </p>
        <p class="text-xs text-zinc-500 mt-1">Impronta Pend.</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-4 shadow-sm border border-white/[0.06]">
        <div class="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-2">
          <svg
            class="w-4 h-4 text-emerald-300"
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
        <p class="font-data text-2xl font-bold text-emerald-300">
          {{ estadisticas.improntaOk }}
        </p>
        <p class="text-xs text-zinc-500 mt-1">Impronta OK</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-4 shadow-sm border border-white/[0.06]">
        <div class="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center mb-2">
          <svg
            class="w-4 h-4 text-orange-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-5 8h4m-4 4h4"
            />
          </svg>
        </div>
        <p class="font-data text-2xl font-bold text-orange-300">
          {{ estadisticas.inventarioPend }}
        </p>
        <p class="text-xs text-zinc-500 mt-1">Inventario Pend.</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-4 shadow-sm border border-white/[0.06]">
        <div class="w-9 h-9 bg-teal-500/10 rounded-lg flex items-center justify-center mb-2">
          <svg
            class="w-4 h-4 text-teal-300"
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
        <p class="font-data text-2xl font-bold text-teal-300">{{ estadisticas.inventarioOk }}</p>
        <p class="text-xs text-zinc-500 mt-1">Inventario OK</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-4 shadow-sm border border-white/[0.06]">
        <div class="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center mb-2">
          <svg
            class="w-4 h-4 text-violet-300"
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
        <p class="font-data text-2xl font-bold text-violet-300">
          {{ estadisticas.listoDespacho }}
        </p>
        <p class="text-xs text-zinc-500 mt-1">Listo Despacho</p>
      </div>
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

    <!-- Tabla de vehículos -->
    <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">VIN / Placa</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Vehículo</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Impronta</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Inventario</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-zinc-200">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.06]">
            <tr
              v-for="vehiculo in recibidosVehiculos"
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
                  :class="`px-3 py-1 rounded-sm text-xs font-semibold ${estadoVehBadge(vehiculo.estado)}`"
                >
                  {{ estadoVehLabel(vehiculo.estado) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span
                  v-if="vehiculo.improntaCompletada"
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  ✓ Completada
                </span>
                <span
                  v-else
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-amber-400/10 text-amber-300"
                >
                  Pendiente
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span
                  v-if="vehiculo.inventarioAprobado"
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-emerald-500/10 text-emerald-300"
                >
                  ✓ Aprobado
                </span>
                <span
                  v-else
                  class="px-3 py-1 rounded-sm text-xs font-semibold bg-orange-500/10 text-orange-300"
                >
                  Pendiente
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
      <div v-if="recibidosVehiculos.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-500">No hay vehículos para mostrar</p>
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
