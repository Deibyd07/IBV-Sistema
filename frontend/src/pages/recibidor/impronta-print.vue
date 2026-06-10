<script setup lang="ts">
import { computed } from 'vue'
import { useImprontaStore, type Impronta } from '~/stores/improntaStore'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const store = useImprontaStore()

const improntaId = computed(() => (route.query.id as string) || '')

const imp = computed<Impronta | undefined>(() => {
  if (!improntaId.value) return undefined
  return store.getById(improntaId.value)
})

const formatDate = (d: string) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = [
    '',
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ]
  return `${day} de ${months[parseInt(m)]} de ${y}`
}

const camposVehiculo = computed(() => {
  if (!imp.value) return []
  return [
    { key: 'vin', label: 'VIN/Chasis', valor: imp.value.vin },
    { key: 'placa', label: 'Placa', valor: imp.value.placa },
    { key: 'marca', label: 'Marca', valor: imp.value.marca },
    { key: 'modelo', label: 'Modelo', valor: imp.value.modelo },
    { key: 'anio', label: 'Año', valor: imp.value.anio },
    { key: 'color', label: 'Color', valor: imp.value.color },
    { key: 'km', label: 'Kilometraje', valor: imp.value.km ? `${imp.value.km} km` : '' },
    { key: 'cliente', label: 'Cliente', valor: imp.value.cliente },
  ]
})

const condicionesOpciones = [
  { value: 'excelente', label: 'Excelente' },
  { value: 'bueno', label: 'Bueno' },
  { value: 'regular', label: 'Regular' },
  { value: 'dañado', label: 'Con daños' },
]

const vistaLabels: Record<string, string> = {
  frontal: 'Vista Frontal',
  trasera: 'Vista Trasera',
  lateral_izq: 'Lateral Izquierdo',
  lateral_der: 'Lateral Derecho',
  tablero: 'Tablero',
  odometro: 'Odómetro',
}

const fotosImprimibles = computed(() => {
  if (!imp.value) return []
  const vistas = ['frontal', 'trasera', 'lateral_izq', 'lateral_der', 'tablero', 'odometro']
  return vistas
    .filter((k) => imp.value!.fotos[k])
    .map((k) => ({
      label: vistaLabels[k] || k,
      url: imp.value!.fotos[k],
    }))
})

const firmas = computed(() => {
  const recibidor = imp.value?.creadoPor || '___________________'
  return [
    { nombre: recibidor, rol: 'Recibidor' },
    { nombre: '___________________', rol: 'Conductor / Transportista' },
    { nombre: '___________________', rol: 'Supervisor' },
  ]
})

const imprimir = () => window.print()
</script>

