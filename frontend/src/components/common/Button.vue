<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false,
  size: 'md',
})

const variantClasses = computed(() => {
  const variants = {
    primary:
      'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_16px_rgba(251,191,36,0.2)] hover:shadow-[0_0_24px_rgba(251,191,36,0.35)]',
    secondary:
      'bg-white/[0.06] hover:bg-white/[0.10] text-zinc-200 border border-white/[0.12] hover:border-white/20',
    success:
      'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50',
    danger:
      'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-400/50',
    ghost: 'bg-transparent hover:bg-white/[0.05] text-zinc-400 hover:text-zinc-100',
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-sm',
  }
  return sizes[props.size]
})
</script>

<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-200',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]',
      'active:scale-[0.97] motion-reduce:transform-none',
      'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
      variantClasses,
      sizeClasses,
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
