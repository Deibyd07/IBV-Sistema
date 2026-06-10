<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { supabaseDataService } from '~/services/supabaseDataService'
import type { DashboardStats, ActivityItem, WeeklyTrends } from '~/services/supabaseDataService'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const periodo = ref<'hoy' | 'semana' | 'mes'>('semana')

// States
const loading = ref(true)
const error = ref('')
const dashboardStats = ref<DashboardStats | null>(null)
const activities = ref<ActivityItem[]>([])
const weeklyTrends = ref<WeeklyTrends | null>(null)

// Computed stats for KPIs
const kpiData = computed(() => {
  if (!dashboardStats.value) return []

  const stats = dashboardStats.value
  return [
    {
      label: 'Vehículos Totales',
      value: stats.total_vehiculos,
      icon: 'truck',
      bg: 'bg-sky-500/10',
      color: 'text-sky-300',
      trend: '+12% esta semana',
      trendUp: true,
    },
    {
      label: 'Listos para Despacho',
      value: stats.listos_despacho,
      icon: 'check',
      bg: 'bg-emerald-500/10',
      color: 'text-emerald-300',
      trend: 'Aprobados',
      trendUp: true,
    },
    {
      label: 'Despachados',
      value: stats.despachados,
      icon: 'exit',
      bg: 'bg-violet-500/10',
      color: 'text-violet-300',
      trend: 'En tránsito',
      trendUp: true,
    },
    {
      label: 'Problemas Encontrados',
      value: stats.problemas_encontrados,
      icon: 'alert',
      bg: 'bg-red-500/10',
      color: 'text-red-300',
      trend: 'Requieren atención',
      trendUp: false,
    },
  ]
})

// Computed pipeline data
const pipelineData = computed(() => {
  if (!dashboardStats.value) return []

  const stats = dashboardStats.value
  const total = stats.total_vehiculos || 1

  return [
    {
      label: 'Recibidos',
      value: stats.total_vehiculos,
      pct: 100,
      color: 'bg-sky-500',
      light: 'bg-sky-500/10',
      text: 'text-sky-300',
    },
    {
      label: 'En Impronta',
      value: stats.en_impronta,
      pct: Math.round((stats.en_impronta / total) * 100),
      color: 'bg-amber-400',
      light: 'bg-amber-400/10',
      text: 'text-amber-300',
    },
    {
      label: 'En Inventario',
      value: stats.en_inventario,
      pct: Math.round((stats.en_inventario / total) * 100),
      color: 'bg-orange-500',
      light: 'bg-orange-500/10',
      text: 'text-orange-300',
    },
    {
      label: 'Despachados',
      value: stats.despachados,
      pct: Math.round((stats.despachados / total) * 100),
      color: 'bg-emerald-500',
      light: 'bg-emerald-500/10',
      text: 'text-emerald-300',
    },
  ]
})

const donutSegments = computed(() => {
  if (!dashboardStats.value) return []
  const stats = dashboardStats.value
  return [
    { label: 'Recibidos', value: stats.total_vehiculos, color: '#38bdf8' },
    { label: 'Impronta', value: stats.en_impronta, color: '#60a5fa' },
    { label: 'Inventario', value: stats.en_inventario, color: '#fbbf24' },
    { label: 'Listos', value: stats.listos_despacho, color: '#34d399' },
    { label: 'Despachados', value: stats.despachados, color: '#9ca3af' },
  ]
})

const weekDays = computed(() => weeklyTrends.value?.days || [])
const weekSeries = computed(
  () =>
    weeklyTrends.value?.series || [
      { label: 'Recibidos', color: '#38bdf8' },
      { label: 'Despachados', color: '#34d399' },
    ]
)

const moduleEfficiency = computed(() => {
  if (!dashboardStats.value) return []
  const stats = dashboardStats.value
  const total = stats.total_vehiculos || 1
  return [
    {
      label: 'Recepción',
      sublabel: 'VINs escaneados',
      pct: stats.total_vehiculos ? 100 : 0,
      color: 'bg-amber-400',
      value: stats.total_vehiculos,
    },
    {
      label: 'Impronta',
      sublabel: 'Completadas',
      pct: Math.round((stats.en_impronta / total) * 100),
      color: 'bg-sky-500',
      value: stats.en_impronta,
    },
    {
      label: 'Inventario',
      sublabel: 'Aprobados',
      pct: Math.round((stats.en_inventario / total) * 100),
      color: 'bg-amber-400',
      value: stats.en_inventario,
    },
    {
      label: 'Despacho',
      sublabel: 'Despachados',
      pct: Math.round((stats.despachados / total) * 100),
      color: 'bg-emerald-500',
      value: stats.despachados,
    },
  ]
})

