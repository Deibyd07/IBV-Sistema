<script setup lang="ts">
import { computed } from 'vue'

interface DataPoint {
  label: string
  values: number[]
}

const props = defineProps<{
  data: DataPoint[]
  series: { label: string; color: string }[]
  height?: number
}>()

const VW = 600
const VH = computed(() => props.height ?? 200)
const P = { t: 12, r: 12, b: 28, l: 12 }

const plotW = computed(() => VW - P.l - P.r)
const plotH = computed(() => VH.value - P.t - P.b)
const maxVal = computed(() => Math.max(...props.data.flatMap((d) => d.values), 1) * 1.12)

function pts(si: number) {
  const n = props.data.length
  if (!n) return []
  const dx = plotW.value / Math.max(n - 1, 1)
  return props.data.map((d, i) => ({
    x: P.l + i * dx,
    y: P.t + plotH.value - (d.values[si] / maxVal.value) * plotH.value,
    v: d.values[si],
    l: d.label,
  }))
}

const polyline = (si: number) =>
  pts(si)
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

const area = (si: number) => {
  const pp = pts(si)
  if (!pp.length) return ''
  const base = P.t + plotH.value
  return (
    pp.map((p) => `${p.x},${p.y}`).join(' ') + ` ${pp[pp.length - 1].x},${base} ${pp[0].x},${base}`
  )
}

const gridLines = computed(() => {
  const n = 4
  return Array.from({ length: n }, (_, i) => P.t + (plotH.value / (n + 1)) * (i + 1))
})

const xLabels = computed(() => {
  const n = props.data.length
  if (!n) return []
  const dx = plotW.value / Math.max(n - 1, 1)
  const skip = n > 10 ? Math.ceil(n / 7) : 1
  return props.data
    .map((d, i) => ({ l: d.label, x: P.l + i * dx }))
    .filter((_, i) => i % skip === 0 || i === n - 1)
})
</script>

<template>
  <div class="w-full">
    <svg :viewBox="`0 0 ${VW} ${VH}`" class="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient
          v-for="(s, i) in series"
          :id="`ag${i}`"
          :key="`g${i}`"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" :stop-color="s.color" stop-opacity="0.3" />
          <stop offset="100%" :stop-color="s.color" stop-opacity="0.03" />
        </linearGradient>
      </defs>

      <!-- Grid -->
      <line
        v-for="(y, i) in gridLines"
        :key="`gl${i}`"
        :x1="P.l"
        :x2="VW - P.r"
        :y1="y"
        :y2="y"
        stroke="#f1f5f9"
        stroke-width="1"
      />

      <!-- Areas -->
      <polygon v-for="(s, i) in series" :key="`a${i}`" :points="area(i)" :fill="`url(#ag${i})`" />

      <!-- Lines -->
      <polyline
        v-for="(s, i) in series"
        :key="`l${i}`"
        :points="polyline(i)"
        :stroke="s.color"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Dots -->
      <template v-for="(s, si) in series" :key="`ds${si}`">
        <circle
          v-for="(p, pi) in pts(si)"
          :key="`d${si}${pi}`"
          :cx="p.x"
          :cy="p.y"
          r="3"
          :fill="s.color"
          stroke="white"
          stroke-width="1.5"
        >
          <title>{{ p.l }}: {{ p.v }}</title>
        </circle>
      </template>

      <!-- X labels -->
      <text
        v-for="xl in xLabels"
        :key="xl.l"
        :x="xl.x"
        :y="VH - 4"
        text-anchor="middle"
        font-size="10"
        fill="#94a3b8"
      >
        {{ xl.l }}
      </text>
    </svg>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-5 mt-2">
      <div v-for="s in series" :key="s.label" class="flex items-center gap-1.5">
        <span class="w-3 h-0.5 rounded-full" :style="{ backgroundColor: s.color }" />
        <span class="text-xs text-zinc-500">{{ s.label }}</span>
      </div>
    </div>
  </div>
</template>
