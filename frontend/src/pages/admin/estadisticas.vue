<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStatsStore } from '~/stores/statsStore'
import { useVehiculoStore } from '~/stores/vehiculoStore'

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const stats = useStatsStore()
const vehiculoStore = useVehiculoStore()
const searchQuery = ref('')
const loading = ref(false)

const estadoMap: Record<string, { label: string; cls: string }> = {
  recibido: { label: 'Recibido', cls: 'bg-[#0b0e14] text-zinc-400' },
  impronta_pendiente: { label: 'Pend. Impronta', cls: 'bg-orange-500/15 text-orange-300' },
  impronta_completada: { label: 'Impronta OK', cls: 'bg-sky-500/15 text-sky-300' },
  inventario_pendiente: { label: 'Pend. Inventario', cls: 'bg-amber-400/15 text-amber-300' },
  inventario_aprobado: { label: 'Inventario OK', cls: 'bg-teal-500/15 text-teal-300' },
  listo_despacho: { label: 'Listo Despacho', cls: 'bg-emerald-500/15 text-emerald-300' },
  despachado: { label: 'Despachado', cls: 'bg-white/[0.06] text-zinc-500' },
}

const kpis = computed(() => [
  {
    label: 'Total Registrados',
    value: vehiculoStore.total,
    sub: 'Vehículos en el sistema',
    textColor: 'text-amber-300',
    iconBg: 'bg-amber-400/10',
    iconPath:
      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    label: 'En Patio',
    value: vehiculoStore.recibidos,
    sub: 'Actualmente en instalaciones',
    textColor: 'text-sky-300',
    iconBg: 'bg-sky-500/10',
    iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    label: 'Listos Despacho',
    value: vehiculoStore.listosDespacho,
    sub: 'Aprobados para salida',
    textColor: 'text-emerald-300',
    iconBg: 'bg-emerald-500/10',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Despachados',
    value: vehiculoStore.despachados,
    sub: 'Completamente procesados',
    textColor: 'text-zinc-400',
    iconBg: 'bg-white/[0.06]',
    iconPath:
      'M8 17h.01M12 17h.01M16 17h.01M3.5 11l.5-2a2 2 0 011.9-1.4h12.2A2 2 0 0120 9l.5 2M4 17a2 2 0 01-2-2v-2h20v2a2 2 0 01-2 2H4z',
  },
  {
    label: 'Pendientes',
    value: vehiculoStore.pendientesImpronta + vehiculoStore.pendientesInventario,
    sub: `${vehiculoStore.pendientesImpronta} impronta · ${vehiculoStore.pendientesInventario} inventario`,
    textColor: 'text-amber-300',
    iconBg: 'bg-amber-400/10',
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Promedio en Patio',
    value: `${stats.tiempoPromedioEnPatio}d`,
    sub: 'Días promedio en instalaciones',
    textColor: 'text-violet-300',
    iconBg: 'bg-violet-500/10',
    iconPath:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
])

const gaugeColors: Record<string, string> = {
  Recepción: '#0ea5e9',
  Impronta: '#3b82f6',
  Inventario: '#34d399',
  Despacho: '#fb923c',
}

const clientColors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899']

const filteredVehiculos = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return vehiculoStore.vehiculos
  return vehiculoStore.vehiculos.filter(
    (v) =>
      v.vin.toLowerCase().includes(q) ||
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.cliente.toLowerCase().includes(q)
  )
})

