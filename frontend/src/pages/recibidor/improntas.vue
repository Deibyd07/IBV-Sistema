<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVehiculoStore, type VehiculoPipeline } from '~/stores/vehiculoStore'
import { useImprontaStore, type Impronta } from '~/stores/improntaStore'

definePageMeta({ layout: 'admin', middleware: ['auth', 'recibidor'] })

const vehiculoStore = useVehiculoStore()
const improntaStore = useImprontaStore()

// ── Tab activa ──────────────────────────────────
type TabKey = 'pendientes' | 'completadas' | 'todas'
const tabActiva = ref<TabKey>('pendientes')

const tabs: { key: TabKey; label: string; color: string }[] = [
  { key: 'pendientes', label: 'Impronta Pendiente', color: 'amber' },
  { key: 'completadas', label: 'Impronta Completada', color: 'green' },
  { key: 'todas', label: 'Todos', color: 'sky' },
]

// ── Búsqueda ────────────────────────────────────
const busqueda = ref('')

// ── Helper: buscar impronta por VIN ─────────────
const improntaDeVehiculo = (vin: string): Impronta | undefined => {
  return improntaStore.improntas.find((i: Impronta) => i.vin.toLowerCase() === vin.toLowerCase())
}

// ── Listas filtradas ────────────────────────────
const vehiculosFiltrados = computed(() => {
  let lista: VehiculoPipeline[]

  if (tabActiva.value === 'pendientes') {
    lista = vehiculoStore.vehiculos.filter(
      (v: VehiculoPipeline) => !v.improntaCompletada && !v.despachado
    )
  } else if (tabActiva.value === 'completadas') {
    lista = vehiculoStore.vehiculos.filter((v: VehiculoPipeline) => v.improntaCompletada)
  } else {
    lista = [...vehiculoStore.vehiculos].filter((v: VehiculoPipeline) => !v.despachado)
  }

  if (busqueda.value) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(
      (v: VehiculoPipeline) =>
        v.vin.toLowerCase().includes(q) ||
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.cliente.toLowerCase().includes(q)
    )
  }

  return lista
})

// ── Contadores ──────────────────────────────────
const totalPendientes = computed(
  () =>
    vehiculoStore.vehiculos.filter((v: VehiculoPipeline) => !v.improntaCompletada && !v.despachado)
      .length
)
const totalCompletadas = computed(
  () => vehiculoStore.vehiculos.filter((v: VehiculoPipeline) => v.improntaCompletada).length
)

// ── Estado badge ────────────────────────────────
const estadoImpronta = (v: VehiculoPipeline) => {
  if (v.improntaCompletada) {
    const imp = improntaDeVehiculo(v.vin)
    if (imp?.estado === 'revisada') return { label: 'Revisada', color: 'purple' }
    return { label: 'Completada', color: 'green' }
  }
  // Tiene impronta en borrador?
  const imp = improntaDeVehiculo(v.vin)
  if (imp?.estado === 'borrador') return { label: 'Borrador', color: 'blue' }
  return { label: 'Pendiente', color: 'amber' }
}

const badgeClasses = (color: string) =>
  ({
    amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    green: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
    blue: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
    purple: 'bg-teal-500/10 text-teal-300 ring-teal-500/20',
    gray: 'bg-[#0d111a] text-zinc-400 ring-white/10',
  })[color] || 'bg-[#0d111a] text-zinc-400 ring-white/10'

