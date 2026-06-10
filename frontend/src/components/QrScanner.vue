<!--
  QrScanner — Componente reutilizable de escaneo QR / Código de barras

  Funcionalidades:
  ✔ Escaneo por cámara real (html5-qrcode)
  ✔ Entrada manual (teclado / pistola de escaneo)
  ✔ Cambio de cámara (frontal ↔ trasera)
  ✔ Estados visuales: escaneando, éxito, error
  ✔ Feedback visual animado (overlays, colores, íconos)
  ✔ 100% backward-compatible con uso anterior

  Uso:
    <QrScanner placeholder="Escanea el código..." @scan="onScan" ref="scanner" />

  Métodos expuestos:
    scanner.value?.setError('Código no reconocido')
    scanner.value?.setSuccess('¡Vehículo encontrado!')
    scanner.value?.reset()
    scanner.value?.startCamera()
    scanner.value?.stopCamera()
    scanner.value?.switchCamera()
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// ─── Types ─────────────────────────────────────────────
type ScannerState = 'idle' | 'scanning' | 'success' | 'error'

// ─── Props ─────────────────────────────────────────────
interface Props {
  /** Texto placeholder del input manual */
  placeholder?: string
  /** Oculta el banner de resultado exitoso */
  hideResult?: boolean
  /** Autofoco en el input al montar */
  autoFocus?: boolean
  /** Continúa escaneando después de un escaneo exitoso */
  continuousScan?: boolean
  /** Duración del estado de éxito en ms */
  successDuration?: number
  /** Duración del estado de error en ms */
  errorDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Escanea o digita el código...',
  hideResult: false,
  autoFocus: true,
  continuousScan: true,
  successDuration: 1500,
  errorDuration: 4000,
})

const emit = defineEmits<{
  scan: [value: string]
}>()

// ─── Refs ──────────────────────────────────────────────
const inputRef = ref<HTMLInputElement | null>(null)
const readerId = `qr-reader-${Math.random().toString(36).substring(2, 9)}`

// ─── State ─────────────────────────────────────────────
const state = ref<ScannerState>('idle')
const manualInput = ref('')
const scannedValue = ref('')
const errorMessage = ref('')
const justScanned = ref(false)

let successTimer: ReturnType<typeof setTimeout> | null = null
let errorTimer: ReturnType<typeof setTimeout> | null = null

// ─── Camera (composable) ───────────────────────────────
const {
  cameraState,
  facingMode,
  cameraError: _cameraError,
  showCameraSwitchButton,
  start: _startCamera,
  stop: _stopCamera,
  toggle: toggleCamera,
  switchCamera: _switchCamera,
  destroy: destroyCamera,
} = useQrScanner(readerId, {
  onDecode: handleQrDecode,
  onCameraError: (msg: string) => setError(msg),
})

const isCameraActive = computed(() => cameraState.value === 'active')
const isCameraStarting = computed(() => cameraState.value === 'starting')
const facingModeLabel = computed(() => (facingMode.value === 'environment' ? 'Trasera' : 'Frontal'))

// ─── State config (visual) ─────────────────────────────
const frameColorClass = computed(() => {
  if (state.value === 'success') return 'border-green-400'
  if (state.value === 'error') return 'border-red-400'
  return 'border-amber-400/60'
})

const stateIndicator = computed(() => {
  switch (state.value) {
    case 'scanning':
      return { label: 'Escaneando', dot: 'bg-amber-400 animate-pulse', text: 'text-white' }
    case 'success':
      return { label: '¡Escaneado!', dot: 'bg-emerald-400', text: 'text-green-300' }
    case 'error':
      return { label: 'Error', dot: 'bg-red-400', text: 'text-red-300' }
    default:
      return { label: 'Inactivo', dot: 'bg-zinc-600', text: 'text-zinc-600' }
  }
})

