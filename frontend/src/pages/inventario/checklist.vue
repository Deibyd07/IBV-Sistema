<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useInventarioStore, type InventarioVehiculo } from '~/stores/inventarioStore'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin' })

const vehiculoStore = useInventarioStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Vehicle selector
const showVehicleSelector = ref(false)
const vehicleSearch = ref('')
const selectedVin = ref<string | null>(null)

// Initialize from query param ?vin=
onMounted(async () => {
  await vehiculoStore.load()
  const vinParam = route.query.vin as string
  if (vinParam) {
    const v = vehiculoStore.getByVin(vinParam)
    if (v) selectedVin.value = v.vin
  }
})

// Get vehicles with completed improntas but pending inventory
const vehiculosDisponibles = computed(() => {
  let list = vehiculoStore.getPendientesInventario
  if (vehicleSearch.value) {
    const q = vehicleSearch.value.toLowerCase()
    list = list.filter(
      (v: InventarioVehiculo) =>
        v.vin.toLowerCase().includes(q) ||
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        (v.improntaFolio || '').toLowerCase().includes(q) ||
        v.cliente.toLowerCase().includes(q)
    )
  }
  return list
})

// Current vehicle being inspected
const vehiculoActual = computed(() => {
  if (selectedVin.value) {
    const found = vehiculoStore.getByVin(selectedVin.value)
    if (found) return found
  }
  // Default to first pending vehicle
  const first = vehiculoStore.getPendientesInventario[0]
  if (first) return first
  return {
    id: 0,
    vin: '—',
    placa: '',
    marca: '—',
    modelo: '',
    anio: '',
    color: '—',
    cliente: '—',
    fechaRecepcion: '',
    horaRecepcion: '',
    improntaCompletada: false,
    improntaRechazada: false,
    inventarioCompletado: false,
    inventarioAprobado: false,
    despachado: false,
    estado: 'recibido' as const,
  } as InventarioVehiculo
})

const seleccionarVehiculo = (v: InventarioVehiculo) => {
  selectedVin.value = v.vin
  showVehicleSelector.value = false
  // Reset checklist when switching vehicle
  categorias.forEach((cat: Categoria) => {
    cat.items.forEach((item: Item) => {
      item.estado = 'pendiente'
      item.nota = ''
    })
  })
  mostrarToast('ok', `Vehículo cambiado: ${v.marca} ${v.modelo}`)
}

const notaInspector = ref('')
const showModalRechazo = ref(false)
const motivoRechazo = ref('')
const showToast = ref(false)
const tipoToast = ref<'ok' | 'error'>('ok')
const mensajeToast = ref('')

interface Item {
  id: string
  nombre: string
  descripcion?: string
  estado: 'pendiente' | 'ok' | 'falla' | 'na'
  nota?: string
}

interface Categoria {
  id: string
  nombre: string
  descripcion: string
  icono: string
  colorFondo: string
  colorIcono: string
  abierta: boolean
  items: Item[]
}

