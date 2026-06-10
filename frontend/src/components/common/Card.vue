<script setup lang="ts">
interface Props {
  title?: string
  code?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  code: '',
})
</script>

<template>
  <div class="ibv-card rounded-lg border border-white/[0.08] bg-[#10141c] overflow-hidden">
    <!-- Card Header -->
    <div v-if="title" class="flex items-center gap-3 border-b border-white/[0.08] px-5 py-3.5">
      <span
        v-if="code"
        class="font-data text-[10px] uppercase tracking-[0.2em] text-amber-300 border border-amber-400/30 bg-amber-400/[0.06] px-2 py-0.5 rounded-sm shrink-0"
      >
        {{ code }}
      </span>
      <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">{{ title }}</h3>
    </div>

    <!-- Card Body -->
    <div class="px-5 py-4">
      <slot />
    </div>

    <!-- Card Footer -->
    <div v-if="$slots.footer" class="border-t border-white/[0.08] px-5 py-3 bg-white/[0.02]">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.font-display {
  font-family: 'Archivo Black', 'Archivo', system-ui, sans-serif;
  font-weight: 400;
}

.font-data {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}
</style>