// ─── Handlers ──────────────────────────────────────────
function handleQrDecode(decodedText: string) {
  // Ignorar decodificaciones durante estados de feedback
  if (state.value === 'success' || state.value === 'error') return
  // Dedup: no re-emitir el mismo código inmediatamente
  if (decodedText === scannedValue.value && state.value === 'scanning') return
  processScannedValue(decodedText)
}

function processScannedValue(val: string) {
  clearTimers()
  scannedValue.value = val
  errorMessage.value = ''
  state.value = 'success'
  justScanned.value = true

  successTimer = setTimeout(() => {
    justScanned.value = false
    if (state.value === 'success') {
      state.value = isCameraActive.value ? 'scanning' : 'idle'
    }
  }, props.successDuration)

  emit('scan', val)
}

function handleManualInput() {
  if (manualInput.value.trim()) {
    processScannedValue(manualInput.value.trim())
    manualInput.value = ''
  }
}

// ─── Public methods ────────────────────────────────────
function focus() {
  nextTick(() => inputRef.value?.focus())
}

function reset() {
  clearTimers()
  manualInput.value = ''
  scannedValue.value = ''
  errorMessage.value = ''
  justScanned.value = false
  state.value = isCameraActive.value ? 'scanning' : 'idle'
  focus()
}

function setError(msg: string) {
  clearTimers()
  errorMessage.value = msg
  scannedValue.value = ''
  state.value = 'error'

  errorTimer = setTimeout(() => {
    errorMessage.value = ''
    state.value = isCameraActive.value ? 'scanning' : 'idle'
  }, props.errorDuration)
}

function setSuccess(msg?: string) {
  clearTimers()
  state.value = 'success'
  if (msg) scannedValue.value = msg
  justScanned.value = true

  successTimer = setTimeout(() => {
    justScanned.value = false
    state.value = isCameraActive.value ? 'scanning' : 'idle'
  }, props.successDuration)
}

function clearTimers() {
  if (successTimer) {
    clearTimeout(successTimer)
    successTimer = null
  }
  if (errorTimer) {
    clearTimeout(errorTimer)
    errorTimer = null
  }
}

// ─── Camera controls ───────────────────────────────────
async function handleToggleCamera() {
  await toggleCamera()
  if (cameraState.value === 'active') {
    state.value = 'scanning'
  } else {
    state.value = 'idle'
  }
}

async function handleSwitchCamera() {
  await _switchCamera()
}

async function startCamera() {
  await _startCamera()
  if (cameraState.value === 'active') state.value = 'scanning'
}

async function stopCamera() {
  await _stopCamera()
  state.value = 'idle'
}

async function switchCamera() {
  await _switchCamera()
}

// ─── Lifecycle ─────────────────────────────────────────
onMounted(() => {
  if (props.autoFocus) focus()
})

onUnmounted(() => {
  clearTimers()
  destroyCamera()
})

// ─── Expose ────────────────────────────────────────────
defineExpose({ focus, reset, setError, setSuccess, startCamera, stopCamera, switchCamera })
</script>

