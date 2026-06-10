<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDespachadorStore } from '~/stores/despachadorStore'

definePageMeta({ layout: 'admin', middleware: ['auth', 'despachador'] })

const despachadorStore = useDespachadorStore()

onMounted(async () => {
  await despachadorStore.load()
})
</script>

<template>
  <div>
    <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
          DSP — Módulo Despacho
        </p>
        <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
          Panel Despachador
        </h1>
        <p class="text-zinc-500 mt-1">Gestión de despacho y salida de vehículos</p>
      </div>
      <NuxtLink
        to="/despachador/planilla"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#10141c] text-zinc-200 border border-white/[0.08] rounded-md text-sm font-semibold hover:bg-[#0d111a] transition shadow-sm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        Ver lotes
      </NuxtLink>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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
        <p class="font-data text-3xl font-bold text-amber-300">
          {{ despachadorStore.totalListosParaDespacho }}
        </p>
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
          {{ despachadorStore.totalDespachados }}
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Pendientes
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">
          {{ despachadorStore.vehiculosPendienteDespacho.length }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">En espera de escaneo</p>
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
        <p class="font-data text-3xl font-bold text-zinc-400">
          {{ despachadorStore.totalListosParaDespacho + despachadorStore.totalDespachados }}
        </p>
        <p class="text-sm text-zinc-500 mt-1">Vehículos en el sistema</p>
      </div>
    </div>

    <!-- Alerta si hay vehículos listos -->
    <div
      v-if="despachadorStore.totalListosParaDespacho > 0"
      class="bg-emerald-500/10 border border-emerald-500/30 rounded-md p-4 mb-6 flex items-center gap-4"
    >
      <div class="w-10 h-10 bg-emerald-500 rounded-md flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-sm font-bold text-emerald-200">
          {{ despachadorStore.totalListosParaDespacho }} vehículo(s) listo(s) para despacho
        </p>
        <p class="text-xs text-emerald-400 mt-0.5">Listos para ser escaneados y despachados</p>
      </div>
      <NuxtLink
        to="/despachador/escaneo"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black text-sm font-semibold rounded-md hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12v.01M12 4h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z"
          />
        </svg>
        Iniciar Escaneo de Lote
      </NuxtLink>
    </div>

    <!-- Vehículos listos para despacho -->
    <div class="bg-[#10141c] rounded-lg border border-white/[0.08]">
      <div class="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100">
          Vehículos Listos para Despacho
        </h3>
        <span class="text-xs text-zinc-600">Cargados desde Supabase</span>
      </div>
      <div v-if="despachadorStore.vehiculosListos.length === 0" class="px-6 py-12 text-center">
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p class="text-zinc-600 font-medium">No hay vehículos listos para despacho</p>
        <p class="text-zinc-600 text-sm mt-1">
          Los vehículos necesitan impronta completada e inventario aprobado
        </p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[#0d111a] border-b border-white/[0.06]">
            <tr>
              <th
                class="px-6 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                BIN/VIN
              </th>
              <th
                class="px-6 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Vehículo
              </th>
              <th
                class="px-6 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Color
              </th>
              <th
                class="px-6 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Estado
              </th>
              <th
                class="px-6 py-3 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
              >
                Acción
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/[0.04]">
            <tr
              v-for="v in despachadorStore.vehiculosListos"
              :key="v.id"
              class="hover:bg-[#0d111a] transition"
            >
              <td class="px-6 py-4 text-sm font-data font-medium text-zinc-100">
                {{ v.bin }}
              </td>
              <td class="px-6 py-4 text-sm text-zinc-200">
                {{ v.modelo?.marca }} {{ v.modelo?.modelo }} {{ v.modelo?.anio }}
              </td>
              <td class="px-6 py-4 text-sm text-zinc-400">
                <span v-if="v.color" class="inline-flex items-center gap-2">
                  <span
                    class="w-3 h-3 rounded-full border border-white/[0.12]"
                    :style="{ backgroundColor: v.color }"
                  />
                  {{ v.color }}
                </span>
                <span v-else class="text-zinc-600">—</span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-sm"
                >
                  {{ v.estado }}
                </span>
              </td>
              <td class="px-6 py-4">
                <NuxtLink
                  :to="`/despachador/escaneo?bin=${v.bin}`"
                  class="text-xs font-semibold text-amber-300 hover:text-amber-200"
                >
                  Despachar →
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