// Load data
const getStartIso = (value: 'hoy' | 'semana' | 'mes') => {
  const now = new Date()
  const start = new Date(now)
  const daysBack = value === 'semana' ? 6 : value === 'mes' ? 29 : 0
  start.setDate(now.getDate() - daysBack)
  start.setHours(0, 0, 0, 0)
  return start.toISOString()
}

const getTrendDays = (value: 'hoy' | 'semana' | 'mes') => {
  if (value === 'hoy') return 1
  if (value === 'mes') return 30
  return 7
}

const loadDashboard = async () => {
  try {
    loading.value = true
    error.value = ''
    const startIso = getStartIso(periodo.value)
    const _trendDays = getTrendDays(periodo.value)
    const statsData = await supabaseDataService.getDashboardStats(startIso)
    dashboardStats.value = statsData
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al cargar datos del dashboard'
    console.error('Error loading dashboard:', e)
  } finally {
    loading.value = false
  }

  try {
    const startIso = getStartIso(periodo.value)
    const trendDays = getTrendDays(periodo.value)
    const [activitiesData, weeklyData] = await Promise.all([
      supabaseDataService.getActivities(5, startIso),
      supabaseDataService.getWeeklyTrends(trendDays, startIso),
    ])

    activities.value = activitiesData || []
    weeklyTrends.value = weeklyData
  } catch (e: unknown) {
    console.error('Error loading secondary dashboard data:', e)
  }
}

onMounted(() => {
  loadDashboard()
})

watch(periodo, () => {
  loadDashboard()
})

const iconMap: Record<string, string> = {
  truck:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 17h.01M12 17h.01M16 17h.01M3.5 11l.5-2a2 2 0 011.9-1.4h12.2A2 2 0 0120 9l.5 2M4 17a2 2 0 01-2-2v-2h20v2a2 2 0 01-2 2H4z" /></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>',
  alert:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
}
</script>