async function descargarExcel() {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  const fecha = new Date()
  const fechaStr = fecha.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const horaStr = fecha.toLocaleTimeString('es-VE')

  // ════════════════════════════════════════════════════════════
  // HOJA 1: RESUMEN EJECUTIVO
  // ════════════════════════════════════════════════════════════
  const resumenData = [
    ['SISTEMA IBV - REPORTE DE ESTADÍSTICAS'],
    ['Fecha de Generación:', fechaStr, '', 'Hora:', horaStr],
    [],
    ['═══ INDICADORES CLAVE DE RENDIMIENTO (KPIs) ═══'],
    [],
    ['CATEGORÍA', 'INDICADOR', 'VALOR', 'UNIDAD'],
    ['Capacidad', 'Total Registrados', vehiculoStore.total, 'vehículos'],
    ['Operación', 'En Patio (No Despachados)', vehiculoStore.recibidos, 'vehículos'],
    ['Operación', 'Con Impronta Completada', vehiculoStore.conImpronta, 'vehículos'],
    ['Operación', 'Con Inventario Aprobado', vehiculoStore.conInventario, 'vehículos'],
    ['Despacho', 'Listos Para Despacho', vehiculoStore.listosDespacho, 'vehículos'],
    ['Despacho', 'Despachados', vehiculoStore.despachados, 'vehículos'],
    ['Pendientes', 'Pendientes Impronta', vehiculoStore.pendientesImpronta, 'vehículos'],
    ['Pendientes', 'Pendientes Inventario', vehiculoStore.pendientesInventario, 'vehículos'],
    [],
    ['═══ MÉTRICAS DE EFICIENCIA ═══'],
    [],
    ['MÉTRICA', 'VALOR', 'UNIDAD'],
    ['Tiempo Promedio en Patio', stats.tiempoPromedioEnPatio, 'días'],
    ['Tasa de Despacho', stats.tasaDespacho, '%'],
    [
      'Eficiencia Global',
      vehiculoStore.total > 0
        ? Math.round((vehiculoStore.despachados / vehiculoStore.total) * 100)
        : 0,
      '%',
    ],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(resumenData)

  // Estilos y formato para Resumen
  ws1['!cols'] = [
    { wch: 18 }, // Categoría
    { wch: 35 }, // Indicador
    { wch: 15 }, // Valor
    { wch: 15 }, // Unidad
  ]

  // Merge cells para título
  if (!ws1['!merges']) ws1['!merges'] = []
  ws1['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Título principal
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Subtítulo KPIs
    { s: { r: 15, c: 0 }, e: { r: 15, c: 2 } } // Subtítulo Métricas
  )

  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Ejecutivo')

  // ════════════════════════════════════════════════════════════
  // HOJA 2: PIPELINE DE PROCESO
  // ════════════════════════════════════════════════════════════
  const pipeData = [
    ['PIPELINE DE VEHÍCULOS - SISTEMA IBV'],
    ['Fecha:', fechaStr],
    [],
    ['ETAPA DEL PROCESO', 'CANTIDAD', 'PORCENTAJE', 'ESTADO'],
  ]

  stats.pipelineFunnel.forEach((p) => {
    const estado = p.pct >= 75 ? '✓ Óptimo' : p.pct >= 50 ? 'Normal' : 'Bajo'
    pipeData.push([p.label, p.value, p.pct / 100, estado])
  })

  pipeData.push([])
  pipeData.push(['TOTAL VEHÍCULOS EN SISTEMA:', vehiculoStore.total, '', ''])

  const ws2 = XLSX.utils.aoa_to_sheet(pipeData)
  ws2['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 15 }]

  // Merge título
  if (!ws2['!merges']) ws2['!merges'] = []
  ws2['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: pipeData.length - 1, c: 1 }, e: { r: pipeData.length - 1, c: 2 } }
  )

  // Formato de porcentajes (columna C, desde fila 5)
  for (let i = 4; i < 4 + stats.pipelineFunnel.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: i, c: 2 })
    if (ws2[cellRef]) {
      ws2[cellRef].z = '0.0%'
    }
  }

  XLSX.utils.book_append_sheet(wb, ws2, 'Pipeline')

  // ════════════════════════════════════════════════════════════
  // HOJA 3: BASE DE DATOS COMPLETA DE VEHÍCULOS
  // ════════════════════════════════════════════════════════════
  const vehHeaders = [
    ['BASE DE DATOS COMPLETA - TODOS LOS VEHÍCULOS'],
    ['Generado:', fechaStr, 'Total Registros:', vehiculoStore.vehiculos.length],
    [],
  ]

  const vehData = vehiculoStore.vehiculos.map((v) => ({
    VIN: v.vin,
    Placa: v.placa,
    Marca: v.marca,
    Modelo: v.modelo,
    Año: v.anio,
    Color: v.color,
    Cliente: v.cliente,
    Contenedor: v.contenedorCodigo || '—',
    'Fecha Recepción': v.fechaRecepcion,
    Hora: v.horaRecepcion,
    Impronta: v.improntaCompletada ? 'SÍ' : 'NO',
    Folio: v.improntaFolio || '—',
    'Fecha Impronta': v.fechaImpronta || '—',
    Inventario: v.inventarioCompletado ? 'SÍ' : 'NO',
    Aprobado: v.inventarioAprobado ? 'SÍ' : 'NO',
    'Fecha Inv.': v.inventarioFecha || '—',
    Inspector: v.inventarioInspector || '—',
    'Total Items': v.inventarioResultado?.totalItems ?? 0,
    Aprobados: v.inventarioResultado?.aprobados ?? 0,
    Fallas: v.inventarioResultado?.fallas ?? 0,
    'N/A': v.inventarioResultado?.na ?? 0,
    Despachado: v.despachado ? 'SÍ' : 'NO',
    'Fecha Desp.': v.fechaDespacho || '—',
    Lote: v.lotDespacho || '—',
    Despachador: v.despachador || '—',
    'Estado Actual': v.estado,
  }))

  const ws3 = XLSX.utils.aoa_to_sheet([...vehHeaders])
  XLSX.utils.sheet_add_json(ws3, vehData, { origin: 'A4' })

  ws3['!cols'] = [
    { wch: 18 }, // VIN
    { wch: 10 }, // Placa
    { wch: 12 }, // Marca
    { wch: 12 }, // Modelo
    { wch: 6 }, // Año
    { wch: 10 }, // Color
    { wch: 20 }, // Cliente
    { wch: 12 }, // Contenedor
    { wch: 12 }, // Fecha Recepción
    { wch: 8 }, // Hora
    { wch: 10 }, // Impronta
    { wch: 12 }, // Folio
    { wch: 12 }, // Fecha Impronta
    { wch: 10 }, // Inventario
    { wch: 10 }, // Aprobado
    { wch: 12 }, // Fecha Inv
    { wch: 15 }, // Inspector
    { wch: 10 }, // Total Items
    { wch: 10 }, // Aprobados
    { wch: 8 }, // Fallas
    { wch: 6 }, // N/A
    { wch: 10 }, // Despachado
    { wch: 12 }, // Fecha Desp
    { wch: 10 }, // Lote
    { wch: 15 }, // Despachador
    { wch: 18 }, // Estado
  ]

  if (!ws3['!merges']) ws3['!merges'] = []
  ws3['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } })

  // Filtros automáticos
  ws3['!autofilter'] = { ref: `A3:Z${3 + vehData.length}` }

  XLSX.utils.book_append_sheet(wb, ws3, 'Vehículos')

  // ════════════════════════════════════════════════════════════
  // HOJA 4: ANÁLISIS POR MARCA
  // ════════════════════════════════════════════════════════════
  const marcaHeaders = [
    ['ANÁLISIS POR MARCA DE VEHÍCULOS'],
    ['Total Vehículos:', vehiculoStore.total],
    [],
    ['MARCA', 'CANTIDAD', 'PORCENTAJE', 'PARTICIPACIÓN'],
  ]

  const marcaData = stats.vehiculosPorMarca.map((m) => {
    const pct = vehiculoStore.total > 0 ? m.value / vehiculoStore.total : 0
    return [m.label, m.value, pct, pct >= 0.2 ? 'Alta' : pct >= 0.1 ? 'Media' : 'Baja']
  })

  const ws4 = XLSX.utils.aoa_to_sheet([...marcaHeaders, ...marcaData])
  ws4['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }]

  if (!ws4['!merges']) ws4['!merges'] = []
  ws4['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } })

  // Formato porcentajes
  for (let i = 4; i < 4 + marcaData.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: i, c: 2 })
    if (ws4[cellRef]) {
      ws4[cellRef].z = '0.0%'
    }
  }

  ws4['!autofilter'] = { ref: `A3:D${3 + marcaData.length}` }

  XLSX.utils.book_append_sheet(wb, ws4, 'Por Marca')

  // ════════════════════════════════════════════════════════════
  // HOJA 5: ANÁLISIS POR CLIENTE
  // ════════════════════════════════════════════════════════════
  const clienteHeaders = [
    ['ANÁLISIS POR CLIENTE'],
    ['Total Vehículos:', vehiculoStore.total],
    [],
    ['CLIENTE', 'CANTIDAD', 'PORCENTAJE', 'CLASIFICACIÓN'],
  ]

  const clienteData = stats.vehiculosPorCliente.map((c) => {
    const pct = vehiculoStore.total > 0 ? c.value / vehiculoStore.total : 0
    return [c.label, c.value, pct, pct >= 0.15 ? 'Premium' : pct >= 0.05 ? 'Regular' : 'Ocasional']
  })

  const ws5 = XLSX.utils.aoa_to_sheet([...clienteHeaders, ...clienteData])
  ws5['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 18 }]

  if (!ws5['!merges']) ws5['!merges'] = []
  ws5['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } })

  for (let i = 4; i < 4 + clienteData.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: i, c: 2 })
    if (ws5[cellRef]) {
      ws5[cellRef].z = '0.0%'
    }
  }

  ws5['!autofilter'] = { ref: `A3:D${3 + clienteData.length}` }

  XLSX.utils.book_append_sheet(wb, ws5, 'Por Cliente')

  // ════════════════════════════════════════════════════════════
  // HOJA 6: EFICIENCIA DE MÓDULOS
  // ════════════════════════════════════════════════════════════
  const efHeaders = [
    ['EFICIENCIA DE MÓDULOS OPERATIVOS'],
    ['Análisis de rendimiento por área'],
    [],
    ['MÓDULO', 'DESCRIPCIÓN', 'CANTIDAD', 'EFICIENCIA', 'ESTADO'],
  ]

  const efData = stats.moduleEfficiency.map((e) => {
    const estado =
      e.pct >= 80 ? '✓ Excelente' : e.pct >= 60 ? '✓ Bueno' : e.pct >= 40 ? 'Regular' : '✗ Bajo'
    return [e.label, e.sublabel, e.value, e.pct / 100, estado]
  })

  const ws6 = XLSX.utils.aoa_to_sheet([...efHeaders, ...efData])
  ws6['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 15 }]

  if (!ws6['!merges']) ws6['!merges'] = []
  ws6['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })

  for (let i = 4; i < 4 + efData.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: i, c: 3 })
    if (ws6[cellRef]) {
      ws6[cellRef].z = '0.0%'
    }
  }

  XLSX.utils.book_append_sheet(wb, ws6, 'Eficiencia')

  // ════════════════════════════════════════════════════════════
  // HOJA 7: TENDENCIA TEMPORAL
  // ════════════════════════════════════════════════════════════
  const tendHeaders = [
    ['TENDENCIA TEMPORAL - RECEPCIÓN VS DESPACHO'],
    ['Período de Análisis:', `Últimos ${stats.dailyTrend.length} registros`],
    [],
    ['FECHA', 'RECIBIDOS', 'DESPACHADOS', 'DIFERENCIA', 'BALANCE'],
  ]

  const tendData = stats.dailyTrend.map((d) => {
    const recibidos = d.values[0] || 0
    const despachados = d.values[1] || 0
    const diferencia = recibidos - despachados
    const balance =
      diferencia > 0 ? '↑ Acumulando' : diferencia < 0 ? '↓ Despachando' : '= Equilibrado'
    return [d.label, recibidos, despachados, diferencia, balance]
  })

  // Calcular totales
  const totalRecibidos = tendData.reduce((sum, row) => sum + row[1], 0)
  const totalDespachados = tendData.reduce((sum, row) => sum + row[2], 0)

  tendData.push([])
  tendData.push([
    'TOTALES:',
    totalRecibidos,
    totalDespachados,
    totalRecibidos - totalDespachados,
    '',
  ])

  const ws7 = XLSX.utils.aoa_to_sheet([...tendHeaders, ...tendData])
  ws7['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }]

  if (!ws7['!merges']) ws7['!merges'] = []
  ws7['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })

  XLSX.utils.book_append_sheet(wb, ws7, 'Tendencia')

  // ════════════════════════════════════════════════════════════
  // GUARDAR ARCHIVO
  // ════════════════════════════════════════════════════════════
  const fechaArchivo = fecha.toISOString().slice(0, 10).replace(/-/g, '')
  const nombreArchivo = `IBV_Reporte_Completo_${fechaArchivo}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}

const recargarDatos = async () => {
  loading.value = true
  try {
    await vehiculoStore.loadFromSupabase()
  } catch (err) {
    console.error('Error cargando datos:', err)
  } finally {
    loading.value = false
  }
}

// Cargar datos de Supabase al montar
onMounted(async () => {
  loading.value = true
  try {
    await vehiculoStore.loadFromSupabase()
  } catch (err) {
    console.error('Error cargando datos:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <ClientOnly>
    <div class="space-y-6">
      <!-- ═══════════ Header ═══════════ -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
            ADM — Módulo Administración
          </p>
          <h1 class="font-display text-xl uppercase tracking-tight text-zinc-100">
            Estadísticas y Reportes
          </h1>
          <p class="text-sm text-zinc-500 mt-1">
            Análisis completo del flujo de vehículos del sistema IBV
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-2 px-4 py-2.5 border border-white/[0.10] bg-white/[0.04] text-zinc-200 rounded-md hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            @click="recargarDatos"
            :disabled="loading"
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
          <button
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black rounded-md font-semibold text-sm hover:bg-amber-300 transition shadow-sm"
            @click="descargarExcel"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"
              />
            </svg>
            Descargar Excel Completo
          </button>
        </div>
      </div>

      <!-- ═══════════ KPI Cards ═══════════ -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="bg-[#10141c] rounded-lg p-4 border border-white/[0.06] shadow-sm hover:shadow-md transition"
        >
          <div :class="['w-9 h-9 rounded-lg flex items-center justify-center mb-2', kpi.iconBg]">
            <svg
              :class="['w-4 h-4', kpi.textColor]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="kpi.iconPath"
              />
            </svg>
          </div>
          <p :class="['font-data text-2xl font-bold', kpi.textColor]">{{ kpi.value }}</p>
          <p class="text-xs text-zinc-500 mt-1">{{ kpi.label }}</p>
          <p class="text-[10px] text-zinc-600 mt-0.5 leading-tight">{{ kpi.sub }}</p>
        </div>
      </div>

      <!-- ═══════════ Pipeline + Donut por Estado ═══════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Pipeline Funnel -->
        <div class="lg:col-span-2 bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
          <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
            Pipeline de Vehículos
          </h3>
          <p class="text-xs text-zinc-600 mt-0.5 mb-5">Progresión completa del flujo</p>
          <div class="space-y-3">
            <div v-for="stage in stats.pipelineFunnel" :key="stage.label">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <span :class="['w-2.5 h-2.5 rounded-full', stage.color]" />
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
                  <span class="text-xs text-zinc-600 w-10 text-right">{{ stage.pct }}%</span>
                </div>
              </div>
              <div class="h-3 bg-[#0b0e14] rounded-sm overflow-hidden">
                <div
                  :class="['h-full rounded-sm transition-all duration-700', stage.color]"
                  :style="{ width: `${stage.pct}%` }"
                />
              </div>
            </div>
          </div>
          <!-- Visual flow -->
          <div class="flex items-center justify-center gap-1 mt-5 flex-wrap">
            <template v-for="(stage, i) in stats.pipelineFunnel" :key="'flow-' + stage.label">
              <span
                :class="['text-[10px] px-2 py-1 rounded-sm font-semibold', stage.light, stage.text]"
              >
                {{ stage.label }} ({{ stage.value }})
              </span>
              <span v-if="i < stats.pipelineFunnel.length - 1" class="text-zinc-600 text-sm">
                →
              </span>
            </template>
          </div>
        </div>

        <!-- Donut distribución por estado -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6 flex flex-col">
          <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
            Distribución por Estado
          </h3>
          <p class="text-xs text-zinc-600 mt-0.5 mb-4">Porcentaje por etapa del ciclo</p>
          <div class="flex-1 flex items-center justify-center">
            <ChartsDonutChart :segments="stats.donutSegments" :size="200" :thickness="38" />
          </div>
        </div>
      </div>

      <!-- ═══════════ Tendencia 14 días + Donut por Marca ═══════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Area chart -->
        <div class="lg:col-span-3 bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
          <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
            Tendencia Últimos 14 Días
          </h3>
          <p class="text-xs text-zinc-600 mt-0.5 mb-4">Vehículos recibidos vs. despachados</p>
          <ChartsAreaChart :data="stats.dailyTrend" :series="stats.dailySeries" :height="200" />
        </div>

        <!-- Donut por marca -->
        <div
          class="lg:col-span-2 bg-[#10141c] rounded-lg border border-white/[0.08] p-6 flex flex-col"
        >
          <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
            Distribución por Marca
          </h3>
          <p class="text-xs text-zinc-600 mt-0.5 mb-4">Proporción de vehículos por fabricante</p>
          <div class="flex-1 flex items-center justify-center">
            <ChartsDonutChart :segments="stats.marcaDonutSegments" :size="190" :thickness="34" />
          </div>
        </div>
      </div>

      <!-- ═══════════ Eficiencia (Gauges) + Top Clientes ═══════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Module efficiency gauges -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
          <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
            Eficiencia por Módulo
          </h3>
          <p class="text-xs text-zinc-600 mt-0.5 mb-6">Porcentaje de completado sobre total</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ChartsGaugeChart
              v-for="mod in stats.moduleEfficiency"
              :key="mod.label"
              :value="mod.pct"
              :label="mod.label"
              :sublabel="`${mod.value} vehículos`"
              :color="gaugeColors[mod.label] || '#38bdf8'"
            />
          </div>
        </div>

        <!-- Top clientes -->
        <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
          <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
            Vehículos por Cliente
          </h3>
          <p class="text-xs text-zinc-600 mt-0.5 mb-5">Distribución según el destinatario</p>
          <div class="space-y-4">
            <div v-for="(c, i) in stats.vehiculosPorCliente" :key="c.label">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-sm font-medium text-zinc-200 truncate max-w-[70%]">
                  {{ c.label }}
                </span>
                <span class="text-sm font-bold text-zinc-100">{{ c.value }}</span>
              </div>
              <div class="h-2.5 bg-[#0b0e14] rounded-sm overflow-hidden">
                <div
                  class="h-full rounded-sm transition-all duration-700"
                  :style="{
                    width: `${vehiculoStore.total > 0 ? (c.value / vehiculoStore.total) * 100 : 0}%`,
                    backgroundColor: clientColors[i % clientColors.length],
                  }"
                />
              </div>
            </div>
            <p
              v-if="stats.vehiculosPorCliente.length === 0"
              class="text-sm text-zinc-600 text-center py-4"
            >
              Sin datos de clientes
            </p>
          </div>
        </div>
      </div>

      <!-- ═══════════ Resumen Semanal (Barras) ═══════════ -->
      <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-6">
        <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">Resumen Semanal</h3>
        <p class="text-xs text-zinc-600 mt-0.5 mb-5">
          Comparativa de recibidos vs. despachados por día
        </p>
        <ChartsBarChart :bars="stats.weekDays" :series="stats.weekSeries" :height="180" />
      </div>

      <!-- ═══════════ Tabla de Vehículos ═══════════ -->
      <div class="bg-[#10141c] rounded-lg border border-white/[0.08] overflow-hidden">
        <div class="p-6 border-b border-white/[0.06]">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 class="font-display text-sm uppercase tracking-wide text-zinc-100">
                Detalle de Vehículos
              </h3>
              <p class="text-xs text-zinc-600 mt-0.5">
                {{ filteredVehiculos.length }} de {{ vehiculoStore.total }} registros
              </p>
            </div>
            <div class="relative max-w-xs w-full">
              <svg
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar VIN, placa, marca, cliente..."
                class="w-full pl-10 pr-4 py-2 text-sm border border-white/[0.08] rounded-md focus:border-amber-400/70 outline-none"
              />
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[#0d111a] text-left">
                <th class="px-4 py-3 font-semibold text-zinc-400 text-xs uppercase tracking-wider">
                  VIN
                </th>
                <th class="px-4 py-3 font-semibold text-zinc-400 text-xs uppercase tracking-wider">
                  Placa
                </th>
                <th class="px-4 py-3 font-semibold text-zinc-400 text-xs uppercase tracking-wider">
                  Vehículo
                </th>
                <th class="px-4 py-3 font-semibold text-zinc-400 text-xs uppercase tracking-wider">
                  Cliente
                </th>
                <th class="px-4 py-3 font-semibold text-zinc-400 text-xs uppercase tracking-wider">
                  Recepción
                </th>
                <th class="px-4 py-3 font-semibold text-zinc-400 text-xs uppercase tracking-wider">
                  Impronta
                </th>
                <th class="px-4 py-3 font-semibold text-zinc-400 text-xs uppercase tracking-wider">
                  Inventario
                </th>
                <th class="px-4 py-3 font-semibold text-zinc-400 text-xs uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.06]">
              <tr
                v-for="v in filteredVehiculos"
                :key="v.id"
                class="hover:bg-[#0d111a]/80 transition"
              >
                <td class="px-4 py-3 font-data text-xs text-zinc-400 whitespace-nowrap">
                  {{ v.vin.slice(0, 8) }}…{{ v.vin.slice(-4) }}
                </td>
                <td class="px-4 py-3 font-medium text-zinc-100 whitespace-nowrap">{{ v.placa }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <p class="font-medium text-zinc-100">{{ v.marca }} {{ v.modelo }}</p>
                  <p class="text-xs text-zinc-600">{{ v.anio }} · {{ v.color }}</p>
                </td>
                <td class="px-4 py-3 text-zinc-400 max-w-[160px] truncate">
                  {{ v.cliente || '—' }}
                </td>
                <td class="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                  {{ v.fechaRecepcion }}
                  <br />
                  {{ v.horaRecepcion }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="[
                      'text-xs font-medium px-2 py-0.5 rounded-sm',
                      v.improntaCompletada
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'bg-orange-500/10 text-orange-300',
                    ]"
                  >
                    {{ v.improntaCompletada ? '✓ Completada' : 'Pendiente' }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="[
                      'text-xs font-medium px-2 py-0.5 rounded-sm',
                      v.inventarioAprobado
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : v.inventarioCompletado
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'bg-[#0b0e14] text-zinc-500',
                    ]"
                  >
                    {{
                      v.inventarioAprobado
                        ? '✓ Aprobado'
                        : v.inventarioCompletado
                          ? 'En revisión'
                          : 'Pendiente'
                    }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="[
                      'text-xs font-semibold px-2.5 py-1 rounded-sm',
                      estadoMap[v.estado]?.cls || 'bg-[#0b0e14] text-zinc-500',
                    ]"
                  >
                    {{ estadoMap[v.estado]?.label || v.estado }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredVehiculos.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-zinc-600">
                  No se encontraron vehículos para "{{ searchQuery }}"
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══════════ Footer CTA: Descarga Excel ═══════════ -->
      <div
        class="relative overflow-hidden bg-[#10141c] border border-amber-400/30 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="absolute inset-y-0 left-0 w-1 bg-amber-400" />
        <div>
          <h3 class="font-display text-base uppercase tracking-tight text-zinc-100">
            Reporte Completo en Excel
          </h3>
          <p class="text-sm text-zinc-400 mt-1">
            Incluye 7 hojas: Resumen, Pipeline, Vehículos, Marca, Cliente, Eficiencia, Tendencia
          </p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-black rounded-md font-semibold text-sm hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 shrink-0"
          @click="descargarExcel"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"
            />
          </svg>
          Descargar .xlsx
        </button>
      </div>
    </div>
  </ClientOnly>
</template>
