<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({ layout: 'admin', middleware: ['auth', 'porteria'] })

const showScanner = ref(false)
const lastScan = ref('')
const scannerRef = ref<{
  setError: (msg: string) => void
  setSuccess: (msg?: string) => void
  reset: () => void
} | null>(null)

const onScan = (value: string) => {
  const code = value.trim()
  if (!code) {
    scannerRef.value?.setError('El codigo escaneado esta vacio')
    return
  }
  lastScan.value = code
  scannerRef.value?.setSuccess('Acceso validado')
}

const movements = [
  {
    id: 1,
    vehicle: 'Toyota Corolla',
    bin: 'VH-2024-0156',
    type: 'entrada',
    driver: 'Juan Martínez',
    time: 'Hace 10 min',
  },
  {
    id: 2,
    vehicle: 'Nissan Versa',
    bin: 'VH-2024-0140',
    type: 'salida',
    driver: 'Pedro López',
    time: 'Hace 25 min',
  },
  {
    id: 3,
    vehicle: 'Chevrolet Onix',
    bin: 'VH-2024-0142',
    type: 'salida',
    driver: 'María García',
    time: 'Hace 45 min',
  },
  {
    id: 4,
    vehicle: 'Kia Rio',
    bin: 'VH-2024-0160',
    type: 'entrada',
    driver: 'Carlos Díaz',
    time: 'Hace 1h',
  },
  {
    id: 5,
    vehicle: 'Hyundai Accent',
    bin: 'VH-2024-0161',
    type: 'entrada',
    driver: 'Ana Torres',
    time: 'Hace 2h',
  },
]
</script>

<template>
  <div>
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
          PRT — Módulo Portería
        </p>
        <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
          Panel Portería
        </h1>
        <p class="text-zinc-500 mt-1">Control de entrada y salida de vehículos</p>
      </div>
    </div>

    <!-- Acción principal: Escanear QR -->
    <div
      class="relative overflow-hidden bg-[#10141c] border border-rose-500/30 rounded-lg p-8 mb-8"
    >
      <div class="absolute inset-y-0 left-0 w-1 bg-rose-500" />
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <div
          class="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center justify-center text-rose-300"
        >
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
        </div>
        <div class="text-center sm:text-left flex-1">
          <h2 class="font-display text-lg uppercase tracking-tight text-zinc-100">
            Escanear Código QR
          </h2>
          <p class="text-zinc-400 mt-1">Verifica la autorización de salida/entrada de vehículos</p>
        </div>
        <button
          class="px-6 py-3 bg-amber-400 text-black font-semibold rounded-md hover:bg-amber-300 transition shadow-lg shadow-amber-500/20"
          @click="showScanner = !showScanner"
        >
          {{ showScanner ? 'Cerrar Escáner' : 'Abrir Escáner' }}
        </button>
      </div>
    </div>

    <!-- Escaner de porteria -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div v-if="showScanner" class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6 mb-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-amber-400/[0.12] rounded-md flex items-center justify-center">
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
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <div>
            <h2 class="font-display text-base uppercase tracking-tight text-zinc-100">
              Escaneo de Entrada/Salida
            </h2>
            <p class="text-sm text-zinc-500">Escanea el QR del vehiculo para validar acceso</p>
          </div>
        </div>

        <QrScanner
          ref="scannerRef"
          placeholder="Codigo de vehiculo (ej: VH-2024-0156)"
          @scan="onScan"
        />

        <div v-if="lastScan" class="mt-4 text-sm text-zinc-400">
          Ultimo codigo:
          <span class="font-data font-semibold text-zinc-100">{{ lastScan }}</span>
        </div>
      </div>
    </Transition>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <span
            class="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-sm"
          >
            Entradas
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-emerald-400">18</p>
        <p class="text-sm text-zinc-500 mt-1">Ingresos registrados hoy</p>
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
            Salidas
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-amber-300">12</p>
        <p class="text-sm text-zinc-500 mt-1">Salidas registradas hoy</p>
      </div>
      <div class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06]">
        <div class="flex items-center justify-between mb-2">
          <div class="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <span class="text-xs font-semibold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-sm">
            Stock
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-zinc-100">156</p>
        <p class="text-sm text-zinc-500 mt-1">Vehículos en bodega</p>
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
            Alertas
          </span>
        </div>
        <p class="font-data text-3xl font-bold text-red-400">1</p>
        <p class="text-sm text-zinc-500 mt-1">Requieren atención</p>
      </div>
    </div>

    <!-- Registro de movimientos -->
    <div class="bg-[#10141c] rounded-lg border border-white/[0.08]">
      <div class="px-6 py-4 border-b border-white/[0.06]">
        <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100">
          Últimos Movimientos
        </h3>
      </div>
      <div class="divide-y divide-white/[0.04]">
        <div
          v-for="mov in movements"
          :key="mov.id"
          class="px-6 py-4 flex items-center justify-between hover:bg-[#0d111a] transition"
        >
          <div class="flex items-center gap-4">
            <div
              :class="[
                'w-10 h-10 rounded-md flex items-center justify-center',
                mov.type === 'entrada'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-400/[0.12] text-amber-300',
              ]"
            >
              <svg
                v-if="mov.type === 'entrada'"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-100">{{ mov.vehicle }} — {{ mov.bin }}</p>
              <p class="text-xs text-zinc-500">
                {{ mov.type === 'entrada' ? 'Entrada' : 'Salida' }} · {{ mov.driver }}
              </p>
            </div>
          </div>
          <span class="text-xs text-zinc-600">{{ mov.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