<template>
  <div class="space-y-4">
    <!-- ═══════════════════════════════════════════════════
         VISOR DE CÁMARA
         ═══════════════════════════════════════════════════ -->
    <div class="relative bg-[#0b0e14] rounded-lg overflow-hidden aspect-[4/3]">
      <!-- html5-qrcode reader container (siempre en DOM, invisible cuando cámara apagada) -->
      <div
        :id="readerId"
        class="qr-reader-element absolute inset-0"
        :style="{ visibility: isCameraActive ? 'visible' : 'hidden' }"
      />

      <!-- ── Placeholder (cámara apagada) ── -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="!isCameraActive && !isCameraStarting"
          class="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
        >
          <div class="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center">
            <svg
              class="w-10 h-10 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <div class="text-center px-6">
            <p class="text-zinc-600 text-sm font-medium">Cámara inactiva</p>
            <p class="text-zinc-500 text-xs mt-1">
              Activa la cámara para escanear códigos QR automáticamente
            </p>
          </div>
        </div>
      </Transition>

      <!-- ── Spinner de carga ── -->
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isCameraStarting"
          class="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
        >
          <div
            class="w-10 h-10 border-[3px] border-amber-400/60 border-t-transparent rounded-full animate-spin"
          />
          <p class="text-zinc-400 text-sm font-medium">Iniciando cámara...</p>
        </div>
      </Transition>

      <!-- ── Marco de escaneo (sobre el video) ── -->
      <div
        v-if="isCameraActive"
        class="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
      >
        <div class="w-56 h-56 relative">
          <!-- Esquinas del marco -->
          <div
            class="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300"
            :class="frameColorClass"
          />
          <div
            class="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300"
            :class="frameColorClass"
          />
          <div
            class="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300"
            :class="frameColorClass"
          />
          <div
            class="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300"
            :class="frameColorClass"
          />
          <!-- Línea de escaneo animada (solo en modo escaneando) -->
          <div
            v-if="state === 'scanning'"
            class="absolute left-3 right-3 h-0.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50 animate-scan-line"
          />
        </div>
      </div>

      <!-- ── Overlay de éxito ── -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="state === 'success' && isCameraActive"
          class="absolute inset-0 z-20 bg-emerald-500/15 backdrop-blur-[2px] flex flex-col items-center justify-center"
        >
          <div
            class="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/40 animate-success-pop"
          >
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p class="text-emerald-300 text-sm font-bold mt-3 tracking-wide uppercase">¡Escaneado!</p>
          <p class="text-white font-data text-lg font-black mt-1">{{ scannedValue }}</p>
        </div>
      </Transition>

      <!-- ── Overlay de error ── -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="state === 'error' && isCameraActive"
          class="absolute inset-0 z-20 bg-red-500/15 backdrop-blur-[2px] flex flex-col items-center justify-center"
        >
          <div
            class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/40 animate-error-shake"
          >
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p class="text-red-300 text-sm font-bold mt-3 tracking-wide uppercase">Error</p>
          <p class="text-red-200 text-sm mt-1 px-8 text-center max-w-xs">{{ errorMessage }}</p>
        </div>
      </Transition>

      <!-- ── Controles flotantes sobre la cámara ── -->
      <div
        v-if="isCameraActive"
        class="absolute top-3 left-3 right-3 z-30 flex items-center justify-between"
      >
        <!-- Indicador de estado -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-black/40 backdrop-blur-sm">
          <span class="w-2 h-2 rounded-full" :class="stateIndicator.dot" />
          <span class="text-xs font-semibold" :class="stateIndicator.text">
            {{ stateIndicator.label }}
          </span>
        </div>

        <!-- Botones de control -->
        <div class="flex gap-2">
          <!-- Cambiar cámara (frontal ↔ trasera) - solo si hay múltiples cámaras -->
          <button
            v-if="showCameraSwitchButton"
            class="p-2 bg-black/40 hover:bg-black/60 text-white rounded-md backdrop-blur-sm transition active:scale-90"
            :title="`Cambiar a cámara ${facingMode === 'environment' ? 'frontal' : 'trasera'}`"
            @click="handleSwitchCamera"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <!-- Cerrar cámara -->
          <button
            class="p-2 bg-black/40 hover:bg-black/60 text-white rounded-md backdrop-blur-sm transition active:scale-90"
            title="Cerrar cámara"
            @click="handleToggleCamera"
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
      </div>

      <!-- Etiqueta de cámara activa (pie del visor) -->
      <div v-if="isCameraActive" class="absolute bottom-3 left-1/2 -translate-x-1/2 z-30">
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-sm text-xs text-zinc-300 font-medium"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
          </svg>
          Cámara {{ facingModeLabel }}
        </span>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         CONTROLES (debajo del visor)
         ═══════════════════════════════════════════════════ -->
    <div class="flex flex-wrap gap-3">
      <!-- Botón abrir/cerrar cámara -->
      <button
        class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition"
        :class="
          isCameraActive
            ? 'bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]'
            : 'bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-500/[0.15]'
        "
        :disabled="isCameraStarting"
        @click="handleToggleCamera"
      >
        <!-- Ícono de cámara / cerrar / spinner -->
        <svg v-if="isCameraStarting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
        <svg
          v-else-if="!isCameraActive"
          class="w-5 h-5"
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
          <circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="2" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        {{ isCameraStarting ? 'Iniciando...' : isCameraActive ? 'Cerrar Cámara' : 'Abrir Cámara' }}
      </button>

      <!-- Botón cambiar cámara (solo cuando cámara activa y hay múltiples) -->
      <button
        v-if="isCameraActive && showCameraSwitchButton"
        class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] transition"
        @click="handleSwitchCamera"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Cámara {{ facingModeLabel }}
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════
         ENTRADA MANUAL / PISTOLA DE ESCANEO
         ═══════════════════════════════════════════════════ -->
    <div class="relative">
      <div class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
      </div>
      <input
        ref="inputRef"
        v-model="manualInput"
        type="text"
        :placeholder="placeholder"
        class="w-full pl-10 pr-24 py-3 border-2 border-white/[0.08] rounded-md text-sm font-data focus:outline-none focus:border-amber-400/70 transition"
        :class="{
          'border-green-400 bg-emerald-500/10/30': justScanned && state === 'success',
          'border-red-400 bg-red-500/10/30': state === 'error' && !isCameraActive,
        }"
        @keyup.enter="handleManualInput"
      />
      <button
        :disabled="!manualInput.trim()"
        class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-amber-400 text-black text-sm font-semibold rounded-md hover:bg-amber-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
        @click="handleManualInput"
      >
        Escanear
      </button>
    </div>

    <p class="text-xs text-zinc-500 flex items-center gap-1.5">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Usa la pistola de escaneo, digita el código y presiona Enter, o abre la cámara
    </p>

    <!-- ═══════════════════════════════════════════════════
         BANNERS DE RESULTADO
         ═══════════════════════════════════════════════════ -->

    <!-- Resultado exitoso -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="scannedValue && !hideResult && state !== 'error'"
        class="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-md"
      >
        <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-emerald-300 font-semibold">Código escaneado</p>
          <p class="text-sm font-bold text-emerald-200 font-data truncate">{{ scannedValue }}</p>
        </div>
      </div>
    </Transition>

    <!-- Error (banner inferior, cuando cámara está apagada) -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="errorMessage && !isCameraActive"
        class="flex items-center gap-3 p-3 bg-red-500/10 border border-red-200 rounded-md"
      >
        <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <p class="text-sm font-medium text-red-300">{{ errorMessage }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Línea de escaneo animada ── */
@keyframes scan-line {
  0%,
  100% {
    top: 0.75rem;
  }
  50% {
    top: calc(100% - 0.75rem);
  }
}
.animate-scan-line {
  animation: scan-line 2s ease-in-out infinite;
}

/* ── Pop de éxito ── */
@keyframes success-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-success-pop {
  animation: success-pop 0.4s ease-out;
}

/* ── Shake de error ── */
@keyframes error-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}
.animate-error-shake {
  animation: error-shake 0.4s ease-out;
}

/* ── Estilos para el lector html5-qrcode ── */
.qr-reader-element :deep(video) {
  object-fit: cover !important;
  width: 100% !important;
  height: 100% !important;
  border-radius: 0 !important;
}

/* Ocultar elementos extra que genera la librería */
.qr-reader-element :deep(img) {
  display: none !important;
}
.qr-reader-element :deep(br) {
  display: none !important;
}
.qr-reader-element :deep(span) {
  display: none !important;
}
</style>