const categorias = reactive<Categoria[]>([
  {
    id: 'documentacion',
    nombre: 'Documentación',
    descripcion: 'Documentos legales del vehículo',
    icono:
      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    colorFondo: 'bg-sky-500/15',
    colorIcono: 'text-sky-300',
    abierta: true,
    items: [
      {
        id: 'doc1',
        nombre: 'Certificado de Origen',
        descripcion: 'Documento original del fabricante',
        estado: 'pendiente',
      },
      {
        id: 'doc2',
        nombre: 'Factura de Compra',
        descripcion: 'Factura del concesionario o importador',
        estado: 'pendiente',
      },
      {
        id: 'doc3',
        nombre: 'Autorización de Tránsito',
        descripcion: 'Permiso de circulación vigente',
        estado: 'pendiente',
      },
      {
        id: 'doc4',
        nombre: 'Manifiesto de Importación',
        descripcion: 'Solo vehículos importados',
        estado: 'pendiente',
      },
    ],
  },
  {
    id: 'mecanico',
    nombre: 'Mecánico',
    descripcion: 'Estado del motor y componentes mecánicos',
    icono:
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    colorFondo: 'bg-orange-500/15',
    colorIcono: 'text-orange-300',
    abierta: false,
    items: [
      { id: 'mec1', nombre: 'Nivel de aceite del motor', estado: 'pendiente' },
      { id: 'mec2', nombre: 'Nivel de refrigerante', estado: 'pendiente' },
      { id: 'mec3', nombre: 'Nivel de líquido de frenos', estado: 'pendiente' },
      { id: 'mec4', nombre: 'Batería', descripcion: 'Estado y carga', estado: 'pendiente' },
      { id: 'mec5', nombre: 'Neumáticos', descripcion: 'Presión y desgaste', estado: 'pendiente' },
      {
        id: 'mec6',
        nombre: 'Frenos',
        descripcion: 'Funcionamiento del sistema de frenos',
        estado: 'pendiente',
      },
    ],
  },
  {
    id: 'electrico',
    nombre: 'Eléctrico',
    descripcion: 'Luces, señales y sistemas electrónicos',
    icono: 'M13 10V3L4 14h7v7l9-11h-7z',
    colorFondo: 'bg-amber-400/15',
    colorIcono: 'text-amber-300',
    abierta: false,
    items: [
      { id: 'ele1', nombre: 'Luces delanteras', estado: 'pendiente' },
      { id: 'ele2', nombre: 'Luces traseras', estado: 'pendiente' },
      { id: 'ele3', nombre: 'Luces de emergencia', estado: 'pendiente' },
      { id: 'ele4', nombre: 'Bocina', estado: 'pendiente' },
      { id: 'ele5', nombre: 'Radio / Sistema de audio', estado: 'pendiente' },
      { id: 'ele6', nombre: 'Aire acondicionado', estado: 'pendiente' },
      { id: 'ele7', nombre: 'Elevalunas eléctrico', estado: 'pendiente' },
      { id: 'ele8', nombre: 'Sensores y cámara de retro', estado: 'pendiente' },
    ],
  },
  {
    id: 'cosmético',
    nombre: 'Cosmético / Carrocería',
    descripcion: 'Estado visual de la carrocería',
    icono: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h14a2 2 0 012 2v12a4 4 0 01-4 4H7z',
    colorFondo: 'bg-rose-500/15',
    colorIcono: 'text-rose-300',
    abierta: false,
    items: [
      {
        id: 'cos1',
        nombre: 'Pintura',
        descripcion: 'Sin rayaduras ni burbujas',
        estado: 'pendiente',
      },
      {
        id: 'cos2',
        nombre: 'Parabrisas',
        descripcion: 'Sin grietas ni impactos',
        estado: 'pendiente',
      },
      { id: 'cos3', nombre: 'Ventanas laterales', estado: 'pendiente' },
      {
        id: 'cos4',
        nombre: 'Espejos',
        descripcion: 'Espejos laterales y retrovisor',
        estado: 'pendiente',
      },
      { id: 'cos5', nombre: 'Molduras y cromados', estado: 'pendiente' },
      { id: 'cos6', nombre: 'Rines y tapacubos', estado: 'pendiente' },
    ],
  },
  {
    id: 'accesorios',
    nombre: 'Accesorios',
    descripcion: 'Elementos incluidos con el vehículo',
    icono: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    colorFondo: 'bg-violet-500/15',
    colorIcono: 'text-violet-300',
    abierta: false,
    items: [
      { id: 'acc1', nombre: 'Llanta de repuesto', estado: 'pendiente' },
      { id: 'acc2', nombre: 'Gato hidráulico', estado: 'pendiente' },
      { id: 'acc3', nombre: 'Llave de ruedas', estado: 'pendiente' },
      { id: 'acc4', nombre: 'Manual del propietario', estado: 'pendiente' },
      {
        id: 'acc5',
        nombre: 'Llaves del vehículo',
        descripcion: 'Principal + copia',
        estado: 'pendiente',
      },
      { id: 'acc6', nombre: 'Triángulos de emergencia', estado: 'pendiente' },
    ],
  },
])