<template>
  <ClientOnly>
    <div class="space-y-8">
      <!-- ── Header ── -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
            ADM — Módulo Administración
          </p>
          <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
            Dashboard Administrativo
          </h1>
          <p class="text-zinc-500 mt-1">KPIs y métricas del sistema IBV en tiempo real</p>
        </div>
        <div class="flex items-center gap-3 self-start sm:self-auto">
          <button
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            :disabled="loading"
            @click="loadDashboard"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8 8 0 104.582 9"
              />
            </svg>
            Recargar
          </button>
          <NuxtLink
            to="/admin/estadisticas"
            class="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-black rounded-md text-sm font-medium hover:bg-amber-300 transition shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Estadísticas
          </NuxtLink>
          <div class="flex items-center gap-1 bg-[#0b0e14] rounded-md p-1">
            <button
              v-for="p in ['hoy', 'semana', 'mes'] as const"
              :key="p"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-lg transition',
                periodo === p
                  ? 'bg-[#10141c] shadow text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200',
              ]"
              @click="periodo = p"
            >
              {{ p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── KPI Cards ── -->
      <div v-if="!loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="kpi in kpiData"
          :key="kpi.label"
          class="bg-[#10141c] rounded-lg p-5 shadow-sm border border-white/[0.06] hover:shadow-md transition"
        >
          <div class="flex items-center justify-between mb-4">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', kpi.bg]">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span :class="['w-5 h-5', kpi.color]" v-html="iconMap[kpi.icon]" />
            </div>
            <span
              :class="[
                'text-xs font-medium px-2 py-1 rounded-sm',
                kpi.trendUp
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : 'bg-amber-400/10 text-amber-300',
              ]"
            >
              {{ kpi.trendUp ? '▲' : '▼' }}
            </span>
          </div>
          <p class="font-display text-2xl uppercase tracking-tight text-zinc-100">
            {{ kpi.value }}
          </p>
          <p class="text-sm font-medium text-zinc-200 mt-0.5">{{ kpi.label }}</p>
          <p class="text-xs text-zinc-600 mt-1">{{ kpi.trend }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div v-for="i in 4" :key="i" class="bg-white/[0.06] rounded-lg p-5 h-32 animate-pulse" />
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-red-300">
        {{ error }}
      </div>

      <!-- ── Pipeline Funnel + Donut ── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Funnel (2/3) -->
        <div class="lg:col-span-2 bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
                Pipeline de Vehículos
              </h3>
              <p class="text-xs text-zinc-600 mt-0.5">
                Flujo completo desde recepción hasta despacho
              </p>
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="stage in pipelineData" :key="stage.label">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <span :class="['w-2 h-2 rounded-full', stage.color]" />
                  <span class="text-sm font-medium text-zinc-200">{{ stage.label }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    :class="[
                      'text-xs font-semibold px-2 py-0.5 rounded-sm',
                      stage.light,
                      stage.text,
                    ]"
                  >
                    {{ stage.value }}
                  </span>
                  <span class="text-xs text-zinc-600 w-9 text-right">{{ stage.pct }}%</span>
                </div>
              </div>
              <div class="h-2.5 bg-[#0b0e14] rounded-sm overflow-hidden">
                <div
                  :class="['h-full rounded-sm transition-all duration-700', stage.color]"
                  :style="{ width: `${stage.pct}%` }"
                />
              </div>
            </div>
          </div>
          <div class="flex items-center justify-center gap-1 mt-5 flex-wrap">
            <template v-for="(stage, index) in pipelineData" :key="stage.label">
              <span :class="['text-xs px-2 py-1 rounded-lg font-medium', stage.light, stage.text]">
                {{ stage.label }} ({{ stage.value }})
              </span>
              <span v-if="Number(index) < pipelineData.length - 1" class="text-zinc-600 text-sm">
                ›
              </span>
            </template>
          </div>
        </div>

        <!-- Donut (1/3) -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6 flex flex-col">
          <div class="mb-4">
            <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">Distribución</h3>
            <p class="text-xs text-zinc-600 mt-0.5">Por etapa del ciclo</p>
          </div>
          <div class="flex-1 flex items-center justify-center">
            <ChartsDonutChart :segments="donutSegments" :size="190" :thickness="36" />
          </div>
        </div>
      </div>

      <!-- ── Tendencia Semanal + Eficiencia ── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gráfico de barras -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
          <div class="mb-6">
            <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
              Tendencia Semanal
            </h3>
            <p class="text-xs text-zinc-600 mt-0.5">Vehículos recibidos vs. despachados</p>
          </div>
          <ChartsBarChart :bars="weekDays" :series="weekSeries" :height="160" />
        </div>

        <!-- Eficiencia por módulo -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
          <div class="mb-6">
            <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
              Eficiencia por Módulo
            </h3>
            <p class="text-xs text-zinc-600 mt-0.5">Porcentaje de completado sobre el total</p>
          </div>
          <div class="space-y-5">
            <div v-for="mod in moduleEfficiency" :key="mod.label">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <span class="text-sm font-medium text-zinc-100">{{ mod.label }}</span>
                  <span class="text-xs text-zinc-600 ml-2">{{ mod.sublabel }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-zinc-200">{{ mod.value }}</span>
                  <span
                    :class="[
                      'text-xs font-bold px-1.5 py-0.5 rounded',
                      mod.pct >= 75
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : mod.pct >= 40
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'bg-red-500/10 text-red-300',
                    ]"
                  >
                    {{ mod.pct }}%
                  </span>
                </div>
              </div>
              <div class="h-2 bg-[#0b0e14] rounded-sm overflow-hidden">
                <div
                  :class="['h-full rounded-sm transition-all duration-700', mod.color]"
                  :style="{ width: `${mod.pct}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Actividad Reciente ── -->
      <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
            Actividad Reciente
          </h3>
          <span class="text-xs text-zinc-600 bg-[#0d111a] px-2 py-1 rounded-lg">
            Últimas actividades
          </span>
        </div>
        <div v-if="activities.length > 0" class="space-y-4">
          <div v-for="(act, i) in activities" :key="i" class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-xs font-bold text-black bg-amber-400"
            >
              {{ act.user?.nombres?.[0] || 'U' }}{{ act.user?.apellidos?.[0] || '' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-zinc-100">
                <span class="font-medium">
                  {{ act.user?.nombres || 'Sistema' }} {{ act.user?.apellidos || '' }}
                </span>
                {{ act.description }}
              </p>
              <p class="text-xs text-zinc-600 mt-0.5">
                {{ new Date(act.timestamp).toLocaleString('es') }}
              </p>
            </div>
            <span
              :class="[
                'text-xs px-2 py-1 rounded-sm font-medium shrink-0',
                act.role === 'admin'
                  ? 'bg-amber-400/[0.08] text-amber-300'
                  : act.role === 'recibidor'
                    ? 'bg-sky-500/10 text-sky-300'
                    : act.role === 'inventario'
                      ? 'bg-amber-400/10 text-amber-300'
                      : 'bg-emerald-500/10 text-emerald-300',
              ]"
            >
              {{ act.role || 'Actividad' }}
            </span>
          </div>
        </div>
        <div v-else class="text-center py-8 text-zinc-600">No hay actividad reciente</div>
      </div>
    </div>
  </ClientOnly>
</template>
