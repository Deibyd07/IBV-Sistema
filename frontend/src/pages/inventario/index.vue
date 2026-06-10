<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInventarioStore } from '~/stores/inventarioStore'

definePageMeta({ layout: 'admin', middleware: ['auth', 'inventario'] })

const vehiculoStore = useInventarioStore()
const tab = ref<'pendientes' | 'completados'>('pendientes')

onMounted(async () => {
  await vehiculoStore.load()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
        INV — Módulo Inventario
      </p>
      <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
        Panel Inventario
      </h1>
      <p class="text-zinc-500 mt-1">Inspección y control de inventario de vehículos</p>
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Pendientes
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">
          {{ vehiculoStore.pendientesInventario }}
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
          {{ vehiculoStore.listosDespacho }}
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
          {{ vehiculoStore.conImpronta }}
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
          {{ vehiculoStore.despachados }}
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
        Pendientes ({{ vehiculoStore.getPendientesInventario.length }})
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
        Inventario Completo ({{ vehiculoStore.getListosParaDespacho.length }})
      </button>
    </div>

    <!-- Lista de vehículos pendientes de inspección -->
    <div v-if="tab === 'pendientes'" class="bg-[#10141c] rounded-lg border border-white/[0.08]">
      <div class="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100">
          Vehículos Pendientes de Inventario
        </h3>
        <p class="text-xs text-zinc-600">Solo vehículos con impronta completada</p>
      </div>
      <div v-if="vehiculoStore.getPendientesInventario.length === 0" class="px-6 py-12 text-center">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-zinc-600 font-medium">Sin vehículos pendientes</p>
        <p class="text-zinc-600 text-sm mt-1">
          Todos los vehículos con impronta ya tienen inventario aprobado
        </p>
      </div>
      <div v-else class="divide-y divide-white/[0.04]">
        <div
          v-for="v in vehiculoStore.getPendientesInventario"
          :key="v.id"
          class="px-6 py-4 flex items-center justify-between hover:bg-[#0d111a] transition"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 bg-amber-400/10 text-amber-300 rounded-lg flex items-center justify-center"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-zinc-100">
                {{ v.marca }} {{ v.modelo }} {{ v.anio }}
              </p>
              <p class="text-xs text-zinc-500">
                <span class="font-data">{{ v.vin }}</span>
                · {{ v.color }}
                <span
                  v-if="v.improntaFolio"
                  class="ml-2 px-1.5 py-0.5 bg-sky-500/10 text-sky-300 rounded text-[10px] font-bold"
                >
                  {{ v.improntaFolio }}
                </span>
              </p>
              <p class="text-xs text-zinc-600 mt-0.5">
                Cliente: {{ v.cliente || '—' }} · Recibido {{ v.fechaRecepcion }}
              </p>
            </div>
          </div>
          <NuxtLink
            :to="`/inventario/checklist?vin=${v.vin}`"
            class="px-4 py-2 text-sm font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-300 transition shadow-lg shadow-amber-400/20"
          >
            Iniciar Checklist
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Lista de vehículos con inventario completo -->
    <div v-if="tab === 'completados'" class="bg-[#10141c] rounded-lg border border-white/[0.08]">
      <div class="px-6 py-4 border-b border-white/[0.06]">
        <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100">
          Vehículos con Inventario Aprobado
        </h3>
      </div>
      <div v-if="vehiculoStore.getListosParaDespacho.length === 0" class="px-6 py-12 text-center">
        <p class="text-zinc-600 font-medium">No hay vehículos con inventario aprobado aún</p>
      </div>
      <div v-else class="divide-y divide-white/[0.04]">
        <div
          v-for="v in vehiculoStore.getListosParaDespacho"
          :key="v.id"
          class="px-6 py-4 flex items-center justify-between hover:bg-[#0d111a] transition"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-zinc-100">
                {{ v.marca }} {{ v.modelo }} {{ v.anio }}
              </p>
              <p class="text-xs text-zinc-500">
                <span class="font-data">{{ v.vin }}</span>
                · {{ v.color }}
              </p>
              <p class="text-xs text-zinc-600 mt-0.5">
                Inspector: {{ v.inventarioInspector || '—' }} · Fecha: {{ v.inventarioFecha }}
                <span v-if="v.inventarioResultado" class="ml-1">
                  · {{ v.inventarioResultado.aprobados }}/{{ v.inventarioResultado.totalItems }} OK
                </span>
              </p>
            </div>
          </div>
          <span
            class="px-3 py-1.5 text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-sm"
          >
            Listo para Despacho
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
