<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useImprontaStore, type DañoZona } from '~/stores/improntaStore'
import { useContenedorStore } from '~/stores/contenedorStore'
import { useVehiculoStore } from '~/stores/vehiculoStore'

// ── QR Scanner ──────────────────────────────────────────
type QrScannerRef = {
  setError: (msg: string) => void
  setSuccess: (msg: string) => void
  reset: () => void
} | null

const showModalQr = ref(false)
const scannerImpronta = ref<QrScannerRef>(null)

// ── QR Scanner Contenedor ───────────────────────────────
const showModalQrContenedor = ref(false)
const scannerContenedor = ref<QrScannerRef>(null)

/**
 * Intenta parsear el contenido del QR del vehículo.
 * Formatos soportados:
 *  1. JSON   → {"vin":"...","marca":"...","modelo":"...","anio":"...","color":"...","placa":"...","km":"...","cliente":"..."}
 *  2. Pipes  → VIN|MARCA|MODELO|AÑO|COLOR
 *  3. Solo VIN/código → rellena únicamente el campo VIN
 */
const parsearQrVehiculo = (raw: string) => {
  raw = raw.trim()

  // JSON
  if (raw.startsWith('{')) {
    try {
      const obj = JSON.parse(raw)
      if (obj.vin) form.vin = String(obj.vin)
      if (obj.placa) form.placa = String(obj.placa)
      if (obj.marca) form.marca = String(obj.marca)
      if (obj.modelo) form.modelo = String(obj.modelo)
      if (obj.anio) form.anio = String(obj.anio)
      if (obj.color) form.color = String(obj.color)
      if (obj.km) form.km = String(obj.km)
      if (obj.cliente) form.cliente = String(obj.cliente)
      return true
    } catch {
      return false
    }
  }

  // Pipe-delimited: VIN|MARCA|MODELO|AÑO|COLOR
  if (raw.includes('|')) {
    const parts = raw.split('|').map((s) => s.trim())
    if (parts[0]) form.vin = parts[0]
    if (parts[1]) form.marca = parts[1]
    if (parts[2]) form.modelo = parts[2]
    if (parts[3]) form.anio = parts[3]
    if (parts[4]) form.color = parts[4]
    if (parts[5]) form.placa = parts[5]
    return true
  }

  // VIN solo
  form.vin = raw
  return true
}

const onScanImpronta = (codigo: string) => {
  const ok = parsearQrVehiculo(codigo)
  if (ok) {
    scannerImpronta.value?.setSuccess('Datos del vehículo cargados')
    setTimeout(() => {
      showModalQr.value = false
    }, 1200)
    showToast('Datos del vehículo leídos del QR', 'success')
  } else {
    scannerImpronta.value?.setError('No se pudo leer el QR. Revisa el formato.')
  }
}

definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const store = useImprontaStore()
const contStore = useContenedorStore()
const vehiculoStore = useVehiculoStore()

// ── Contenedor (asignar a esta impronta) ────────────────────
const contenedorCodigo = ref('')
const contenedorId = ref<string | null>(null)
const contenedorNombre = ref('') // display label

const onScanContenedorImpronta = (codigo: string) => {
  const cont = contStore.getByCodigo(codigo.trim())
  if (cont) {
    contenedorCodigo.value = cont.codigo
    contenedorId.value = cont.id
    contenedorNombre.value = `${cont.codigo} — ${cont.origen}`
    scannerContenedor.value?.setSuccess(`Contenedor ${cont.codigo} encontrado`)
    setTimeout(() => {
      showModalQrContenedor.value = false
    }, 1000)
    showToast(`Contenedor ${cont.codigo} asignado`, 'success')
  } else {
    scannerContenedor.value?.setSuccess(`Contenedor "${codigo.trim()}" no encontrado en el sistema`)
    showToast(`Contenedor "${codigo.trim()}" no existe en la tabla de contenedores`, 'error')
  }
}

const limpiarContenedor = () => {
  contenedorCodigo.value = ''
  contenedorId.value = null
  contenedorNombre.value = ''
}

const fileInput = ref<HTMLInputElement | null>(null)
const currentVista = ref<string | null>(null)
const saving = ref(false)
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('success')

// Modelos pre-establecidos
const modelosPreestablecidos: Record<string, { modelos: string[]; anio?: string }> = {
  Toyota: {
    modelos: ['Corolla', 'Hilux', 'Yaris', 'Rav4', 'Camry', 'Fortuner', 'Land Cruiser', 'Prado'],
  },
  Chevrolet: {
    modelos: ['Spark', 'Aveo', 'Cruze', 'Tracker', 'Onix', 'Captiva', 'Tahoe', 'Silverado'],
  },
  Kia: { modelos: ['Rio', 'Sportage', 'Seltos', 'Sorento', 'Cerato', 'Carnival', 'Picanto'] },
  Hyundai: { modelos: ['Accent', 'Tucson', 'Santa Fe', 'Elantra', 'Creta', 'Venue', 'Palisade'] },
  Ford: { modelos: ['Explorer', 'Escape', 'Ranger', 'Bronco', 'Edge', 'Maverick', 'F-150'] },
  Nissan: { modelos: ['Versa', 'Sentra', 'Kicks', 'X-Trail', 'Frontier', 'Pathfinder', 'March'] },
  Mazda: { modelos: ['Mazda3', 'CX-5', 'CX-30', 'CX-50', 'Mazda6', 'CX-9', 'MX-5'] },
  Honda: { modelos: ['Civic', 'CR-V', 'HR-V', 'Accord', 'Pilot', 'City', 'Fit'] },
  Volkswagen: { modelos: ['Jetta', 'Tiguan', 'T-Cross', 'Taos', 'Golf', 'Polo', 'Amarok'] },
  Mitsubishi: { modelos: ['Outlander', 'L200', 'Eclipse Cross', 'ASX', 'Montero', 'Lancer'] },
  Suzuki: { modelos: ['Swift', 'Vitara', 'Jimny', 'S-Cross', 'Baleno', 'Ertiga'] },
  Renault: { modelos: ['Duster', 'Logan', 'Sandero', 'Koleos', 'Captur', 'Kwid'] },
}

