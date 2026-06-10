<script setup lang="ts">
import { computed } from 'vue'

interface Bar {
  label: string
  values: number[]
}

const props = defineProps<{
  bars: Bar[]
  series: { label: string; color: string }[]
  height?: number
  showValues?: boolean
}>()

const chartHeight = computed(() => props.height ?? 140)
const maxVal = computed(() => Math.max(...props.bars.flatMap((b: Bar) => b.values), 1))

const _barWidth = computed(() => {
  const groupCount = props.bars.length
  const seriesCount = props.series.length
  const totalWidth = 100
  const groupWidth = totalWidth / groupCount
  const barW = groupWidth / (seriesCount + 0.6)
  return { groupWidth, barW }
})
</script>

<template>
  <div class="w-full">
    <!-- Chart area -->
    <div class="relative" :style="{ height: `${chartHeight}px` }">
      <div class="flex items-end justify-around h-full gap-1">
        <div v-for="(bar, gi) in bars" :key="gi" class="flex items-end gap-0.5 flex-1">
          <div
            v-for="(val, si) in bar.values"
            :key="si"
            class="flex-1 rounded-t-sm transition-all duration-500 relative group"
            :style="{
              height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`,
              backgroundColor: series[si]?.color ?? '#6366f1',
              minHeight: val > 0 ? '4px' : '0',
            }"
          >
            <!-- Tooltip on hover -->
            <div
              class="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0d111a] text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
            >
              {{ val }}
            </div>
          </div>
        </div>
      </div>

      <!-- Línea base -->
      <div class="absolute bottom-0 left-0 right-0 h-px bg-white/[0.08]" />
    </div>

    <!-- Etiquetas eje X -->
    <div class="flex justify-around mt-2">
      <span v-for="bar in bars" :key="bar.label" class="text-xs text-zinc-500 text-center flex-1">
        {{ bar.label }}
      </span>
    </div>

    <!-- Leyenda series -->
    <div class="flex items-center justify-center gap-4 mt-3">
      <div v-for="s in series" :key="s.label" class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-sm" :style="{ backgroundColor: s.color }" />
        <span class="text-xs text-zinc-500">{{ s.label }}</span>
      </div>
    </div>
  </div>
</template>
