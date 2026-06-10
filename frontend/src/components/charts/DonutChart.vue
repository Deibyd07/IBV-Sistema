<script setup lang="ts">
import { computed } from 'vue'

interface Segment {
  label: string
  value: number
  color: string
}

const props = defineProps<{
  segments: Segment[]
  size?: number
  thickness?: number
  title?: string
}>()

const size = computed(() => props.size ?? 180)
const thickness = computed(() => props.thickness ?? 32)
const radius = computed(() => (size.value - thickness.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const center = computed(() => size.value / 2)

const total = computed(() => props.segments.reduce((s: number, seg: Segment) => s + seg.value, 0))

interface ComputedSegment extends Segment {
  offset: number
  dash: number
  gap: number
}

const computed_segments = computed<ComputedSegment[]>(() => {
  let accumulated = 0
  return props.segments.map((seg: Segment) => {
    const dash = total.value > 0 ? (seg.value / total.value) * circumference.value : 0
    const gap = circumference.value - dash
    const offset = circumference.value - accumulated
    accumulated += dash
    return { ...seg, offset, dash, gap }
  })
})
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :width="size" :height="size" class="-rotate-90">
        <!-- Fondo -->
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          stroke="#f3f4f6"
          :stroke-width="thickness"
        />
        <!-- Segmentos -->
        <circle
          v-for="(seg, i) in computed_segments"
          :key="i"
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          :stroke="seg.color"
          :stroke-width="thickness"
          :stroke-dasharray="`${seg.dash} ${seg.gap}`"
          :stroke-dashoffset="seg.offset"
          stroke-linecap="butt"
        />
      </svg>
      <!-- Centro -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold text-zinc-100">{{ total }}</span>
        <span class="text-xs text-zinc-500">total</span>
      </div>
    </div>

    <!-- Leyenda -->
    <div class="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
      <div v-for="seg in segments" :key="seg.label" class="flex items-center gap-2 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: seg.color }" />
        <span class="text-xs text-zinc-500 truncate">{{ seg.label }}</span>
        <span class="text-xs font-semibold text-zinc-200 ml-auto">{{ seg.value }}</span>
      </div>
    </div>
  </div>
</template>
