<script setup lang="ts">
import { ref, computed } from 'vue'
import { useImprontaStore } from '~/stores/improntaStore'
import { useVehiculoStore, type VehiculoPipeline } from '~/stores/vehiculoStore'

definePageMeta({ layout: 'admin', middleware: ['auth', 'recibidor'] })

const store = useImprontaStore()
const vehStore = useVehiculoStore()

// Vehicle search
const vehiculoSearch = ref('')
const vehiculoFilter = ref('')
const vehiculoSearchExpanded = ref(false)
const showVehiculos = ref(false)
const selectedVehiculo = ref<VehiculoPipeline | null>(null)

const searchInputRef = ref<HTMLInputElement | null>(null)

const expandSearch = () => {
  vehiculoSearchExpanded.value = true
  setTimeout(() => searchInputRef.value?.focus(), 50)
}

const collapseSearch = () => {
  vehiculoSearchExpanded.value = false
  vehiculoSearch.value = ''
}

const filteredVehiculos = computed(() => {
  let result = [...vehStore.vehiculos]
  if (vehiculoFilter.value) result = result.filter((v) => v.estado === vehiculoFilter.value)
  if (vehiculoSearch.value) {
    const q = vehiculoSearch.value.toLowerCase()
    result = result.filter(
      (v) =>
        v.vin.toLowerCase().includes(q) ||
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.cliente.toLowerCase().includes(q) ||
        (v.contenedorCodigo && v.contenedorCodigo.toLowerCase().includes(q))
    )
  }
  return result
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
    listo_despacho: 'bg-teal-500/10 text-teal-300',
    despachado: 'bg-[#0b0e14] text-zinc-500',
  })[e] || 'bg-[#0b0e14] text-zinc-500'
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
          REC — Módulo Recepción
        </p>
        <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
          Panel Recibidor
        </h1>
        <p class="text-zinc-500 mt-1">Gestión de recepción e impronta de vehículos</p>
      </div>
      <div class="flex gap-3">
        <NuxtLink
          to="/recibidor/escaneo"
          class="inline-flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] bg-[#10141c] text-zinc-200 font-semibold rounded-md hover:bg-[#0d111a] transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          Escanear Recepción
        </NuxtLink>
        <NuxtLink
          to="/recibidor/impronta"
          class="inline-flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] bg-[#10141c] text-zinc-200 font-semibold rounded-md hover:bg-[#0d111a] transition"
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
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-sm">
            Total
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-zinc-100">
          {{ store.totalImprontas }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Improntas registradas</p>
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
            Hoy
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-emerald-300">{{ store.hoy }}</p>
        <p class="text-sm text-zinc-500 mt-1">Registradas hoy</p>
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Pendientes
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">{{ store.borradores }}</p>
        <p class="text-sm text-zinc-500 mt-1">Borradores</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
            <svg
              class="w-5 h-5 text-teal-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-sm">
            Revisadas
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-teal-300">{{ store.revisadas }}</p>
        <p class="text-sm text-zinc-500 mt-1">Revisadas</p>
      </div>
    </div>

    <!-- Contenedores pendientes (acceso rápido) -->
    <!-- Búsqueda de Vehículos -->
    <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
      <!-- Header / toggle row -->
      <button
        class="w-full flex items-center justify-between px-5 py-4"
        @click="showVehiculos = !showVehiculos"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div class="text-left">
            <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100">
              Búsqueda de Vehículos
            </h3>
            <p class="text-xs text-zinc-500">
              {{ vehStore.vehiculos.length }} vehículos en el sistema · Buscar por VIN, placa,
              marca, modelo o cliente
            </p>
          </div>
        </div>
        <svg
          class="w-5 h-5 text-zinc-500 transition-transform duration-200"
          :class="showVehiculos ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showVehiculos" class="border-t border-white/[0.06]">
          <!-- Search bar con input expandible -->
          <div class="p-4 bg-[#0d111a]/50 flex flex-col sm:flex-row gap-3 items-center">
            <!-- Expandable search -->
            <div class="flex items-center gap-2 flex-1">
              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 w-0"
                enter-to-class="opacity-100 w-full"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 w-full"
                leave-to-class="opacity-0 w-0"
              >
                <div v-if="vehiculoSearchExpanded" class="relative flex-1 overflow-hidden">
                  <svg
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400 pointer-events-none"
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
                    ref="searchInputRef"
                    v-model="vehiculoSearch"
                    type="text"
                    placeholder="Buscar por VIN, placa, marca, modelo, cliente..."
                    class="w-full pl-10 pr-10 py-2.5 border border-sky-400/40 rounded-md text-sm focus:outline-none focus:border-amber-400/70 bg-[#10141c] shadow-sm"
                    @keydown.escape="collapseSearch"
                  />
                  <button
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition"
                    title="Cerrar búsqueda"
                    @click="collapseSearch"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </Transition>

              <button
                v-if="!vehiculoSearchExpanded"
                class="flex items-center gap-2 px-4 py-2.5 border border-sky-500/30 bg-[#10141c] text-sky-300 font-semibold text-sm rounded-md hover:bg-sky-500/10 hover:border-sky-400/40 transition shadow-sm"
                @click="expandSearch"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Buscar vehículo
              </button>

              <!-- Chip de búsqueda activa -->
              <span
                v-if="vehiculoSearch"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs font-semibold rounded-sm shrink-0"
              >
                "{{ vehiculoSearch }}"
                <button class="hover:text-sky-200" @click="vehiculoSearch = ''">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            </div>

            <select
              v-model="vehiculoFilter"
              class="w-full sm:w-auto px-4 py-2.5 border border-white/[0.08] rounded-md text-sm bg-[#10141c] focus:outline-none focus:border-amber-400/70 shrink-0"
            >
              <option value="">Todos los estados</option>
              <option value="recibido">Recibido</option>
              <option value="impronta_pendiente">Impronta Pendiente</option>
              <option value="impronta_completada">Impronta Completada</option>
              <option value="inventario_pendiente">Inventario Pendiente</option>
              <option value="inventario_aprobado">Inventario Aprobado</option>
              <option value="listo_despacho">Listo Despacho</option>
              <option value="despachado">Despachado</option>
            </select>
          </div>

          <!-- Vehicle detail card -->
          <div
            v-if="selectedVehiculo"
            class="mx-4 mb-3 bg-sky-500/10 border border-sky-500/30 rounded-md p-4"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <p class="text-base font-bold text-zinc-100">
                  {{ selectedVehiculo.marca }} {{ selectedVehiculo.modelo }}
                  {{ selectedVehiculo.anio }}
                </p>
                <p class="text-xs text-zinc-500 font-data mt-0.5">{{ selectedVehiculo.vin }}</p>
              </div>
              <button
                class="p-1.5 hover:bg-sky-500/15 rounded-lg transition"
                @click="selectedVehiculo = null"
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
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p class="text-[10px] font-semibold text-sky-400 uppercase">Placa</p>
                <p class="text-sm font-bold text-zinc-100">{{ selectedVehiculo.placa || '—' }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-sky-400 uppercase">Color</p>
                <p class="text-sm font-bold text-zinc-100">{{ selectedVehiculo.color || '—' }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-sky-400 uppercase">Cliente</p>
                <p class="text-sm font-bold text-zinc-100">{{ selectedVehiculo.cliente || '—' }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-sky-400 uppercase">Contenedor</p>
                <p class="text-sm font-bold text-zinc-100 font-data">
                  {{ selectedVehiculo.contenedorCodigo || '—' }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-sky-400 uppercase">Recepción</p>
                <p class="text-sm font-bold text-zinc-100">{{ selectedVehiculo.fechaRecepcion }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-sky-400 uppercase">Impronta</p>
                <p
                  class="text-sm font-bold"
                  :class="
                    selectedVehiculo.improntaCompletada ? 'text-emerald-300' : 'text-amber-300'
                  "
                >
                  {{
                    selectedVehiculo.improntaFolio ||
                    (selectedVehiculo.improntaCompletada ? 'Completada' : 'Pendiente')
                  }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-sky-400 uppercase">Inventario</p>
                <p
                  class="text-sm font-bold"
                  :class="
                    selectedVehiculo.inventarioAprobado ? 'text-emerald-300' : 'text-amber-300'
                  "
                >
                  {{
                    selectedVehiculo.inventarioAprobado
                      ? 'Aprobado'
                      : selectedVehiculo.inventarioCompletado
                        ? 'En revisión'
                        : 'Pendiente'
                  }}
                </p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-sky-400 uppercase">Estado</p>
                <span
                  :class="[
                    estadoVehBadge(selectedVehiculo.estado),
                    'text-xs font-semibold px-2.5 py-1 rounded-sm inline-block mt-0.5',
                  ]"
                >
                  {{ estadoVehLabel(selectedVehiculo.estado) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Vehicles table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-[#0d111a] border-b border-white/[0.06]">
                  <th
                    class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                  >
                    VIN
                  </th>
                  <th
                    class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                  >
                    Vehículo
                  </th>
                  <th
                    class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                  >
                    Placa
                  </th>
                  <th
                    class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                  >
                    Cliente
                  </th>
                  <th
                    class="px-4 py-2.5 text-center font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                  >
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/[0.04]">
                <tr
                  v-for="veh in filteredVehiculos"
                  :key="veh.id"
                  class="hover:bg-sky-500/10/50 cursor-pointer transition"
                  :class="selectedVehiculo?.id === veh.id ? 'bg-sky-500/10/80' : ''"
                  @click="selectedVehiculo = selectedVehiculo?.id === veh.id ? null : veh"
                >
                  <td class="px-4 py-3 font-data text-xs text-zinc-400">
                    {{ veh.vin.slice(0, 8) }}…{{ veh.vin.slice(-4) }}
                  </td>
                  <td class="px-4 py-3">
                    <p class="font-semibold text-zinc-100">
                      {{ veh.marca }} {{ veh.modelo }} {{ veh.anio }}
                    </p>
                    <p class="text-xs text-zinc-500">{{ veh.color }}</p>
                  </td>
                  <td class="px-4 py-3 font-data text-sm text-zinc-400">{{ veh.placa || '—' }}</td>
                  <td class="px-4 py-3 text-zinc-400">{{ veh.cliente || '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span
                      :class="[
                        estadoVehBadge(veh.estado),
                        'text-xs font-semibold px-2.5 py-1 rounded-sm inline-block',
                      ]"
                    >
                      {{ estadoVehLabel(veh.estado) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredVehiculos.length === 0" class="p-8 text-center">
              <svg
                class="w-12 h-12 text-zinc-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8l2-2zM13 6h4l3 3v4h-7V6z"
                />
              </svg>
              <p class="text-zinc-500 text-sm">No se encontraron vehículos</p>
            </div>
            <div
              v-else
              class="px-4 py-2.5 bg-[#0d111a] border-t border-white/[0.06] text-xs text-zinc-500"
            >
              Mostrando {{ filteredVehiculos.length }} de {{ vehStore.vehiculos.length }} vehículos
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