<template>
  <div class="min-h-screen bg-[#0b0e14] print:bg-white">
    <!-- Controles de pantalla (no se imprimen) -->
    <div
      class="print:hidden flex items-center justify-between px-8 py-4 bg-[#0d111a]/90 backdrop-blur-lg border-b border-white/[0.08] sticky top-0 z-10"
    >
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="improntaId ? `/recibidor/impronta?id=${improntaId}` : '/recibidor'"
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
          {{ improntaId ? 'Volver al formulario' : 'Volver al panel' }}
        </NuxtLink>
      </div>
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
        Imprimir / Exportar PDF
      </button>
    </div>

    <!-- Error state -->
    <div v-if="!imp" class="max-w-md mx-auto mt-24 text-center px-6">
      <svg
        class="w-20 h-20 text-zinc-700 mx-auto mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h2 class="text-xl font-bold text-zinc-200 mb-2">Impronta no encontrada</h2>
      <p class="text-zinc-500 mb-6">
        No se encontró la impronta solicitada. Es posible que haya sido eliminada.
      </p>
      <NuxtLink
        to="/recibidor"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black font-semibold rounded-md hover:bg-amber-300 transition"
      >
        Volver al panel
      </NuxtLink>
    </div>

    <!-- Documento imprimible (hoja blanca: vista previa del documento) -->
    <div
      v-else
      class="max-w-[850px] mx-auto px-8 py-10 bg-white my-8 rounded-lg shadow-2xl shadow-black/60 print:my-0 print:rounded-none print:shadow-none print:px-6 print:py-6"
    >
      <!-- Encabezado de la empresa -->
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
        <div class="text-right">
          <div class="inline-block border-2 border-gray-900 px-4 py-2 rounded-xl">
            <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Folio N°</p>
            <p class="text-2xl font-black text-gray-900">{{ imp.folio }}</p>
          </div>
        </div>
      </div>

      <!-- Título del documento -->
      <div class="text-center mb-6">
        <h2 class="text-2xl font-black text-gray-900 uppercase tracking-widest">
          Acta de Impronta Vehicular
        </h2>
        <p class="text-sm text-gray-500 mt-1">Documento de registro de condición al ingreso</p>
      </div>

      <!-- Metadatos del registro -->
      <div class="grid grid-cols-3 gap-4 mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div>
          <p class="text-xs text-gray-500 font-semibold uppercase">Fecha de Ingreso</p>
          <p class="text-sm font-bold text-gray-900">{{ formatDate(imp.fechaCreacion) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-semibold uppercase">Hora</p>
          <p class="text-sm font-bold text-gray-900">{{ imp.horaCreacion }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-semibold uppercase">Recibido por</p>
          <p class="text-sm font-bold text-gray-900">{{ imp.creadoPor }}</p>
        </div>
      </div>

      <!-- Datos del vehículo -->
      <div class="mb-6">
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-4"
        >
          I. Datos del Vehículo
        </h3>
        <div class="grid grid-cols-2 gap-x-8 gap-y-3">
          <div v-for="campo in camposVehiculo" :key="campo.key" class="flex items-baseline gap-2">
            <span
              class="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap w-24 shrink-0"
            >
              {{ campo.label }}:
            </span>
            <div class="flex-1 border-b border-dotted border-gray-300 pb-0.5">
              <span class="text-sm text-gray-900 font-medium">{{ campo.valor || '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Condición general -->
      <div class="mb-6">
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-4"
        >
          II. Condición General
        </h3>
        <div class="flex gap-6">
          <label
            v-for="opcion in condicionesOpciones"
            :key="opcion.value"
            class="flex items-center gap-2"
          >
            <div
              class="w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center"
              :class="imp.condicion === opcion.value ? 'bg-gray-900 border-gray-900' : ''"
            >
              <svg
                v-if="imp.condicion === opcion.value"
                class="w-2.5 h-2.5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700">{{ opcion.label }}</span>
          </label>
        </div>
      </div>

      <!-- Mapa de daños -->
      <div class="mb-6">
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-4"
        >
          III. Diagrama de Daños
        </h3>
        <div class="flex gap-8 items-start">
          <div class="shrink-0">
            <svg viewBox="0 0 320 500" width="160" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="60"
                y="140"
                width="200"
                height="220"
                rx="20"
                fill="#f1f5f9"
                stroke="#475569"
                stroke-width="2"
              />
              <rect
                x="90"
                y="155"
                width="140"
                height="120"
                rx="10"
                fill="#e2e8f0"
                stroke="#475569"
                stroke-width="1.5"
              />
              <rect
                x="80"
                y="60"
                width="160"
                height="85"
                rx="15"
                fill="#f1f5f9"
                stroke="#475569"
                stroke-width="2"
              />
              <rect
                x="80"
                y="355"
                width="160"
                height="85"
                rx="15"
                fill="#f1f5f9"
                stroke="#475569"
                stroke-width="2"
              />
              <circle cx="80" cy="170" r="28" fill="#334155" stroke="#1e293b" stroke-width="2" />
              <circle cx="80" cy="170" r="14" fill="#64748b" />
              <circle cx="240" cy="170" r="28" fill="#334155" stroke="#1e293b" stroke-width="2" />
              <circle cx="240" cy="170" r="14" fill="#64748b" />
              <circle cx="80" cy="330" r="28" fill="#334155" stroke="#1e293b" stroke-width="2" />
              <circle cx="80" cy="330" r="14" fill="#64748b" />
              <circle cx="240" cy="330" r="28" fill="#334155" stroke="#1e293b" stroke-width="2" />
              <circle cx="240" cy="330" r="14" fill="#64748b" />
              <text
                x="160"
                y="108"
                text-anchor="middle"
                fill="#475569"
                font-size="11"
                font-weight="600"
              >
                FRONTAL
              </text>
              <text
                x="160"
                y="400"
                text-anchor="middle"
                fill="#475569"
                font-size="11"
                font-weight="600"
              >
                TRASERO
              </text>
              <text
                x="160"
                y="218"
                text-anchor="middle"
                fill="#475569"
                font-size="11"
                font-weight="600"
              >
                TECHO
              </text>
              <text
                x="42"
                y="252"
                text-anchor="middle"
                fill="#475569"
                font-size="10"
                font-weight="600"
                transform="rotate(-90 42 252)"
              >
                LAT. IZQ
              </text>
              <text
                x="278"
                y="252"
                text-anchor="middle"
                fill="#475569"
                font-size="10"
                font-weight="600"
                transform="rotate(90 278 252)"
              >
                LAT. DER
              </text>
              <!-- Marcadores dinámicos -->
              <g v-for="zona in imp.zonasDañadas" :key="zona">
                <circle v-if="zona === 'frontal'" cx="160" cy="95" r="12" fill="#ef4444" />
                <text
                  v-if="zona === 'frontal'"
                  x="160"
                  y="100"
                  text-anchor="middle"
                  fill="white"
                  font-size="14"
                  font-weight="bold"
                >
                  !
                </text>
                <circle v-if="zona === 'trasero'" cx="160" cy="390" r="12" fill="#ef4444" />
                <text
                  v-if="zona === 'trasero'"
                  x="160"
                  y="395"
                  text-anchor="middle"
                  fill="white"
                  font-size="14"
                  font-weight="bold"
                >
                  !
                </text>
                <circle v-if="zona === 'lateral_izq'" cx="70" cy="250" r="12" fill="#ef4444" />
                <text
                  v-if="zona === 'lateral_izq'"
                  x="70"
                  y="255"
                  text-anchor="middle"
                  fill="white"
                  font-size="14"
                  font-weight="bold"
                >
                  !
                </text>
                <circle v-if="zona === 'lateral_der'" cx="250" cy="250" r="12" fill="#ef4444" />
                <text
                  v-if="zona === 'lateral_der'"
                  x="250"
                  y="255"
                  text-anchor="middle"
                  fill="white"
                  font-size="14"
                  font-weight="bold"
                >
                  !
                </text>
                <circle v-if="zona === 'techo'" cx="160" cy="212" r="12" fill="#ef4444" />
                <text
                  v-if="zona === 'techo'"
                  x="160"
                  y="217"
                  text-anchor="middle"
                  fill="white"
                  font-size="14"
                  font-weight="bold"
                >
                  !
                </text>
              </g>
            </svg>
          </div>
          <!-- Tabla de daños -->
          <div class="flex-1">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th
                    class="text-left py-2 px-3 text-xs font-bold text-gray-600 border border-gray-200"
                  >
                    Zona
                  </th>
                  <th
                    class="text-left py-2 px-3 text-xs font-bold text-gray-600 border border-gray-200"
                  >
                    Tipo de daño
                  </th>
                  <th
                    class="text-left py-2 px-3 text-xs font-bold text-gray-600 border border-gray-200"
                  >
                    Severidad
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(daño, i) in imp.daños"
                  :key="i"
                  :class="i % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                >
                  <td class="py-2 px-3 border border-gray-200 font-medium">{{ daño.zona }}</td>
                  <td class="py-2 px-3 border border-gray-200 text-gray-600">{{ daño.tipo }}</td>
                  <td class="py-2 px-3 border border-gray-200">
                    <span
                      :class="{
                        'text-danger-600 font-semibold': daño.severidad === 'Alta',
                        'text-warning-600 font-semibold': daño.severidad === 'Media',
                        'text-gray-500': daño.severidad === 'Baja',
                      }"
                    >
                      {{ daño.severidad }}
                    </span>
                  </td>
                </tr>
                <tr v-if="imp.daños.length === 0">
                  <td
                    colspan="3"
                    class="py-3 px-3 text-center text-gray-400 border border-gray-200"
                  >
                    Sin daños registrados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="mb-6">
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-3"
        >
          IV. Observaciones Generales
        </h3>
        <div class="min-h-[80px] border border-gray-300 rounded-xl p-3">
          <p class="text-sm text-gray-700">
            {{ imp.observaciones || 'Sin observaciones adicionales.' }}
          </p>
        </div>
      </div>

      <!-- Fotografías -->
      <div class="mb-8">
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-4"
        >
          V. Registro Fotográfico
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="foto in fotosImprimibles"
            :key="foto.label"
            class="border border-gray-200 rounded-xl overflow-hidden"
          >
            <img :src="foto.url" :alt="foto.label" class="w-full h-28 object-cover bg-gray-100" />
            <p
              class="text-xs text-center text-gray-500 font-semibold py-1.5 border-t border-gray-200"
            >
              {{ foto.label }}
            </p>
          </div>
        </div>
        <!-- Fotos adicionales -->
        <div v-if="imp.fotosAdicionales.length > 0" class="mt-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Fotos de Daños Adicionales
          </p>
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="(foto, idx) in imp.fotosAdicionales"
              :key="idx"
              class="border border-gray-200 rounded-lg overflow-hidden"
            >
              <img
                :src="foto"
                :alt="`Daño ${idx + 1}`"
                class="w-full h-20 object-cover bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Firmas -->
      <div>
        <h3
          class="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-2 mb-6"
        >
          VI. Firmas y Conformidad
        </h3>
        <div class="grid grid-cols-3 gap-8">
          <div v-for="firma in firmas" :key="firma.rol" class="text-center">
            <div class="border-b-2 border-gray-400 h-16 mb-2"></div>
            <p class="text-sm font-bold text-gray-700">{{ firma.nombre }}</p>
            <p class="text-xs text-gray-500">{{ firma.rol }}</p>
            <p class="text-xs text-gray-400 mt-1">C.I.: ___________________</p>
          </div>
        </div>
        <div
          class="mt-6 flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4"
        >
          <span>Sistema IBV — Documento generado digitalmente</span>
          <span>Folio {{ imp.folio }} | {{ formatDate(imp.fechaCreacion) }}</span>
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