const marcasDisponibles = Object.keys(modelosPreestablecidos)
const modelosFiltrados = computed(() =>
  form.marca && modelosPreestablecidos[form.marca] ? modelosPreestablecidos[form.marca].modelos : []
)
const showMarcaDropdown = ref(false)
const showModeloDropdown = ref(false)
const marcaSearch = ref('')
const marcasFiltradas = computed(() => {
  const q = marcaSearch.value.toLowerCase()
  return q ? marcasDisponibles.filter((m) => m.toLowerCase().includes(q)) : marcasDisponibles
})

const seleccionarMarca = (marca: string) => {
  form.marca = marca
  form.modelo = ''
  showMarcaDropdown.value = false
  marcaSearch.value = ''
}

const seleccionarModelo = (modelo: string) => {
  form.modelo = modelo
  showModeloDropdown.value = false
}

// Close dropdowns on click outside
if (import.meta.client) {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showMarcaDropdown.value = false
      showModeloDropdown.value = false
    }
  })
}

// Edit mode
const editingId = ref<string | null>(null)
const editingFolio = ref('')
const isEditing = computed(() => !!editingId.value)

const form = reactive({
  vin: '',
  placa: '',
  marca: '',
  modelo: '',
  anio: '',
  color: '',
  km: '',
  cliente: '',
  condicion: '' as '' | 'excelente' | 'bueno' | 'regular' | 'dañado',
  observaciones: '',
})

const errors = reactive<Record<string, string>>({})

const zonasDañadas = ref<string[]>([])
const dañoDetalles = reactive<
  Record<string, { tipo: string; severidad: 'Baja' | 'Media' | 'Alta' }>
>({})
const fotosCapturadas = ref<Record<string, string>>({})
const fotosAdicionales = ref<string[]>([])

const vistasRequeridas = [
  { key: 'frontal', label: 'Vista Frontal' },
  { key: 'trasera', label: 'Vista Trasera' },
  { key: 'lateral_izq', label: 'Lateral Izquierdo' },
  { key: 'lateral_der', label: 'Lateral Derecho' },
  { key: 'tablero', label: 'Tablero' },
  { key: 'odometro', label: 'Odómetro' },
]

const zonaNombres: Record<string, string> = {
  frontal: 'Parte Frontal',
  trasero: 'Parte Trasera',
  lateral_izq: 'Lateral Izquierdo',
  lateral_der: 'Lateral Derecho',
  techo: 'Techo',
}

// Load existing impronta for editing, or pre-fill from query params
onMounted(async () => {
  // Asegurar que los contenedores estén cargados para el dropdown
  if (contStore.contenedores.length === 0) {
    await contStore.fetchContenedores()
  }

  const id = route.query.id as string
  if (id) {
    const imp = store.getById(id)
    if (imp) {
      editingId.value = imp.id
      editingFolio.value = imp.folio
      form.vin = imp.vin
      form.placa = imp.placa
      form.marca = imp.marca
      form.modelo = imp.modelo
      form.anio = imp.anio
      form.color = imp.color
      form.km = imp.km
      form.cliente = imp.cliente
      form.condicion = imp.condicion
      form.observaciones = imp.observaciones
      zonasDañadas.value = [...imp.zonasDañadas]
      // Rebuild dañoDetalles from stored daños
      for (const d of imp.daños) {
        const key = Object.entries(zonaNombres).find(([_, v]) => v === d.zona)?.[0] || ''
        if (key) {
          dañoDetalles[key] = { tipo: d.tipo, severidad: d.severidad }
        }
      }
      fotosCapturadas.value = { ...imp.fotos }
      fotosAdicionales.value = [...imp.fotosAdicionales]
    }
  } else {
    // Pre-fill from query params (e.g. coming from "Estado Improntas" page)
    if (route.query.vin) form.vin = String(route.query.vin)
    if (route.query.marca) form.marca = String(route.query.marca)
    if (route.query.modelo) form.modelo = String(route.query.modelo)
    if (route.query.anio) form.anio = String(route.query.anio)
    if (route.query.color) form.color = String(route.query.color)
    if (route.query.placa) form.placa = String(route.query.placa)
    if (route.query.cliente) form.cliente = String(route.query.cliente)
  }
})

