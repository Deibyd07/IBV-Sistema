<script setup lang="ts">
import { ref } from 'vue'
import { forceStatusChange } from '~/services/supabaseAuditService'

interface Props {
  isOpen: boolean
  vehiculoId: number | null
  currentStatus: string
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isLoading = ref(false)
const formData = ref({
  newStatus: '',
  reason: '',
})

const close = () => {
  formData.value = { newStatus: '', reason: '' }
  emit('close')
}

const submit = async () => {
  if (!formData.value.newStatus || !formData.value.reason || !props.vehiculoId) {
    console.warn('Datos incompletos:', {
      newStatus: formData.value.newStatus,
      reason: formData.value.reason,
      vehiculoId: props.vehiculoId,
    })
    return
  }

  console.log('Enviando cambio de estado:', {
    vehiculoId: props.vehiculoId,
    currentStatus: props.currentStatus,
    newStatus: formData.value.newStatus,
    reason: formData.value.reason,
  })

  isLoading.value = true
  try {
    const success = await forceStatusChange({
      vehiculoId: props.vehiculoId,
      newStatus: formData.value.newStatus,
      reason: formData.value.reason,
    })

    if (success) {
      console.log('Estado cambiado exitosamente')
      close()
      emit('success')
    } else {
      console.error('forceStatusChange retornó false')
      alert('Error al cambiar el estado. Revisa la consola para más detalles.')
    }
  } catch (err) {
    console.error('Exception en submit:', err)
    alert(
      'Error al cambiar el estado: ' + (err instanceof Error ? err.message : 'Error desconocido')
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <div
        class="bg-[#10141c] rounded-lg border border-white/[0.10] shadow-2xl shadow-black/60 max-w-md w-full"
      >
        <div class="px-6 py-4 border-b border-white/[0.06]">
          <h2 class="font-display text-base uppercase tracking-tight text-zinc-100">
            Forzar Cambio de Estado
          </h2>
          <p class="text-sm text-zinc-500 mt-1">
            Cambio admin con auditoría - Vehículo ID: {{ vehiculoId }}
          </p>
        </div>

        <div class="px-6 py-4 space-y-4">
          <div>
            <label
              class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
            >
              Estado Actual
            </label>
            <p class="px-4 py-2.5 bg-[#0d111a] rounded-md text-sm font-semibold text-zinc-200">
              {{ currentStatus }}
            </p>
          </div>

          <div>
            <label
              class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
            >
              Nuevo Estado
            </label>
            <select
              v-model="formData.newStatus"
              class="ibv-select"
            >
              <option value="">Selecciona nuevo estado</option>
              <option value="recibido">Recibido</option>
              <option value="impronta_pendiente">Impronta Pendiente</option>
              <option value="impronta_completada">Impronta Completada</option>
              <option value="inventario_pendiente">Inventario Pendiente</option>
              <option value="inventario_aprobado">Inventario Aprobado</option>
              <option value="listo_despacho">Listo Despacho</option>
              <option value="despachado">Despachado</option>
            </select>
          </div>

          <div>
            <label
              class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"
            >
              Razón de Cambio *
            </label>
            <textarea
              v-model="formData.reason"
              rows="3"
              placeholder="Explica por qué se fuerza este cambio..."
              class="ibv-textarea"
            />
          </div>

          <div class="bg-orange-500/10 border border-orange-400/30 rounded-md p-4">
            <div class="flex gap-3">
              <div class="flex-shrink-0">
                <svg
                  class="w-5 h-5 text-orange-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 6v2m0 0v2"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-orange-200">Esta acción será auditada</p>
                <p class="text-xs text-orange-300 mt-1">
                  Se registrará tu usuario, hora, razón y cambio realizado
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end">
          <button
            class="px-4 py-2 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08] disabled:opacity-50"
            @click="close"
            :disabled="isLoading"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 disabled:opacity-50 font-semibold"
            @click="submit"
            :disabled="isLoading || !formData.newStatus || !formData.reason"
          >
            {{ isLoading ? 'Procesando...' : 'Confirmar Cambio' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