const todosLosItems = computed(() => categorias.flatMap((c: Categoria) => c.items))
const totalOk = computed(() => todosLosItems.value.filter((i: Item) => i.estado === 'ok').length)
const totalFallas = computed(
  () => todosLosItems.value.filter((i: Item) => i.estado === 'falla').length
)
const totalNa = computed(() => todosLosItems.value.filter((i: Item) => i.estado === 'na').length)
const totalPendientes = computed(
  () => todosLosItems.value.filter((i: Item) => i.estado === 'pendiente').length
)
const progresoGlobal = computed(() => {
  const resueltos = todosLosItems.value.filter((i: Item) => i.estado !== 'pendiente').length
  return Math.round((resueltos / todosLosItems.value.length) * 100)
})

const progresoCategoria = (cat: Categoria) => {
  if (cat.items.length === 0) return 0
  const resueltos = cat.items.filter((i) => i.estado !== 'pendiente').length
  return Math.round((resueltos / cat.items.length) * 100)
}

const itemsResueltos = (cat: Categoria) => cat.items.filter((i) => i.estado !== 'pendiente').length

const puedeAprobar = computed(() => progresoGlobal.value === 100)

const mostrarToast = (tipo: 'ok' | 'error', mensaje: string) => {
  tipoToast.value = tipo
  mensajeToast.value = mensaje
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const aprobar = async () => {
  if (!puedeAprobar.value) return
  const v = vehiculoActual.value
  if (!v || !v.vin || v.vin === '—') return

  const resultado = {
    totalItems: todosLosItems.value.length,
    aprobados: totalOk.value,
    fallas: totalFallas.value,
    na: totalNa.value,
    nota: notaInspector.value || undefined,
  }
  const inspector = authStore.user?.name || 'Inspector'
  try {
    await vehiculoStore.aprobarInventario(v.vin, resultado, inspector)
    mostrarToast('ok', `Inventario aprobado — ${v.marca} ${v.modelo} listo para despacho`)
    setTimeout(() => router.push('/inventario'), 1500)
  } catch (err) {
    console.error('Error aprobando inventario:', err)
    mostrarToast('error', 'No se pudo guardar el inventario')
  }
}

const rechazar = () => {
  showModalRechazo.value = true
}

const confirmarRechazo = async () => {
  const v = vehiculoActual.value
  if (v && v.vin && v.vin !== '—') {
    try {
      await vehiculoStore.rechazarInventario(v.vin, motivoRechazo.value, {
        resumen: {
          totalItems: todosLosItems.value.length,
          aprobados: totalOk.value,
          fallas: totalFallas.value,
          na: totalNa.value,
        },
        motivo: motivoRechazo.value,
      })
    } catch (err) {
      console.error('Error rechazando inventario:', err)
      mostrarToast('error', 'No se pudo guardar el rechazo')
      showModalRechazo.value = false
      return
    }
  }
  showModalRechazo.value = false
  mostrarToast('error', 'Inventario rechazado')
  setTimeout(() => router.push('/inventario'), 1500)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/inventario"
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
            INV — Módulo Inventario
          </p>
          <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
            Checklist de Inventario
          </h1>
          <p class="text-zinc-500 mt-1">Verificación de artículos del vehículo</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-semibold rounded-md hover:bg-red-500/15 transition"
          @click="rechazar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Rechazar
        </button>
        <button
          :disabled="!puedeAprobar"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md transition shadow-lg"
          :class="
            puedeAprobar
              ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/25'
              : 'bg-[#0b0e14] text-zinc-600 cursor-not-allowed shadow-none'
          "
          @click="aprobar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Aprobar Inventario
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <!-- Columna principal: Checklist -->
      <div class="xl:col-span-3 space-y-4">
        <!-- Info del vehículo -->
        <div
          class="bg-[#10141c] rounded-lg border border-white/[0.08] p-5 flex flex-wrap items-center gap-6"
        >
          <button
            title="Cambiar vehículo"
            class="w-14 h-14 bg-amber-400/[0.12] hover:bg-amber-400/[0.15] rounded-md flex items-center justify-center shrink-0 transition cursor-pointer group"
            @click="showVehicleSelector = true"
          >
            <svg
              class="w-8 h-8 text-amber-300 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>
          <div class="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-zinc-600 font-semibold uppercase">VIN</p>
              <p class="text-sm font-bold text-zinc-100 font-data">{{ vehiculoActual.vin }}</p>
            </div>
            <div>
              <p class="text-xs text-zinc-600 font-semibold uppercase">Vehículo</p>
              <p class="text-sm font-bold text-zinc-100">
                {{ vehiculoActual.marca }} {{ vehiculoActual.modelo }} {{ vehiculoActual.anio }}
              </p>
            </div>
            <div>
              <p class="text-xs text-zinc-600 font-semibold uppercase">Color</p>
              <p class="text-sm font-bold text-zinc-100">{{ vehiculoActual.color }}</p>
            </div>
            <div>
              <p class="text-xs text-zinc-600 font-semibold uppercase">Cliente</p>
              <p class="text-sm font-bold text-zinc-100">{{ vehiculoActual.cliente }}</p>
            </div>
          </div>
          <div
            class="flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/30 rounded-lg"
          >
            <div class="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span class="text-xs font-semibold text-amber-300">En verificación</span>
          </div>
        </div>

        <!-- Categorías del checklist -->
        <div
          v-for="categoria in categorias"
          :key="categoria.id"
          class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden"
        >
          <!-- Header de categoría -->
          <button
            class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#0d111a] transition"
            @click="categoria.abierta = !categoria.abierta"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-md flex items-center justify-center"
                :class="categoria.colorFondo"
              >
                <svg
                  class="w-4 h-4"
                  :class="categoria.colorIcono"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="categoria.icono"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100">
                  {{ categoria.nombre }}
                </h3>
                <p class="text-xs text-zinc-600">{{ categoria.descripcion }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <!-- Mini progreso -->
              <div class="hidden sm:flex items-center gap-2">
                <div class="w-32 bg-[#0b0e14] rounded-sm h-1.5">
                  <div
                    class="h-1.5 rounded-sm transition-all duration-500"
                    :class="
                      progresoCategoria(categoria) === 100 ? 'bg-emerald-500' : 'bg-amber-400'
                    "
                    :style="`width: ${progresoCategoria(categoria)}%`"
                  />
                </div>
                <span class="text-xs text-zinc-500 font-semibold w-16 text-right">
                  {{ itemsResueltos(categoria) }}/{{ categoria.items.length }}
                </span>
              </div>
              <svg
                class="w-5 h-5 text-zinc-600 transition-transform"
                :class="categoria.abierta ? 'rotate-180' : ''"
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
            </div>
          </button>

          <!-- Items de la categoría -->
          <div v-if="categoria.abierta" class="border-t border-white/[0.06]">
            <div
              v-for="(item, idx) in categoria.items"
              :key="item.id"
              class="px-5 py-3 flex items-start gap-4 transition-colors"
              :class="[
                Number(idx) < categoria.items.length - 1 ? 'border-b border-white/[0.05]' : '',
                item.estado === 'falla'
                  ? 'bg-red-500/10'
                  : item.estado === 'ok'
                    ? 'bg-emerald-500/10/40'
                    : 'hover:bg-[#0d111a]',
              ]"
            >
              <!-- Nombre del ítem -->
              <div class="flex-1 min-w-0 pt-0.5">
                <p class="text-sm font-medium text-zinc-100">{{ item.nombre }}</p>
                <p v-if="item.descripcion" class="text-xs text-zinc-600 mt-0.5">
                  {{ item.descripcion }}
                </p>
                <!-- Campo de notas para fallas -->
                <div v-if="item.estado === 'falla'" class="mt-2">
                  <input
                    v-model="item.nota"
                    type="text"
                    placeholder="Describir la falla o faltante..."
                    class="w-full px-2.5 py-1.5 text-xs border border-red-500/30 rounded-md bg-[#10141c] focus:outline-none focus:border-amber-400/70 transition"
                  />
                </div>
              </div>

              <!-- Botones de estado -->
              <div class="flex items-center gap-2 shrink-0">
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border-2 transition-all"
                  :class="
                    item.estado === 'ok'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-[#10141c] border-white/[0.08] text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400'
                  "
                  @click="item.estado = 'ok'"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  OK
                </button>
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border-2 transition-all"
                  :class="
                    item.estado === 'falla'
                      ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30'
                      : 'bg-[#10141c] border-white/[0.08] text-zinc-500 hover:border-red-400/50 hover:text-red-400'
                  "
                  @click="item.estado = 'falla'"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Falla
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all"
                  :class="
                    item.estado === 'na'
                      ? 'bg-zinc-600 border-white/[0.15] text-white'
                      : 'bg-[#10141c] border-white/[0.08] text-zinc-500 hover:border-white/[0.15] hover:text-zinc-200'
                  "
                  @click="item.estado = 'na'"
                >
                  N/A
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna lateral: Resumen -->
      <div class="space-y-4">
        <!-- Progreso global -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-5">
          <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100 mb-4">
            Progreso General
          </h3>
          <div class="flex items-center justify-center mb-5">
            <div class="relative w-44 h-44">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.06)"
                  stroke-width="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  :stroke="progresoGlobal === 100 ? '#34d399' : '#fbbf24'"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="`${progresoGlobal * 2.64} 264`"
                  class="transition-all duration-700"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  class="font-data text-4xl font-bold"
                  :class="progresoGlobal === 100 ? 'text-emerald-400' : 'text-amber-300'"
                >
                  {{ progresoGlobal }}%
                </span>
                <span
                  class="font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1"
                >
                  completado
                </span>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-zinc-500 flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                Aprobados
              </span>
              <span class="font-bold text-emerald-400">{{ totalOk }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-zinc-500 flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-red-500 rounded-full" />
                Con falla
              </span>
              <span class="font-bold text-red-400">{{ totalFallas }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-zinc-500 flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-white/[0.12] rounded-full" />
                No aplica
              </span>
              <span class="font-bold text-zinc-500">{{ totalNa }}</span>
            </div>
            <div
              class="flex items-center justify-between text-sm border-t border-white/[0.06] pt-2 mt-1"
            >
              <span class="text-zinc-500 flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-white/[0.06] rounded-full" />
                Pendientes
              </span>
              <span class="font-bold text-zinc-400">{{ totalPendientes }}</span>
            </div>
          </div>
        </div>

        <!-- Acciones rápidas por categoría -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-5">
          <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100 mb-4">
            Estado por Sección
          </h3>
          <div class="space-y-3">
            <div v-for="cat in categorias" :key="cat.id" class="flex items-center gap-3">
              <div
                class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                :class="cat.colorFondo"
              >
                <svg
                  class="w-3 h-3"
                  :class="cat.colorIcono"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="cat.icono"
                  />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs font-semibold text-zinc-400 truncate">{{ cat.nombre }}</span>
                  <span class="text-xs text-zinc-600 ml-2 shrink-0">
                    {{ progresoCategoria(cat) }}%
                  </span>
                </div>
                <div class="w-full bg-[#0b0e14] rounded-sm h-1">
                  <div
                    class="h-1 rounded-sm transition-all duration-500"
                    :class="progresoCategoria(cat) === 100 ? 'bg-emerald-400' : 'bg-amber-400'"
                    :style="`width: ${progresoCategoria(cat)}%`"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Nota de aprobación -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-5">
          <label
            class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-2"
          >
            Nota del inspector
          </label>
          <textarea
            v-model="notaInspector"
            rows="3"
            placeholder="Observaciones finales del inspector..."
            class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition resize-none"
          />
        </div>
      </div>
    </div>

    <!-- Modal de rechazo -->
    <div
      v-if="showModalRechazo"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div class="bg-[#10141c] rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-red-500/15 rounded-md flex items-center justify-center">
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 class="font-display text-base uppercase tracking-tight text-zinc-100">
            Rechazar Inventario
          </h2>
        </div>
        <p class="text-sm text-zinc-400 mb-4">
          Indica el motivo del rechazo. El vehículo será devuelto para correcciones.
        </p>
        <textarea
          v-model="motivoRechazo"
          rows="3"
          placeholder="Motivo del rechazo..."
          class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition resize-none mb-4"
        />
        <div class="flex gap-3 justify-end">
          <button
            class="px-4 py-2.5 border border-white/[0.08] text-zinc-200 text-sm font-semibold rounded-md hover:bg-[#0d111a] transition"
            @click="showModalRechazo = false"
          >
            Cancelar
          </button>
          <button
            class="px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition"
            @click="confirmarRechazo"
          >
            Confirmar Rechazo
          </button>
        </div>
      </div>
    </div>

    <!-- Modal selector de vehículo -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showVehicleSelector"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            @click="showVehicleSelector = false"
          />
          <div
            class="relative bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 w-full max-w-lg max-h-[80vh] flex flex-col"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-white/[0.06] shrink-0">
              <h3 class="font-display text-base uppercase tracking-tight text-zinc-100">
                Seleccionar Vehículo
              </h3>
              <p class="text-sm text-zinc-500 mt-0.5">Elige el vehículo para inspeccionar</p>
            </div>
            <!-- Search -->
            <div class="px-6 py-3 border-b border-white/[0.06] shrink-0">
              <div class="relative">
                <svg
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600"
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
                  v-model="vehicleSearch"
                  type="text"
                  placeholder="Buscar por VIN, placa, marca..."
                  class="w-full pl-9 pr-4 py-2 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70"
                />
              </div>
            </div>
            <!-- List -->
            <div class="overflow-y-auto flex-1 px-3 py-2">
              <div v-if="vehiculosDisponibles.length === 0" class="py-8 text-center">
                <p class="text-zinc-600 text-sm">No hay vehículos disponibles</p>
              </div>
              <button
                v-for="v in vehiculosDisponibles"
                :key="v.id"
                class="w-full flex items-center gap-4 p-3 rounded-md text-left transition"
                :class="
                  vehiculoActual.vin === v.vin
                    ? 'bg-amber-400/[0.08] border-2 border-amber-400/40'
                    : 'hover:bg-[#0d111a] border-2 border-transparent'
                "
                @click="seleccionarVehiculo(v)"
              >
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  :class="
                    vehiculoActual.vin === v.vin
                      ? 'bg-amber-400 text-black'
                      : 'bg-[#0b0e14] text-zinc-500'
                  "
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 17h.01M12 17h.01M16 17h.01M3.5 11l.5-2a2 2 0 011.9-1.4h12.2A2 2 0 0120 9l.5 2M4 17a2 2 0 01-2-2v-2h20v2a2 2 0 01-2 2H4z"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-zinc-100">
                    {{ v.marca }} {{ v.modelo }} {{ v.anio }}
                  </p>
                  <p class="text-xs text-zinc-500 font-data">
                    {{ v.placa || 'Sin placa' }} · {{ v.vin ? v.vin.slice(-8) : 'S/N' }}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-xs text-zinc-600">{{ v.improntaFolio || '' }}</p>
                  <p class="text-xs text-zinc-500">{{ v.cliente || '—' }}</p>
                </div>
                <svg
                  v-if="vehiculoActual.vin === v.vin"
                  class="w-5 h-5 text-amber-300 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </button>
            </div>
            <!-- Footer -->
            <div class="px-6 py-3 border-t border-white/[0.06] shrink-0 flex justify-end">
              <button
                class="px-4 py-2 bg-[#0b0e14] text-zinc-200 font-semibold rounded-md hover:bg-white/[0.06] transition text-sm"
                @click="showVehicleSelector = false"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
    <div
      v-if="showToast"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 text-white animate-bounce-in"
      :class="tipoToast === 'ok' ? 'bg-emerald-600' : 'bg-red-500'"
    >
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          v-if="tipoToast === 'ok'"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <path
          v-else
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <span class="font-semibold">{{ mensajeToast }}</span>
    </div>
  </div>
</template>
