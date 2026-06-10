<script setup lang="ts">
import { computed } from 'vue'
import { useDespachadorStore } from '~/stores/despachadorStore'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const despachadorStore = useDespachadorStore()
const authStore = useAuthStore()

const loteNumero = (route.query.lote as string) || `LT-${new Date().getFullYear()}-0000`
const fechaHoy = new Date().toLocaleDateString('es-VE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
const horaActual = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
const despachadorNombre = authStore.user?.nombre || authStore.user?.name || 'Despachador'

// Get vehicles dispatched in this lot
const vehiculosDespachados = computed(() => despachadorStore.vehiculosDespachados)

const clientesUnicos = computed(() => {
  const clientes = new Set(vehiculosDespachados.value.map((v) => v.cliente).filter(Boolean))
  return clientes.size
})

const firmas = [
  { nombre: despachadorNombre, rol: 'Despachador', firmado: true },
  { nombre: '___________________', rol: 'Conductor / Transportista', firmado: false },
  { nombre: '___________________', rol: 'Supervisor de Despacho', firmado: false },
]

const imprimir = () => window.print()
</script>

<template>
  <div class="min-h-screen bg-[#0b0e14] print:bg-white">
    <!-- Controles (no se imprimen) -->
    <div
      class="print:hidden flex items-center justify-between px-8 py-4 bg-[#0d111a]/90 backdrop-blur-lg border-b border-white/[0.08] sticky top-0 z-10"
    >
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/despachador/escaneo"
          class="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver al escaneo
        </NuxtLink>
        <span class="text-zinc-700">|</span>
        <span
          class="px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-sm"
        >
          Lote completado
        </span>
      </div>
      <div class="flex gap-3">
        <NuxtLink
          to="/despachador"
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.10] bg-white/[0.04] text-zinc-200 text-sm font-semibold rounded-md hover:bg-white/[0.08] transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Ir al panel
        </NuxtLink>
        <button
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black text-sm font-semibold rounded-md hover:bg-amber-300 transition shadow-lg shadow-amber-400/20"
          @click="imprimir"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Imprimir Planilla
        </button>
      </div>
    </div>

    <!-- Planilla (hoja blanca: vista previa del documento impreso) -->
    <div
      class="max-w-[900px] mx-auto px-8 py-10 bg-white my-8 rounded-lg shadow-2xl shadow-black/60 print:my-0 print:rounded-none print:shadow-none print:px-6 print:py-6"
    >
      <!-- Encabezado -->
      <div class="flex items-start justify-between border-b-2 border-gray-900 pb-6 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-black text-gray-900">SISTEMA IBV</h1>
              <p class="text-xs text-gray-500">Inspección, Bodega y Verificación de Vehículos</p>
            </div>
          </div>
        </div>
        <div class="text-right space-y-2">
          <div class="inline-block border-2 border-gray-900 px-4 py-2 rounded-xl">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Lote N°</p>
            <p class="text-2xl font-black text-gray-900">{{ loteNumero }}</p>
          </div>
        </div>
      </div>

      <!-- Título -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-black text-gray-900 uppercase tracking-widest">
          Planilla de Despacho
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          Acta de entrega de vehículos generada automáticamente
        </p>
      </div>

      <!-- Información del lote -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 class="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">
            Datos del Despacho
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-semibold">Fecha de despacho:</span>
              <span class="font-bold text-gray-900">{{ fechaHoy }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-semibold">Hora de cierre:</span>
              <span class="font-bold text-gray-900">{{ horaActual }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-semibold">Despachador:</span>
              <span class="font-bold text-gray-900">{{ despachadorNombre }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-semibold">Total vehículos:</span>
              <span class="font-bold text-gray-900">{{ vehiculosDespachados.length }}</span>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 class="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">
            Resumen de Verificaciones
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-semibold">Improntas completadas:</span>
              <span class="font-bold text-success-700">
                {{ vehiculosDespachados.length }} / {{ vehiculosDespachados.length }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-semibold">Inventarios aprobados:</span>
              <span class="font-bold text-success-700">
                {{ vehiculosDespachados.length }} / {{ vehiculosDespachados.length }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-semibold">Clientes destino:</span>
              <span class="font-bold text-gray-900">{{ clientesUnicos }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-semibold">Estado:</span>
              <span
                class="px-2 py-0.5 bg-success-100 text-success-700 rounded-sm text-xs font-bold"
              >
                Completado
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de vehículos -->
      <div class="mb-8">
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-4"
        >
          Relación de Vehículos Despachados
        </h3>
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-900 text-white">
              <th class="py-2.5 px-3 text-left text-xs font-bold tracking-wider rounded-tl-lg">
                #
              </th>
              <th class="py-2.5 px-3 text-left text-xs font-bold tracking-wider">VIN / Chasis</th>
              <th class="py-2.5 px-3 text-left text-xs font-bold tracking-wider">Marca</th>
              <th class="py-2.5 px-3 text-left text-xs font-bold tracking-wider">Modelo</th>
              <th class="py-2.5 px-3 text-left text-xs font-bold tracking-wider">Año</th>
              <th class="py-2.5 px-3 text-left text-xs font-bold tracking-wider">Color</th>
              <th class="py-2.5 px-3 text-left text-xs font-bold tracking-wider rounded-tr-lg">
                Cliente
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(v, idx) in vehiculosDespachados"
              :key="v.id"
              :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
            >
              <td class="py-2.5 px-3 border-b border-gray-100 text-center font-bold text-gray-500">
                {{ idx + 1 }}
              </td>
              <td
                class="py-2.5 px-3 border-b border-gray-100 font-mono text-xs font-bold text-gray-900"
              >
                {{ v.bin }}
              </td>
              <td class="py-2.5 px-3 border-b border-gray-100 font-medium text-gray-700">
                {{ v.modelo?.marca || '—' }}
              </td>
              <td class="py-2.5 px-3 border-b border-gray-100 text-gray-600">
                {{ v.modelo?.modelo || '—' }}
              </td>
              <td class="py-2.5 px-3 border-b border-gray-100 text-gray-600">
                {{ v.modelo?.anio || '—' }}
              </td>
              <td class="py-2.5 px-3 border-b border-gray-100 text-gray-600">
                {{ v.color || '—' }}
              </td>
              <td class="py-2.5 px-3 border-b border-gray-100 text-gray-600 text-xs">
                {{ v.cliente || '—' }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-100">
              <td colspan="6" class="py-3 px-3 text-right text-sm font-black text-gray-900">
                Total de vehículos despachados:
              </td>
              <td class="py-3 px-3 text-right text-xl font-black text-gray-900">
                {{ vehiculosDespachados.length }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Observaciones -->
      <div class="mb-8">
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-3"
        >
          Observaciones
        </h3>
        <div class="min-h-[60px] border border-gray-200 rounded-xl p-3">
          <p class="text-sm text-gray-600">
            Todos los vehículos fueron verificados con impronta completada e inventario aprobado
            antes del despacho. Lote entregado conforme a protocolo IBV.
          </p>
        </div>
      </div>

      <!-- Firmas -->
      <div>
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-6"
        >
          Firmas de Conformidad
        </h3>
        <div class="grid grid-cols-3 gap-10">
          <div v-for="firma in firmas" :key="firma.rol" class="text-center">
            <div class="border-b-2 border-gray-400 h-16 mb-2 relative">
              <p
                v-if="firma.firmado"
                class="absolute bottom-1 left-0 right-0 text-center text-gray-300 text-xs italic"
              >
                Firmado digitalmente
              </p>
            </div>
            <p class="text-sm font-bold text-gray-700">{{ firma.nombre }}</p>
            <p class="text-xs text-gray-500">{{ firma.rol }}</p>
            <p class="text-xs text-gray-400 mt-1">C.I.: ___________________</p>
          </div>
        </div>

        <div
          class="mt-8 flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4"
        >
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span>Documento generado digitalmente por Sistema IBV</span>
          </div>
          <span>Lote {{ loteNumero }} | {{ fechaHoy }} {{ horaActual }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@page {
  size: A4;
  margin: 15mm;
}
@media print {
  .print\:hidden {
    display: none !important;
  }
  .print\:px-6 {
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
  }
  .print\:py-6 {
    padding-top: 1.5rem !important;
    padding-bottom: 1.5rem !important;
  }
  .print\:bg-white {
    background-color: #fff !important;
  }
  .print\:my-0 {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  .print\:rounded-none {
    border-radius: 0 !important;
  }
  .print\:shadow-none {
    box-shadow: none !important;
  }
  body {
    background-color: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