// Ensure dañoDetalles has entry for each zone
watch(
  zonasDañadas,
  (zones: string[]) => {
    for (const z of zones) {
      if (!dañoDetalles[z]) {
        dañoDetalles[z] = { tipo: '', severidad: 'Baja' }
      }
    }
    // Remove entries for zones that were deselected
    for (const key of Object.keys(dañoDetalles)) {
      if (!zones.includes(key)) delete dañoDetalles[key]
    }
  },
  { immediate: true, deep: true }
)

const toggleZona = (zona: string) => {
  const idx = zonasDañadas.value.indexOf(zona)
  if (idx > -1) zonasDañadas.value.splice(idx, 1)
  else zonasDañadas.value.push(zona)
}

const zonaNombre = (key: string) => zonaNombres[key] || key

const capturarFoto = (vistaKey: string) => {
  currentVista.value = vistaKey
  // Use file input to pick real image, or fall back to placeholder
  if (fileInput.value) {
    fileInput.value.value = ''
    fileInput.value.click()
  } else {
    // Fallback: placeholder
    const placeholders: Record<string, string> = {
      frontal: 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Frontal',
      trasera: 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Trasera',
      lateral_izq: 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Lat+Izq',
      lateral_der: 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Lat+Der',
      tablero: 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Tablero',
      odometro: 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Odometro',
    }
    fotosCapturadas.value[vistaKey] =
      placeholders[vistaKey] || `https://placehold.co/400x300/e2e8f0/94a3b8?text=${vistaKey}`
  }
}

const eliminarFoto = (vistaKey: string) => {
  delete fotosCapturadas.value[vistaKey]
}

const agregarFotoAdicional = () => {
  // Trigger file selection for additional photos
  currentVista.value = '__adicional__'
  if (fileInput.value) {
    fileInput.value.value = ''
    fileInput.value.click()
  } else {
    fotosAdicionales.value.push('https://placehold.co/200x150/fef3c7/d97706?text=Daño')
  }
}

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    if (currentVista.value === '__adicional__') {
      fotosAdicionales.value.push(dataUrl)
    } else if (currentVista.value) {
      fotosCapturadas.value[currentVista.value] = dataUrl
    }
    currentVista.value = null
  }
  reader.readAsDataURL(file)
}

const camposLlenos = computed(() => {
  const campos = ['vin', 'marca', 'modelo', 'condicion'] as const
  return campos.filter((c) => form[c]).length
})

const progresoDatos = computed(() => Math.round((camposLlenos.value / 4) * 100))
const progresoFotos = computed(() =>
  Math.round((Object.keys(fotosCapturadas.value).length / vistasRequeridas.length) * 100)
)
const listo = computed(() => progresoDatos.value >= 100 && progresoFotos.value >= 50)

const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
  toastMsg.value = msg
  toastType.value = type
  setTimeout(() => {
    toastMsg.value = ''
  }, 3500)
}

const validate = (): boolean => {
  // Clear errors
  for (const key of Object.keys(errors)) delete errors[key]

  if (!form.vin.trim()) errors.vin = 'El VIN es obligatorio'
  if (!form.marca.trim()) errors.marca = 'La marca es obligatoria'
  if (!form.modelo.trim()) errors.modelo = 'El modelo es obligatorio'
  if (!form.condicion) errors.condicion = 'Selecciona una condición'

  return Object.keys(errors).length === 0
}

const buildDaños = (): DañoZona[] => {
  return zonasDañadas.value.map((z: string) => ({
    zona: zonaNombre(z),
    tipo: dañoDetalles[z]?.tipo || 'Sin especificar',
    severidad: dañoDetalles[z]?.severidad || 'Baja',
  }))
}