// ── Detalle expandido ───────────────────────────
const expandedId = ref<string | null>(null)
const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
          REC — Módulo Recepción
        </p>
        <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
          Estado de Improntas
        </h1>
        <p class="text-zinc-500 mt-1">Control de vehículos con impronta pendiente y completada</p>
      </div>
      <NuxtLink
        to="/recibidor/impronta"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black font-semibold rounded-md hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Nueva Impronta
      </NuxtLink>
    </div>

    <!-- Resumen rápido -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
        <p class="font-data text-3xl font-bold text-amber-300">{{ totalPendientes }}</p>
        <p class="text-sm text-zinc-500 mt-1">Improntas por realizar</p>
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
            Completadas
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-emerald-300">{{ totalCompletadas }}</p>
        <p class="text-sm text-zinc-500 mt-1">Improntas realizadas</p>
      </div>

      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8l2-2zM13 6h4l3 3v4h-7V6z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-sm">
            Total
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-sky-300">
          {{ vehiculoStore.vehiculos.filter((v: VehiculoPipeline) => !v.despachado).length }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Vehículos activos</p>
      </div>
    </div>

    <!-- Tabs + búsqueda -->
    <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06]"
      >
        <!-- Tabs -->
        <div class="flex gap-1 bg-[#0b0e14] rounded-lg p-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200"
            :class="
              tabActiva === tab.key
                ? 'bg-[#10141c] text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-200'
            "
            @click="tabActiva = tab.key"
          >
            {{ tab.label }}
            <span
              v-if="tab.key === 'pendientes'"
              class="ml-1.5 text-xs font-bold bg-amber-400/15 text-amber-300 px-1.5 py-0.5 rounded-sm"
            >
              {{ totalPendientes }}
            </span>
            <span
              v-else-if="tab.key === 'completadas'"
              class="ml-1.5 text-xs font-bold bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded-sm"
            >
              {{ totalCompletadas }}
            </span>
          </button>
        </div>

        <!-- Búsqueda -->
        <div class="relative w-full sm:w-72">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar VIN, placa, marca..."
            class="w-full pl-9 pr-4 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 bg-[#10141c]"
          />
        </div>
      </div>

      <!-- Tabla de vehículos -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-[#0d111a]/80 border-b border-white/[0.06]">
              <th
                class="px-5 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Vehículo
              </th>
              <th
                class="px-5 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                VIN
              </th>
              <th
                class="px-5 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Placa
              </th>
              <th
                class="px-5 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Recepción
              </th>
              <th
                class="px-5 py-3 text-center font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Estado Impronta
              </th>
              <th
                class="px-5 py-3 text-center font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Acción
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.04]">
            <tr
              v-for="veh in vehiculosFiltrados"
              :key="veh.id"
              class="hover:bg-[#0d111a]/60 transition group"
            >
              <td class="px-5 py-3.5">
                <div>
                  <p class="font-semibold text-zinc-100">
                    {{ veh.marca }} {{ veh.modelo }}
                    <span v-if="veh.anio" class="text-zinc-500 font-normal">{{ veh.anio }}</span>
                  </p>
                  <p class="text-xs text-zinc-500 mt-0.5">
                    {{ veh.color || 'Sin color' }}
                    <span v-if="veh.cliente">· {{ veh.cliente }}</span>
                  </p>
                </div>
              </td>
              <td class="px-5 py-3.5 font-data text-xs text-zinc-400">
                {{ veh.vin }}
              </td>
              <td class="px-5 py-3.5 text-zinc-400">
                {{ veh.placa || '—' }}
              </td>
              <td class="px-5 py-3.5 text-zinc-500 text-xs">
                {{ veh.fechaRecepcion || '—' }}
              </td>
              <td class="px-5 py-3.5 text-center">
                <span
                  :class="[
                    badgeClasses(estadoImpronta(veh).color),
                    'text-xs font-semibold px-2.5 py-1 rounded-sm inline-flex items-center gap-1 ring-1 ring-inset',
                  ]"
                >
                  <!-- Icono según estado -->
                  <svg
                    v-if="estadoImpronta(veh).color === 'green'"
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <svg
                    v-else-if="estadoImpronta(veh).color === 'amber'"
                    class="w-3.5 h-3.5"
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
                  <svg
                    v-else-if="estadoImpronta(veh).color === 'blue'"
                    class="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {{ estadoImpronta(veh).label }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-center">
                <NuxtLink
                  v-if="!veh.improntaCompletada"
                  :to="`/recibidor/impronta?vin=${encodeURIComponent(veh.vin)}&marca=${encodeURIComponent(veh.marca)}&modelo=${encodeURIComponent(veh.modelo)}&anio=${encodeURIComponent(veh.anio)}&color=${encodeURIComponent(veh.color)}&placa=${encodeURIComponent(veh.placa)}&cliente=${encodeURIComponent(veh.cliente)}`"
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 text-black text-xs font-semibold rounded-md hover:bg-amber-300 transition shadow-sm"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Crear Impronta
                </NuxtLink>
                <button
                  v-else
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-white/[0.08] text-zinc-400 text-xs font-semibold rounded-md hover:bg-[#0d111a] transition"
                  @click="toggleExpand(veh.id)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Ver Detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Detalle expandido de impronta -->
        <div
          v-for="veh in vehiculosFiltrados.filter(
            (v: VehiculoPipeline) => v.id === expandedId && v.improntaCompletada
          )"
          :key="'detail-' + veh.id"
          class="mx-4 mb-3 bg-emerald-500/10 border border-emerald-500/30 rounded-md p-4"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-sm font-bold text-zinc-100">
                Impronta de {{ veh.marca }} {{ veh.modelo }}
              </p>
              <p class="text-xs text-zinc-500 font-data mt-0.5">VIN: {{ veh.vin }}</p>
            </div>
            <button
              class="p-1.5 hover:bg-emerald-500/15 rounded-lg transition"
              @click="expandedId = null"
            >
              <svg
                class="w-4 h-4 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Info de la impronta asociada -->
          <template v-if="improntaDeVehiculo(veh.vin)">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p class="text-[10px] font-semibold text-emerald-300 uppercase">Folio</p>
                <p class="font-bold text-zinc-100">
                  {{ improntaDeVehiculo(veh.vin)?.folio || '—' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-emerald-300 uppercase">Condición</p>
                <p class="font-bold text-zinc-100 capitalize">
                  {{ improntaDeVehiculo(veh.vin)?.condicion || '—' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-emerald-300 uppercase">Fecha</p>
                <p class="font-bold text-zinc-100">
                  {{ improntaDeVehiculo(veh.vin)?.fechaCreacion || '—' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-emerald-300 uppercase">Zonas dañadas</p>
                <p class="font-bold text-zinc-100">
                  {{ improntaDeVehiculo(veh.vin)?.zonasDañadas?.length || 0 }}
                  zona(s)
                </p>
              </div>
            </div>
            <div
              v-if="improntaDeVehiculo(veh.vin)?.observaciones"
              class="mt-3 text-xs text-zinc-400 bg-[#10141c]/60 rounded-lg p-2.5"
            >
              <span class="font-semibold text-emerald-300">Observaciones:</span>
              {{ improntaDeVehiculo(veh.vin)?.observaciones }}
            </div>
            <div class="mt-3 flex gap-2">
              <NuxtLink
                :to="`/recibidor/impronta-print?folio=${improntaDeVehiculo(veh.vin)?.folio}`"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-[#10141c] border border-emerald-500/30 rounded-md hover:bg-emerald-500/10 transition"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Imprimir Impronta
              </NuxtLink>
            </div>
          </template>
          <p v-else class="text-sm text-zinc-500 italic">
            No se encontró la impronta asociada en el registro.
          </p>
        </div>

        <!-- Empty state -->
        <div v-if="vehiculosFiltrados.length === 0" class="p-12 text-center">
          <svg
            class="w-16 h-16 text-zinc-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8l2-2zM13 6h4l3 3v4h-7V6z"
            />
          </svg>
          <p class="text-zinc-500 text-sm font-medium">
            {{
              tabActiva === 'pendientes'
                ? 'No hay vehículos con impronta pendiente'
                : tabActiva === 'completadas'
                  ? 'No hay vehículos con impronta completada'
                  : 'No se encontraron vehículos'
            }}
          </p>
          <p v-if="busqueda" class="text-zinc-600 text-xs mt-1">Intenta con otra búsqueda</p>
        </div>

        <!-- Footer contador -->
        <div
          v-if="vehiculosFiltrados.length > 0"
          class="px-5 py-3 bg-[#0d111a]/80 border-t border-white/[0.06] text-xs text-zinc-500 flex items-center justify-between"
        >
          <span>
            Mostrando {{ vehiculosFiltrados.length }} vehículo{{
              vehiculosFiltrados.length !== 1 ? 's' : ''
            }}
          </span>
          <span class="text-zinc-500">
            {{ totalPendientes }} pendientes · {{ totalCompletadas }} completadas
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
