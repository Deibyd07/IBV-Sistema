<script setup lang="ts">
interface Props {
  modelValue: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  required: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="space-y-2 group">
    <label
      class="block font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 group-focus-within:text-amber-300 transition-colors"
    >
      {{ label }}
      <span v-if="required" class="text-red-400 ml-0.5">*</span>
    </label>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="w-full px-4 py-2.5 border border-white/[0.10] rounded-md text-sm text-zinc-100 bg-white/[0.03] placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/70 focus:bg-white/[0.05] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.font-data {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}
</style>