const guardarImpronta = async () => {
  if (!validate()) {
    showToast('Completa los campos obligatorios', 'error')
    return
  }

  saving.value = true
  try {
    const data = {
      vin: form.vin.trim(),
      placa: form.placa.trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio: form.anio,
      color: form.color.trim(),
      km: form.km,
      cliente: form.cliente.trim(),
      condicion: form.condicion as 'excelente' | 'bueno' | 'regular' | 'dañado',
      zonasDañadas: [...zonasDañadas.value],
      daños: buildDaños(),
      observaciones: form.observaciones.trim(),
      fotos: { ...fotosCapturadas.value },
      fotosAdicionales: [...fotosAdicionales.value],
      estado: listo.value ? ('completada' as const) : ('borrador' as const),
      creadoPor: 'Usuario Recibidor',
    }

    if (isEditing.value) {
      const _updated = await store.actualizar(editingId.value!, data)
      // Siempre actualizar el estado del vehículo al enviar formulario
      try {
        await vehiculoStore.completarImpronta(form.vin.trim())
      } catch (pipeErr) {
        console.warn('Error al actualizar estado vehículo:', pipeErr)
      }
      showToast('Impronta actualizada correctamente')
    } else {
      // 1️⃣ Crear la impronta
      const nueva = await store.crear(data)

      // 2️⃣ Registrar el vehículo en el pipeline
      try {
        await vehiculoStore.registrarRecepcion({
          vin: form.vin.trim(),
          placa: form.placa.trim(),
          marca: form.marca.trim(),
          modelo: form.modelo.trim(),
          anio: form.anio,
          color: form.color.trim(),
          cliente: form.cliente.trim(),
          contenedorId: contenedorId.value || undefined,
          contenedorCodigo: contenedorCodigo.value || undefined,
        })

        // 3️⃣ Vincular impronta + siempre marcar completada al enviar formulario
        await vehiculoStore.vincularImpronta(form.vin.trim(), nueva.id, nueva.folio)
        await vehiculoStore.completarImpronta(form.vin.trim())
      } catch (pipeErr) {
        console.warn('Vehículo pipeline ya existía o error:', pipeErr)
      }

      showToast(`Impronta ${nueva.folio} creada correctamente`)
      setTimeout(() => {
        router.push(`/recibidor`)
      }, 1500)
    }
  } catch (err: unknown) {
    showToast((err as Error).message || 'Error al guardar', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/recibidor"
          class="p-2 text-zinc-500 hover:text-zinc-400 hover:bg-white/[0.06] rounded-md transition"
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
            REC — Módulo Recepción
          </p>
          <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
            {{ isEditing ? 'Editar Impronta' : 'Registro de Impronta' }}
          </h1>
          <p class="text-zinc-500 mt-1">
            {{
              isEditing ? `Editando ${editingFolio}` : 'Documenta el estado del vehículo al ingreso'
            }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <!-- Botón Escanear QR -->
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-amber-400/30 bg-amber-400/[0.06] text-amber-300 text-sm font-semibold rounded-md hover:bg-amber-400/[0.10] transition"
          @click="showModalQr = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          Escanear QR
        </button>

        <NuxtLink
          v-if="isEditing"
          :to="`/recibidor/impronta-print?id=${editingId}`"
          target="_blank"
          class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] bg-[#10141c] text-zinc-200 text-sm font-semibold rounded-md hover:bg-white/[0.04] transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Vista Imprimible
        </NuxtLink>
        <button
          :disabled="saving"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black text-sm font-semibold rounded-md hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="guardarImpronta"
        >
          <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {{ saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar Impronta' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Columna izquierda: Datos del vehículo + Daños -->
      <div class="xl:col-span-2 space-y-6">
        <!-- Datos del Vehículo -->
        <div class="bg-[#0d111a] rounded-md shadow-sm border border-white/[0.06] p-6">
          <h2
            class="font-display text-sm uppercase tracking-wide text-zinc-100 mb-4 flex items-center gap-2"
          >
            <div class="w-7 h-7 bg-amber-400/[0.10] rounded-lg flex items-center justify-center">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            Datos del Vehículo
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                VIN / Chasis
                <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.vin"
                type="text"
                placeholder="1HGBH41JXMN109186"
                class="w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
                :class="errors.vin ? 'border-red-400' : 'border-white/[0.08]'"
              />
              <p v-if="errors.vin" class="text-xs text-red-500 mt-1">{{ errors.vin }}</p>
            </div>
            <div>
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Placa
              </label>
              <input
                v-model="form.placa"
                type="text"
                placeholder="ABC-1234"
                class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
              />
            </div>
            <div class="relative">
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Marca
                <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.marca"
                  type="text"
                  placeholder="Seleccionar o escribir marca"
                  class="w-full px-3 py-2.5 pr-9 border rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
                  :class="errors.marca ? 'border-red-400' : 'border-white/[0.08]'"
                  @focus="showMarcaDropdown = true"
                  @input="
                    () => {
                      showMarcaDropdown = true
                      marcaSearch = form.marca
                    }
                  "
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                  @click="showMarcaDropdown = !showMarcaDropdown"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
              <div
                v-if="showMarcaDropdown"
                class="absolute z-20 mt-1 w-full bg-[#10141c] border border-white/[0.08] rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                <button
                  v-for="m in marcasFiltradas"
                  :key="m"
                  type="button"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-amber-400/[0.06] hover:text-amber-300 transition flex items-center gap-2"
                  :class="
                    form.marca === m
                      ? 'bg-amber-400/[0.06] text-amber-300 font-semibold'
                      : 'text-zinc-200'
                  "
                  @click="seleccionarMarca(m)"
                >
                  <svg
                    v-if="form.marca === m"
                    class="w-4 h-4 text-amber-300 shrink-0"
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
                  <span>{{ m }}</span>
                </button>
                <div v-if="marcasFiltradas.length === 0" class="px-3 py-2 text-xs text-zinc-500">
                  Escribe para buscar o usa una marca personalizada
                </div>
              </div>
              <p v-if="errors.marca" class="text-xs text-red-500 mt-1">{{ errors.marca }}</p>
            </div>
            <div class="relative">
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Modelo
                <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.modelo"
                  type="text"
                  placeholder="Seleccionar o escribir modelo"
                  class="w-full px-3 py-2.5 pr-9 border rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
                  :class="errors.modelo ? 'border-red-400' : 'border-white/[0.08]'"
                  @focus="modelosFiltrados.length > 0 && (showModeloDropdown = true)"
                />
                <button
                  v-if="modelosFiltrados.length > 0"
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                  @click="showModeloDropdown = !showModeloDropdown"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
              <div
                v-if="showModeloDropdown && modelosFiltrados.length > 0"
                class="absolute z-20 mt-1 w-full bg-[#10141c] border border-white/[0.08] rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                <button
                  v-for="mod in modelosFiltrados"
                  :key="mod"
                  type="button"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-amber-400/[0.06] hover:text-amber-300 transition flex items-center gap-2"
                  :class="
                    form.modelo === mod
                      ? 'bg-amber-400/[0.06] text-amber-300 font-semibold'
                      : 'text-zinc-200'
                  "
                  @click="seleccionarModelo(mod)"
                >
                  <svg
                    v-if="form.modelo === mod"
                    class="w-4 h-4 text-amber-300 shrink-0"
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
                  <span>{{ mod }}</span>
                </button>
              </div>
              <p v-if="errors.modelo" class="text-xs text-red-500 mt-1">{{ errors.modelo }}</p>
            </div>
            <div>
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Año
              </label>
              <input
                v-model="form.anio"
                type="number"
                placeholder="2024"
                class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
              />
            </div>
            <div>
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Color
              </label>
              <input
                v-model="form.color"
                type="text"
                placeholder="Blanco Perla"
                class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
              />
            </div>
            <div>
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Kilometraje
              </label>
              <input
                v-model="form.km"
                type="number"
                placeholder="0"
                class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
              />
            </div>
            <div>
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Cliente
              </label>
              <input
                v-model="form.cliente"
                type="text"
                placeholder="Distribuidora XXX"
                class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
              />
            </div>
            <div>
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Condición General
                <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.condicion"
                class="w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition bg-[#10141c]"
                :class="errors.condicion ? 'border-red-400' : 'border-white/[0.08]'"
              >
                <option value="">Seleccionar</option>
                <option value="excelente">Excelente</option>
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
                <option value="dañado">Con daños</option>
              </select>
              <p v-if="errors.condicion" class="text-xs text-red-500 mt-1">
                {{ errors.condicion }}
              </p>
            </div>

            <!-- Contenedor asignado -->
            <div class="sm:col-span-2 lg:col-span-3">
              <label
                class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
              >
                Contenedor
              </label>
              <div class="flex gap-2">
                <div class="flex-1 relative">
                  <select
                    :value="contenedorId || ''"
                    class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition"
                    @change="
                      (e: Event) => {
                        const val = (e.target as HTMLSelectElement).value
                        if (val) {
                          const cont = contStore.getById(val)
                          if (cont) {
                            contenedorId = cont.id
                            contenedorCodigo = cont.codigo
                            contenedorNombre = `${cont.codigo} — ${cont.origen}`
                          }
                        } else {
                          limpiarContenedor()
                        }
                      }
                    "
                  >
                    <option value="">— Seleccionar contenedor —</option>
                    <option v-for="cont in contStore.contenedores" :key="cont.id" :value="cont.id">
                      {{ cont.codigo }} — {{ cont.origen }}
                    </option>
                  </select>
                  <!-- Badge contenedor seleccionado -->
                  <div
                    v-if="contenedorNombre && contenedorId"
                    class="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <span
                      class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Asignado
                    </span>
                  </div>
                  <!-- Botón limpiar -->
                  <button
                    v-if="contenedorId"
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 p-1"
                    @click="limpiarContenedor"
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
                <!-- Botón QR -->
                <button
                  type="button"
                  class="px-3 py-2.5 border border-amber-400/30 bg-amber-400/[0.06] text-amber-300 rounded-md hover:bg-amber-400/[0.10] transition shrink-0"
                  title="Escanear QR del contenedor"
                  @click="showModalQrContenedor = true"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </button>
              </div>
              <p v-if="contenedorNombre && contenedorId" class="text-xs text-emerald-600 mt-1">
                {{ contenedorNombre }}
              </p>
            </div>
          </div>
        </div>

        <!-- Mapa de daños -->
        <div class="bg-[#0d111a] rounded-md shadow-sm border border-white/[0.06] p-6">
          <h2
            class="font-display text-sm uppercase tracking-wide text-zinc-100 mb-4 flex items-center gap-2"
          >
            <div class="w-7 h-7 bg-red-500/15 rounded-lg flex items-center justify-center">
              <svg
                class="w-4 h-4 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            Mapa de Daños
            <span class="text-xs text-zinc-500 font-normal ml-1">
              — Haz clic en las zonas dañadas
            </span>
          </h2>

          <!-- Diagrama del auto -->
          <div class="flex flex-col lg:flex-row gap-6 items-start">
            <div class="flex-1">
              <div
                class="relative bg-[#0d111a] rounded-lg p-6 flex items-center justify-center min-h-[280px]"
              >
                <svg
                  viewBox="0 0 320 500"
                  class="w-full max-w-[220px]"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="60"
                    y="140"
                    width="200"
                    height="220"
                    rx="20"
                    fill="#1c2433"
                    stroke="#64748b"
                    stroke-width="2"
                  />
                  <rect
                    x="90"
                    y="155"
                    width="140"
                    height="120"
                    rx="10"
                    fill="#141b29"
                    stroke="#64748b"
                    stroke-width="1.5"
                  />
                  <rect
                    x="80"
                    y="60"
                    width="160"
                    height="85"
                    rx="15"
                    fill="#1c2433"
                    stroke="#64748b"
                    stroke-width="2"
                  />
                  <rect
                    x="80"
                    y="355"
                    width="160"
                    height="85"
                    rx="15"
                    fill="#1c2433"
                    stroke="#64748b"
                    stroke-width="2"
                  />
                  <circle
                    cx="80"
                    cy="170"
                    r="28"
                    fill="#0f1623"
                    stroke="#475569"
                    stroke-width="2"
                  />
                  <circle cx="80" cy="170" r="14" fill="#64748b" />
                  <circle
                    cx="240"
                    cy="170"
                    r="28"
                    fill="#0f1623"
                    stroke="#475569"
                    stroke-width="2"
                  />
                  <circle cx="240" cy="170" r="14" fill="#64748b" />
                  <circle
                    cx="80"
                    cy="330"
                    r="28"
                    fill="#0f1623"
                    stroke="#475569"
                    stroke-width="2"
                  />
                  <circle cx="80" cy="330" r="14" fill="#64748b" />
                  <circle
                    cx="240"
                    cy="330"
                    r="28"
                    fill="#0f1623"
                    stroke="#475569"
                    stroke-width="2"
                  />
                  <circle cx="240" cy="330" r="14" fill="#64748b" />

                  <rect
                    x="95"
                    y="65"
                    width="130"
                    height="70"
                    rx="10"
                    :fill="zonasDañadas.includes('frontal') ? '#fca5a5' : 'transparent'"
                    :stroke="zonasDañadas.includes('frontal') ? '#ef4444' : 'transparent'"
                    stroke-width="2"
                    class="cursor-pointer hover:fill-red-100 transition-colors"
                    opacity="0.7"
                    @click="toggleZona('frontal')"
                  />
                  <rect
                    x="95"
                    y="360"
                    width="130"
                    height="70"
                    rx="10"
                    :fill="zonasDañadas.includes('trasero') ? '#fca5a5' : 'transparent'"
                    :stroke="zonasDañadas.includes('trasero') ? '#ef4444' : 'transparent'"
                    stroke-width="2"
                    class="cursor-pointer hover:fill-red-100 transition-colors"
                    opacity="0.7"
                    @click="toggleZona('trasero')"
                  />
                  <rect
                    x="60"
                    y="150"
                    width="30"
                    height="200"
                    rx="8"
                    :fill="zonasDañadas.includes('lateral_izq') ? '#fca5a5' : 'transparent'"
                    :stroke="zonasDañadas.includes('lateral_izq') ? '#ef4444' : 'transparent'"
                    stroke-width="2"
                    class="cursor-pointer hover:fill-red-100 transition-colors"
                    opacity="0.7"
                    @click="toggleZona('lateral_izq')"
                  />
                  <rect
                    x="230"
                    y="150"
                    width="30"
                    height="200"
                    rx="8"
                    :fill="zonasDañadas.includes('lateral_der') ? '#fca5a5' : 'transparent'"
                    :stroke="zonasDañadas.includes('lateral_der') ? '#ef4444' : 'transparent'"
                    stroke-width="2"
                    class="cursor-pointer hover:fill-red-100 transition-colors"
                    opacity="0.7"
                    @click="toggleZona('lateral_der')"
                  />
                  <rect
                    x="95"
                    y="155"
                    width="130"
                    height="115"
                    rx="8"
                    :fill="zonasDañadas.includes('techo') ? '#fca5a5' : 'transparent'"
                    :stroke="zonasDañadas.includes('techo') ? '#ef4444' : 'transparent'"
                    stroke-width="2"
                    class="cursor-pointer hover:fill-red-100 transition-colors"
                    opacity="0.7"
                    @click="toggleZona('techo')"
                  />

                  <text
                    x="160"
                    y="108"
                    text-anchor="middle"
                    fill="#64748b"
                    font-size="11"
                    font-weight="600"
                  >
                    FRONTAL
                  </text>
                  <text
                    x="160"
                    y="400"
                    text-anchor="middle"
                    fill="#64748b"
                    font-size="11"
                    font-weight="600"
                  >
                    TRASERO
                  </text>
                  <text
                    x="160"
                    y="218"
                    text-anchor="middle"
                    fill="#64748b"
                    font-size="11"
                    font-weight="600"
                  >
                    TECHO
                  </text>
                  <text
                    x="42"
                    y="252"
                    text-anchor="middle"
                    fill="#64748b"
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
                    fill="#64748b"
                    font-size="10"
                    font-weight="600"
                    transform="rotate(90 278 252)"
                  >
                    LAT. DER
                  </text>

                  <g v-for="zona in zonasDañadas" :key="zona">
                    <circle v-if="zona === 'frontal'" cx="160" cy="95" r="10" fill="#ef4444" />
                    <text
                      v-if="zona === 'frontal'"
                      x="160"
                      y="100"
                      text-anchor="middle"
                      fill="white"
                      font-size="12"
                      font-weight="bold"
                    >
                      !
                    </text>
                    <circle v-if="zona === 'trasero'" cx="160" cy="390" r="10" fill="#ef4444" />
                    <text
                      v-if="zona === 'trasero'"
                      x="160"
                      y="395"
                      text-anchor="middle"
                      fill="white"
                      font-size="12"
                      font-weight="bold"
                    >
                      !
                    </text>
                    <circle v-if="zona === 'lateral_izq'" cx="70" cy="250" r="10" fill="#ef4444" />
                    <text
                      v-if="zona === 'lateral_izq'"
                      x="70"
                      y="255"
                      text-anchor="middle"
                      fill="white"
                      font-size="12"
                      font-weight="bold"
                    >
                      !
                    </text>
                    <circle v-if="zona === 'lateral_der'" cx="250" cy="250" r="10" fill="#ef4444" />
                    <text
                      v-if="zona === 'lateral_der'"
                      x="250"
                      y="255"
                      text-anchor="middle"
                      fill="white"
                      font-size="12"
                      font-weight="bold"
                    >
                      !
                    </text>
                    <circle v-if="zona === 'techo'" cx="160" cy="212" r="10" fill="#ef4444" />
                    <text
                      v-if="zona === 'techo'"
                      x="160"
                      y="217"
                      text-anchor="middle"
                      fill="white"
                      font-size="12"
                      font-weight="bold"
                    >
                      !
                    </text>
                  </g>
                </svg>
              </div>
              <p class="text-xs text-zinc-500 text-center mt-2">
                Haz clic en la zona para marcar/desmarcar daño
              </p>
            </div>

            <!-- Lista de daños -->
            <div class="flex-1 space-y-3">
              <p class="font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Zonas marcadas
              </p>
              <div
                v-if="zonasDañadas.length === 0"
                class="text-sm text-zinc-500 py-4 text-center bg-[#0d111a] rounded-md"
              >
                Sin daños marcados
              </div>
              <div
                v-for="zona in zonasDañadas"
                :key="zona"
                class="p-3 bg-red-500/10 border border-red-500/20 rounded-md space-y-2"
              >
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                  <span class="text-sm font-medium text-red-300 capitalize flex-1">
                    {{ zonaNombre(zona) }}
                  </span>
                  <button
                    class="text-red-400 hover:text-red-400 transition"
                    @click="toggleZona(zona)"
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
                <div class="flex gap-2">
                  <select
                    v-model="dañoDetalles[zona].tipo"
                    class="flex-1 text-xs px-2 py-1.5 border border-white/[0.08] rounded-lg bg-[#10141c]"
                  >
                    <option value="">Tipo de daño</option>
                    <option value="Rayón superficial">Rayón superficial</option>
                    <option value="Abolladura">Abolladura</option>
                    <option value="Pintura dañada">Pintura dañada</option>
                    <option value="Vidrio roto">Vidrio roto</option>
                    <option value="Pieza faltante">Pieza faltante</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <select
                    v-model="dañoDetalles[zona].severidad"
                    class="text-xs px-2 py-1.5 border border-white/[0.08] rounded-lg bg-[#10141c]"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div class="mt-4">
                <label
                  class="block font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] mb-1.5"
                >
                  Observaciones generales
                </label>
                <textarea
                  v-model="form.observaciones"
                  rows="4"
                  placeholder="Describa los daños encontrados, rayones, abolladuras, faltantes, etc."
                  class="w-full px-3 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70 transition resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna derecha: Fotos -->
      <div class="space-y-6">
        <!-- Captura de Fotos -->
        <div class="bg-[#0d111a] rounded-md shadow-sm border border-white/[0.06] p-6">
          <h2
            class="font-display text-sm uppercase tracking-wide text-zinc-100 mb-4 flex items-center gap-2"
          >
            <div class="w-7 h-7 bg-teal-500/15 rounded-lg flex items-center justify-center">
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
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            Fotografías
          </h2>

          <!-- Fotos requeridas -->
          <div class="space-y-3">
            <p class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              Vistas obligatorias
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="vista in vistasRequeridas"
                :key="vista.key"
                class="relative group border-2 border-dashed rounded-md overflow-hidden cursor-pointer transition-all"
                :class="
                  fotosCapturadas[vista.key]
                    ? 'border-emerald-400'
                    : 'border-white/[0.08] hover:border-amber-400/40'
                "
                @click="capturarFoto(vista.key)"
              >
                <div v-if="fotosCapturadas[vista.key]" class="relative">
                  <img
                    :src="fotosCapturadas[vista.key]"
                    :alt="vista.label"
                    class="w-full h-28 object-cover"
                  />
                  <div
                    class="absolute top-1.5 right-1.5 w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center"
                  >
                    <svg
                      class="w-3.5 h-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <button
                    class="absolute top-1.5 left-1.5 w-6 h-6 bg-red-500 rounded-md items-center justify-center hidden group-hover:flex"
                    @click.stop="eliminarFoto(vista.key)"
                  >
                    <svg
                      class="w-3.5 h-3.5 text-white"
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
                <div v-else class="flex flex-col items-center justify-center h-28 gap-2 px-2">
                  <svg
                    class="w-8 h-8 text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                  </svg>
                  <span class="text-xs text-zinc-500 text-center font-medium">
                    {{ vista.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Input de archivo oculto -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="onFileChange"
          />

          <!-- Fotos adicionales -->
          <div class="mt-4 space-y-3">
            <p class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              Fotos adicionales (daños)
            </p>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="(foto, idx) in fotosAdicionales"
                :key="idx"
                class="relative group rounded-md overflow-hidden border border-white/[0.08]"
              >
                <img :src="foto" class="w-full h-20 object-cover" />
                <button
                  class="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-md items-center justify-center hidden group-hover:flex"
                  @click="fotosAdicionales.splice(idx, 1)"
                >
                  <svg
                    class="w-3 h-3 text-white"
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
              <button
                class="flex flex-col items-center justify-center h-20 border-2 border-dashed border-white/[0.08] hover:border-amber-400/40 rounded-md transition cursor-pointer gap-1"
                @click="agregarFotoAdicional"
              >
                <svg
                  class="w-5 h-5 text-zinc-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span class="text-xs text-zinc-500">Agregar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Progreso -->
        <div class="bg-[#0d111a] rounded-md shadow-sm border border-white/[0.06] p-6">
          <h3 class="font-display text-xs uppercase tracking-wide text-zinc-100 mb-4">
            Progreso del Registro
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-400">Datos del vehículo</span>
              <span
                :class="progresoDatos >= 100 ? 'text-emerald-400' : 'text-zinc-500'"
                class="text-sm font-semibold"
              >
                {{ progresoDatos }}%
              </span>
            </div>
            <div class="w-full bg-white/[0.04] rounded-sm h-1.5">
              <div
                class="h-1.5 rounded-sm bg-amber-400 transition-all duration-500"
                :style="`width: ${progresoDatos}%`"
              />
            </div>

            <div class="flex items-center justify-between mt-2">
              <span class="text-sm text-zinc-400">Fotos obligatorias</span>
              <span
                :class="progresoFotos >= 100 ? 'text-emerald-400' : 'text-zinc-500'"
                class="text-sm font-semibold"
              >
                {{ Object.keys(fotosCapturadas).length }}/{{ vistasRequeridas.length }}
              </span>
            </div>
            <div class="w-full bg-white/[0.04] rounded-sm h-1.5">
              <div
                class="h-1.5 rounded-sm bg-sky-500 transition-all duration-500"
                :style="`width: ${progresoFotos}%`"
              />
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-white/[0.06]">
            <div
              class="flex items-center gap-2 text-sm"
              :class="listo ? 'text-emerald-400' : 'text-zinc-500'"
            >
              <svg
                v-if="listo"
                class="w-5 h-5"
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
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {{ listo ? 'Listo para guardar' : 'Completa todos los campos' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Escanear QR del Vehículo -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showModalQr"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showModalQr = false"
      >
        <div
          class="bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 w-full max-w-lg overflow-hidden"
        >
          <!-- Header del modal -->
          <div class="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-amber-400/[0.10] rounded-md flex items-center justify-center shrink-0"
              >
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
                <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
                  Escanear QR del Vehículo
                </h3>
                <p class="text-xs text-zinc-500 mt-0.5">
                  Apunta la cámara al código QR del vehículo para cargar sus datos
                </p>
              </div>
            </div>
            <button
              class="p-2 text-zinc-500 hover:text-zinc-400 hover:bg-white/[0.06] rounded-md transition"
              @click="showModalQr = false"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Scanner -->
          <div class="px-6 py-5">
            <QrScanner
              ref="scannerImpronta"
              placeholder="Código QR del vehículo (IMP-XXXX / JSON)"
              :hide-result="false"
              :continuous-scan="false"
              @scan="onScanImpronta"
            />
          </div>

          <!-- Hint -->
          <div class="px-6 pb-5">
            <div class="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 flex gap-3">
              <svg
                class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="text-xs text-amber-700">
                Escanea el QR físico del vehículo. Los datos de marca, modelo, VIN y color se
                cargarán automáticamente en el formulario.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal: Escanear QR del Contenedor -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showModalQrContenedor"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showModalQrContenedor = false"
      >
        <div
          class="bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 w-full max-w-lg overflow-hidden"
        >
          <!-- Header -->
          <div class="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-sky-500/15 rounded-md flex items-center justify-center shrink-0"
              >
                <svg
                  class="w-5 h-5 text-sky-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
                  Escanear QR del Contenedor
                </h3>
                <p class="text-xs text-zinc-500 mt-0.5">
                  Escanea el código del contenedor para asignarlo a esta impronta
                </p>
              </div>
            </div>
            <button
              class="p-2 text-zinc-500 hover:text-zinc-400 hover:bg-white/[0.06] rounded-md transition"
              @click="showModalQrContenedor = false"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Scanner -->
          <div class="px-6 py-5">
            <QrScanner
              ref="scannerContenedor"
              placeholder="Código del contenedor"
              :hide-result="false"
              :continuous-scan="false"
              @scan="onScanContenedorImpronta"
            />
          </div>

          <!-- Hint -->
          <div class="px-6 pb-5">
            <div class="bg-sky-500/10 border border-sky-500/30 rounded-md px-4 py-3 flex gap-3">
              <svg
                class="w-4 h-4 text-sky-400 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="text-xs text-sky-300">
                Escanea el código QR del contenedor para vincularlo a este vehículo. Si el
                contenedor ya fue registrado, se asignará automáticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="toastMsg"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 text-white font-semibold"
        :class="toastType === 'error' ? 'bg-red-600' : 'bg-emerald-600'"
      >
        <svg
          v-if="toastType === 'error'"
          class="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <svg v-else class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
