<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
  label: string
  sublabel?: string
  color?: string
}>()

const color = computed(() => props.color ?? '#38bdf8')
const pct = computed(() => Math.min(Math.max(props.value, 0), 100) / 100)

const R = 52
const ARC = Math.PI * R // semicircle length ≈ 163.36
const dash = computed(() => pct.value * ARC)
const gap = computed(() => ARC - dash.value)
</script>

<template>
  <div class="flex flex-col items-center">
    <svg viewBox="0 0 130 72" class="w-full max-w-[130px]">
      <!-- Background arc -->
      <path
        d="M 13 65 A 52 52 0 0 1 117 65"
        fill="none"
        stroke="#f1f5f9"
        stroke-width="9"
        stroke-linecap="round"
      />
      <!-- Value arc -->
      <path
        d="M 13 65 A 52 52 0 0 1 117 65"
        fill="none"
        :stroke="color"
        stroke-width="9"
        stroke-linecap="round"
        :stroke-dasharray="`${dash} ${gap}`"
        class="transition-all duration-1000 ease-out"
      />
      <!-- Value text -->
      <text x="65" y="56" text-anchor="middle" :fill="color" font-size="20" font-weight="700">
        {{ value }}%
      </text>
    </svg>
    <p class="text-xs font-semibold text-zinc-200 mt-0.5 text-center">{{ label }}</p>
    <p v-if="sublabel" class="text-[10px] text-zinc-500 text-center">{{ sublabel }}</p>
  </div>
</template>
