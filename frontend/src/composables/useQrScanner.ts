/**
 * Composable para gestionar la cámara QR usando html5-qrcode.
 *
 * Encapsula la lógica de inicio/parada de cámara, cambio de cámara
 * (frontal/trasera), detección de dispositivo, y decodificación de códigos QR.
 *
 * Detecta automáticamente:
 * - Si es dispositivo móvil
 * - Cámaras disponibles
 * - Permisos de cámara
 *
 * @example
 * const { cameraState, isMobile, availableCameras, start, switchCamera } = useQrScanner('reader-id', {
 *   onDecode: (text) => console.log('Decoded:', text),
 * })
 */
import { ref, onUnmounted, computed } from 'vue'

// ─── Types ─────────────────────────────────────────────
export type CameraFacing = 'environment' | 'user'
export type CameraState = 'idle' | 'starting' | 'active' | 'error'

export interface CameraDevice {
  deviceId: string
  label: string
  kind: 'videoinput' | 'audioinput' | 'audiooutput'
}

export interface QrScannerOptions {
  /** Callback cuando se decodifica un código QR exitosamente */
  onDecode: (decodedText: string) => void
  /** Callback cuando ocurre un error de cámara */
  onCameraError?: (error: string) => void
  /** Frames por segundo para el escaneo (default: 10) */
  fps?: number
}

// ─── Composable ────────────────────────────────────────
export function useQrScanner(elementId: string, options: QrScannerOptions) {
  const cameraState = ref<CameraState>('idle')
  const facingMode = ref<CameraFacing>('environment')
  const cameraError = ref('')
  const availableCameras = ref<CameraDevice[]>([])
  const selectedCameraId = ref<string | null>(null)

  // Detectar si es dispositivo móvil
  const isMobile = computed(() => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  })

  // Detectar si tiene múltiples cámaras (típico de móviles)
  const hasMultipleCameras = computed(() => availableCameras.value.length > 1)

  // ¿Debería mostrar botón de cambio de cámara?
  const showCameraSwitchButton = computed(() => {
    // En móvil: mostrar si tiene múltiples cámaras
    if (isMobile.value) return hasMultipleCameras.value
    // En PC: mostrar si tiene múltiples cámaras USB
    return hasMultipleCameras.value
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let scannerInstance: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Html5QrcodeClass: any = null
  let isProcessing = false

  /**
   * Carga dinámica de html5-qrcode (solo en cliente, compatible con SSR de Nuxt)
   */
  const loadLibrary = async (): Promise<boolean> => {
    if (Html5QrcodeClass) return true
    try {
      const mod = await import('html5-qrcode')
      Html5QrcodeClass = mod.Html5Qrcode
      return true
    } catch {
      return false
    }
  }

  /**
   * Obtiene lista de cámaras disponibles en el dispositivo
   */
  const getCamerasAvailable = async (): Promise<CameraDevice[]> => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return []
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === 'videoinput')
      availableCameras.value = videoDevices
      return videoDevices
    } catch {
      return []
    }
  }

  /**
   * Inicia la cámara y comienza a escanear códigos QR.
   * @returns true si la cámara se inició correctamente
   */
  const start = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    if (isProcessing) return false
    isProcessing = true

    cameraState.value = 'starting'
    cameraError.value = ''

    try {
      const loaded = await loadLibrary()
      if (!loaded) throw new Error('No se pudo cargar la librería de escaneo QR')

      // Detectar cámaras disponibles
      await getCamerasAvailable()

      // Limpiar instancia previa si existe
      if (scannerInstance) {
        try {
          await scannerInstance.stop()
        } catch {
          /* ya detenido */
        }
        try {
          scannerInstance.clear()
        } catch {
          /* nada que limpiar */
        }
        scannerInstance = null
      }

      scannerInstance = new Html5QrcodeClass(elementId, /* verbose */ false)

      // Configurar constraints según dispositivo
      const constraints = selectedCameraId.value
        ? { deviceId: { exact: selectedCameraId.value } }
        : { facingMode: facingMode.value }

      await scannerInstance.start(
        constraints,
        { fps: options.fps ?? 10 },
        (text: string) => options.onDecode(text),
        () => {} // Errores continuos normales (sin QR visible en el frame)
      )

      cameraState.value = 'active'
      isProcessing = false
      return true
    } catch (err: unknown) {
      cameraState.value = 'error'
      isProcessing = false

      const e = err as { name?: string; message?: string }
      const msg =
        e?.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Habilita el acceso en la configuración del navegador.'
          : e?.name === 'NotFoundError'
            ? 'No se encontró una cámara disponible en este dispositivo.'
            : e?.name === 'NotReadableError'
              ? 'La cámara está siendo usada por otra aplicación.'
              : e?.message || 'Error desconocido al iniciar la cámara'

      cameraError.value = msg
      options.onCameraError?.(msg)
      return false
    }
  }

  /**
   * Detiene la cámara
   */
  const stop = async () => {
    if (scannerInstance) {
      try {
        await scannerInstance.stop()
      } catch {
        /* ya detenido */
      }
    }
    cameraState.value = 'idle'
  }

  /**
   * Alterna entre iniciar y detener la cámara
   */
  const toggle = async () => {
    if (cameraState.value === 'active' || cameraState.value === 'starting') {
      await stop()
    } else {
      await start()
    }
  }

  /**
   * Cambia entre cámara frontal y trasera (para móviles)
   */
  const switchCamera = async () => {
    facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
    selectedCameraId.value = null // Reset specific device selection
    if (cameraState.value === 'active') {
      await stop()
      await start()
    }
  }

  /**
   * Selecciona una cámara específica por deviceId
   */
  const selectCamera = async (deviceId: string) => {
    selectedCameraId.value = deviceId
    if (cameraState.value === 'active') {
      await stop()
      await start()
    }
  }

  /**
   * Limpieza completa del scanner y cámara
   */
  const destroy = async () => {
    await stop()
    if (scannerInstance) {
      try {
        scannerInstance.clear()
      } catch {
        /* nada que limpiar */
      }
      scannerInstance = null
    }
  }

  // Limpieza automática al desmontar el componente
  onUnmounted(() => {
    destroy()
  })

  return {
    /** Estado actual de la cámara */
    cameraState,
    /** Modo de cámara actual (frontal/trasera) */
    facingMode,
    /** Mensaje de error de cámara */
    cameraError,
    /** ¿Es dispositivo móvil? */
    isMobile,
    /** Cámaras disponibles en el dispositivo */
    availableCameras,
    /** ¿Tiene múltiples cámaras disponibles? */
    hasMultipleCameras,
    /** ¿Mostrar botón de cambio de cámara? */
    showCameraSwitchButton,
    /** ID de cámara seleccionada actualmente */
    selectedCameraId,
    /** Obtiene lista de cámaras disponibles */
    getCamerasAvailable,
    /** Inicia la cámara */
    start,
    /** Detiene la cámara */
    stop,
    /** Alterna inicio/parada de cámara */
    toggle,
    /** Cambia entre cámara frontal y trasera */
    switchCamera,
    /** Selecciona una cámara específica por deviceId */
    selectCamera,
    /** Limpieza completa */
    destroy,
  }
}
