<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDespachadorStore } from '~/stores/despachadorStore'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin' })

const despachadorStore = useDespachadorStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const scannerRef = ref<{
  setError: (msg: string) => void
  setSuccess: (msg?: string) => void
  reset: () => void
  focus: () => void
} | null>(null)

// Lot number auto-generated
const loteActual = `LT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

interface VehiculoLote {
  id: string | number
  bin: string
  marca: string
  modelo: string
  anio: number
  color: string
  escaneado: boolean
  horaEscaneo?: string
}

// Cargar vehículos al montar
onMounted(async () => {
  await despachadorStore.load()

  // Si viene bin en query, pre-seleccionar ese vehículo
  const binParam = route.query.bin as string
  if (binParam) {
    const v = despachadorStore.getByBin(binParam)
    if (v) {
      handleScan(binParam)
    }
  }
})

// Build lot from vehicles ready in the store
const vehiculosLote = ref<VehiculoLote[]>(
  despachadorStore.vehiculosListos.map((v) => ({
    id: v.id,
    bin: v.bin,
    marca: v.modelo?.marca || '',
    modelo: v.modelo?.modelo || '',
    anio: v.modelo?.anio || new Date().getFullYear(),
    color: v.color || '',
    escaneado: false,
  }))
)

const vehiculosEscaneados = computed(() => vehiculosLote.value.filter((v) => v.escaneado))
const vehiculosPendientes = computed(() => vehiculosLote.value.filter((v) => !v.escaneado))
const todosEscaneados = computed(
  () =>
    vehiculosLote.value.length > 0 &&
    vehiculosEscaneados.value.length === vehiculosLote.value.length
)
const progressPorcentaje = computed(() =>
  vehiculosLote.value.length === 0
    ? 0
    : Math.round((vehiculosEscaneados.value.length / vehiculosLote.value.length) * 100)
)

const vehiculosFiltrados = computed(() => {
  if (filtroEstado.value === 'pendiente') return vehiculosPendientes.value
  return vehiculosLote.value
})

const filtroEstado = ref<'todos' | 'pendiente'>('todos')

/**
 * Procesa un BIN escaneado desde el QR scanner o entrada manual
 */
const handleScan = (bin: string) => {
  // 1. Check if vehicle exists in the list
  const vehiculoDb = despachadorStore.getByBin(bin)
  if (!vehiculoDb) {
    scannerRef.value?.setError('Este BIN no está en la lista de despacho')
    return
  }

  // 2. Find in lot
  const v = vehiculosLote.value.find((x) => x.bin.toLowerCase() === bin.toLowerCase())
  if (!v) {
    scannerRef.value?.setError('Este BIN no está en el lote actual')
    return
  }
  if (v.escaneado) {
    scannerRef.value?.setError('Este vehículo ya fue escaneado en este lote')
    return
  }

  // 3. Success — marcar como escaneado
  v.horaEscaneo = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  v.escaneado = true
  scannerRef.value?.setSuccess(`${v.marca} ${v.modelo} — BIN verificado`)
}

const onScan = (bin: string) => {
  handleScan(bin)
}

const simularEscaneo = () => {
  const pendientes = vehiculosPendientes.value
  if (pendientes.length === 0) return
  onScan(pendientes[0].bin)
}

const finalizarLote = async () => {
  // Despachar todos los vehículos escaneados
  const _despachador = authStore.user?.name || 'Despachador'
  let despachosExitosos = 0
  let _despachosError = 0

  for (const v of vehiculosEscaneados.value) {
    const result = await despachadorStore.despacharVehiculo(v.id, loteActual)
    if (result.success) {
      despachosExitosos++
    } else {
      _despachosError++
      console.error(`Error despachando ${v.bin}`)
    }
  }

  // Navegar si hubo al menos un despacho exitoso
  if (despachosExitosos > 0) {
    router.push(`/despachador/planilla?lote=${loteActual}`)
  } else {
    console.error(`No se pudo despachar ningún vehículo`)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/despachador"
          class="p-2 text-zinc-600 hover:text-zinc-400 hover:bg-[#0b0e14] rounded-md transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </NuxtLink>
        <div>
          <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
            DSP — Módulo Despacho
          </p>
          <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
            Escaneo de Despacho
          </h1>
          <p class="text-zinc-500 mt-1">
            Lote #{{ loteActual }} — Escanea cada vehículo para despachar
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button
          :disabled="vehiculosEscaneados.length === 0"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition shadow-lg"
          :class="
            vehiculosEscaneados.length > 0
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/25'
              : 'bg-[#0b0e14] text-zinc-600 cursor-not-allowed shadow-none'
          "
          @click="finalizarLote"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Finalizar Lote ({{ vehiculosEscaneados.length }})
        </button>
      </div>
    </div>

    <!-- Barra de progreso del lote -->
    <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-bold text-zinc-200">Progreso de escaneo</span>
        <span
          class="text-sm font-bold"
          :class="todosEscaneados ? 'text-emerald-400' : 'text-amber-300'"
        >
          {{ vehiculosEscaneados.length }} / {{ vehiculosLote.length }} vehículos
        </span>
      </div>
      <div class="w-full bg-[#0b0e14] rounded-sm h-3">
        <div
          class="h-3 rounded-sm transition-all duration-700"
          :class="todosEscaneados ? 'bg-emerald-500' : 'bg-amber-400'"
          :style="`width: ${progressPorcentaje}%`"
        />
      </div>
      <div class="flex items-center gap-6 mt-3 text-xs text-zinc-500">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 bg-emerald-400 rounded-full" />
          Escaneados: {{ vehiculosEscaneados.length }}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 bg-white/[0.12] rounded-full" />
          Pendientes: {{ vehiculosPendientes.length }}
        </span>
      </div>
    </div>

    <!-- Sin vehículos disponibles -->
    <div
      v-if="vehiculosLote.length === 0"
      class="bg-[#10141c] rounded-lg border border-white/[0.08] p-12 text-center"
    >
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
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <p class="text-zinc-500 font-bold text-lg">No hay vehículos listos para despacho</p>
      <p class="text-zinc-600 text-sm mt-2">
        Los vehículos requieren impronta completada e inventario aprobado
      </p>
      <NuxtLink
        to="/despachador"
        class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#0b0e14] text-zinc-200 text-sm font-semibold rounded-md hover:bg-white/[0.06] transition"
      >
        Volver al panel
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <!-- Zona de escaneo QR (componente reutilizable) -->
      <div class="xl:col-span-2 space-y-4">
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-5">
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
                Escanear Vehículo
              </h2>
              <p class="text-sm text-zinc-500">Escanea el QR o VIN de cada vehículo del lote</p>
            </div>
          </div>

          <QrScanner
            ref="scannerRef"
            placeholder="BIN del vehículo (escanea el código QR)"
            hide-result
            @scan="onScan"
          />

          <!-- Botón simular escaneo (solo desarrollo) -->
          <button
            :disabled="todosEscaneados"
            class="w-full mt-4 py-3 font-bold text-sm rounded-md transition"
            :class="
              todosEscaneados
                ? 'bg-[#0b0e14] text-zinc-600 cursor-not-allowed'
                : 'bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-500/20 active:scale-95'
            "
            @click="simularEscaneo"
          >
            {{ todosEscaneados ? 'Todos escaneados ✓' : 'Simular Escaneo QR' }}
          </button>
        </div>
      </div>

      <!-- Lista de vehículos del lote -->
      <div class="xl:col-span-3">
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
          <div class="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100">
              Vehículos del Lote
            </h3>
            <div class="flex gap-2">
              <span
                class="px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition"
                :class="
                  filtroEstado === 'todos'
                    ? 'bg-amber-400/[0.12] text-amber-200'
                    : 'text-zinc-500 hover:text-zinc-200'
                "
                @click="filtroEstado = 'todos'"
              >
                Todos ({{ vehiculosLote.length }})
              </span>
              <span
                class="px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition"
                :class="
                  filtroEstado === 'pendiente'
                    ? 'bg-amber-400/15 text-amber-300'
                    : 'text-zinc-500 hover:text-zinc-200'
                "
                @click="filtroEstado = 'pendiente'"
              >
                Pendientes ({{ vehiculosPendientes.length }})
              </span>
            </div>
          </div>

          <div class="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
            <div
              v-for="(v, idx) in vehiculosFiltrados"
              :key="v.bin"
              class="flex items-center gap-4 px-5 py-3.5 transition-colors"
              :class="v.escaneado ? 'bg-emerald-500/10/50' : 'hover:bg-[#0d111a]'"
            >
              <div
                class="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                :class="v.escaneado ? 'bg-amber-400 text-black' : 'bg-[#0b0e14] text-zinc-500'"
              >
                {{ v.escaneado ? '✓' : idx + 1 }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold text-zinc-100 font-data">{{ v.bin }}</p>
                  <span
                    v-if="v.escaneado"
                    class="text-xs px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold rounded-sm"
                  >
                    Escaneado
                  </span>
                </div>
                <p class="text-xs text-zinc-600 mt-0.5">
                  {{ v.marca }} {{ v.modelo }} {{ String(v.anio) }} — {{ v.color }}
                </p>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <span
                  class="px-1.5 py-0.5 text-[10px] font-bold bg-sky-500/10 text-sky-300 rounded"
                >
                  IMP ✓
                </span>
                <span
                  class="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-300 rounded"
                >
                  INV ✓
                </span>
              </div>

              <div v-if="v.horaEscaneo" class="text-right shrink-0">
                <p class="text-xs font-semibold text-emerald-400">{{ v.horaEscaneo }}</p>
              </div>
              <div v-else class="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
