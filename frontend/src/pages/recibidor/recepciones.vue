<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContenedorStore, type VehiculoContenedor } from '~/stores/contenedorStore'

definePageMeta({ layout: 'admin' })

const contStore = useContenedorStore()

const search = ref('')
const filterEstado = ref('')

const filteredContenedores = computed(() => {
  let result = [...contStore.contenedores]
  if (filterEstado.value) result = result.filter((c) => c.estado === filterEstado.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (c) =>
        c.codigo.toLowerCase().includes(q) ||
        c.origen.toLowerCase().includes(q) ||
        c.transportista.toLowerCase().includes(q) ||
        c.placaCamion.toLowerCase().includes(q) ||
        c.vehiculos.some(
          (v: VehiculoContenedor) =>
            v.vin.toLowerCase().includes(q) ||
            (v.marca || '').toLowerCase().includes(q) ||
            v.modelo.toLowerCase().includes(q)
        )
    )
  }
  return result.sort((a, b) => {
    // completados primero por fecha desc, luego pendientes
    if (a.estado === 'completado' && b.estado !== 'completado') return -1
    if (a.estado !== 'completado' && b.estado === 'completado') return 1
    return b.fechaLlegada.localeCompare(a.fechaLlegada)
  })
})

const estadoBadge = (e: string) =>
  ({
    pendiente: 'bg-sky-500/10 text-sky-300',
    en_recepcion: 'bg-amber-400/10 text-amber-300',
    completado: 'bg-emerald-500/10 text-emerald-300',
  })[e] || 'bg-[#0b0e14] text-zinc-500'

const estadoLabel = (e: string) =>
  ({
    pendiente: 'Pendiente',
    en_recepcion: 'En Recepción',
    completado: 'Completado',
  })[e] || e

const expandedId = ref<string | null>(null)
const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const formatDate = (d: string) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  const months = [
    '',
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]
  return `${day} ${months[parseInt(m)]} ${y}`
}

const imprimirRecepcion = (contId: string) => {
  const cont = contStore.getById(contId)
  if (!cont) return
  const fecha = new Date().toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const hora = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
  const escaneados = cont.vehiculos.filter((v: VehiculoContenedor) => v.escaneado).length

  const vehiculosHTML = cont.vehiculos
    .map(
      (v: VehiculoContenedor, i: number) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:8px 12px;text-align:center;font-weight:600;">${i + 1}</td>
        <td style="padding:8px 12px;font-family:monospace;font-size:11px;">${v.vin}</td>
        <td style="padding:8px 12px;font-weight:600;">${v.marca || ''} ${v.modelo}</td>
        <td style="padding:8px 12px;text-align:center;">${v.anio || ''}</td>
        <td style="padding:8px 12px;">${v.color || ''}</td>
        <td style="padding:8px 12px;text-align:center;font-family:monospace;font-size:11px;">${v.codigoImpronta}</td>
        <td style="padding:8px 12px;text-align:center;">
          <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;${v.escaneado ? 'background:#dcfce7;color:#15803d;' : 'background:#fef9c3;color:#a16207;'}">
            ${v.escaneado ? '✓ Escaneado' : 'Pendiente'}
          </span>
        </td>
      </tr>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8"/>
      <title>Recepción - ${cont.codigo}</title>
      <style>
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 24px; color: #1f2937; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #d97706; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { font-size: 22px; font-weight: 800; color: #d97706; }
        .logo span { color: #64748b; font-weight: 400; font-size: 13px; display: block; }
        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
        .info-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700; }
        .info-box .value { font-size: 15px; font-weight: 700; color: #1e293b; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead { background: #f1f5f9; }
        th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #64748b; font-weight: 700; }
        .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .summary { display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 12px 16px; margin-top: 16px; }
        .obs { margin-top: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
        .sign-line { margin-top: 48px; display: flex; gap: 64px; }
        .sign-line div { flex: 1; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div><div class="logo">Sistema IBV <span>Gestión de Vehículos</span></div></div>
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:800;">RESUMEN DE RECEPCIÓN</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${fecha} — ${hora}</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-box"><div class="label">Contenedor</div><div class="value" style="font-family:monospace;">${cont.codigo}</div></div>
        <div class="info-box"><div class="label">Origen</div><div class="value" style="font-size:13px;">${cont.origen}</div></div>
        <div class="info-box"><div class="label">Transportista</div><div class="value" style="font-size:13px;">${cont.transportista}</div></div>
        <div class="info-box"><div class="label">Placa Camión</div><div class="value" style="font-family:monospace;">${cont.placaCamion}</div></div>
        <div class="info-box"><div class="label">Fecha Llegada</div><div class="value">${cont.fechaLlegada}</div></div>
        <div class="info-box"><div class="label">Hora Llegada</div><div class="value">${cont.horaLlegada}</div></div>
        <div class="info-box"><div class="label">Vehículos</div><div class="value">${cont.vehiculosEsperados}</div></div>
        <div class="info-box"><div class="label">Recibido Por</div><div class="value" style="font-size:13px;">${cont.recibidoPor || '—'}</div></div>
      </div>
      <h3 style="font-size:14px;margin:0 0 8px;color:#334155;">Detalle de Vehículos</h3>
      <table>
        <thead><tr><th>#</th><th>VIN</th><th>Vehículo</th><th>Año</th><th>Color</th><th>Código Impronta</th><th>Estado</th></tr></thead>
        <tbody>${vehiculosHTML}</tbody>
      </table>
      <div class="summary">
        <div><strong>${escaneados}</strong> de <strong>${cont.vehiculosEsperados}</strong> vehículos escaneados</div>
        <span class="badge" style="${escaneados === cont.vehiculosEsperados ? 'background:#dcfce7;color:#15803d;' : 'background:#fef9c3;color:#a16207;'}">
          ${escaneados === cont.vehiculosEsperados ? 'RECEPCIÓN COMPLETA' : 'RECEPCIÓN PARCIAL'}
        </span>
      </div>
      ${cont.observaciones ? `<div class="obs"><strong style="font-size:12px;color:#92400e;">Observaciones:</strong><p style="margin:4px 0 0;font-size:13px;">${cont.observaciones}</p></div>` : ''}
      <div class="sign-line"><div>Firma Recibidor</div><div>Firma Transportista</div><div>Firma Supervisor</div></div>
      <div class="footer"><span>Sistema IBV — Documento generado automáticamente</span><span>${fecha} ${hora}</span></div>
      ${'<scr' + 'ipt>window.onload = function() { window.print(); }<' + '/script>'}
    </body>
    </html>
  `
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div class="flex items-center gap-3">
        <NuxtLink
          to="/recibidor"
          class="p-2 text-zinc-500 hover:text-zinc-400 hover:bg-[#0b0e14] rounded-md transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </NuxtLink>
        <div>
          <p class="font-data text-[10px] uppercase tracking-[0.25em] text-amber-300 mb-1.5">
            REC — Módulo Recepción
          </p>
          <h1 class="font-display text-xl sm:text-2xl uppercase tracking-tight text-zinc-100">
            Recepciones Realizadas
          </h1>
          <p class="text-zinc-500 mt-1">
            Historial de contenedores recibidos y su detalle completo
          </p>
        </div>
      </div>
      <NuxtLink
        to="/recibidor/escaneo"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-black font-semibold rounded-md hover:bg-amber-300 transition shadow-lg shadow-amber-500/20 self-start sm:self-auto"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Nueva Recepción
      </NuxtLink>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="bg-[#10141c] rounded-md p-4 border border-white/[0.06] shadow-sm">
        <p class="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Total</p>
        <p class="font-display text-xl uppercase tracking-tight text-zinc-100 mt-1">
          {{ contStore.totalContenedores }}
        </p>
      </div>
      <div class="bg-[#10141c] rounded-md p-4 border border-white/[0.06] shadow-sm">
        <p class="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Pendientes</p>
        <p class="font-data text-2xl font-bold text-amber-300 mt-1">{{ contStore.pendientes }}</p>
      </div>
      <div class="bg-[#10141c] rounded-md p-4 border border-white/[0.06] shadow-sm">
        <p class="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">En Recepción</p>
        <p class="font-data text-2xl font-bold text-sky-300 mt-1">{{ contStore.enRecepcion }}</p>
      </div>
      <div class="bg-[#10141c] rounded-md p-4 border border-white/[0.06] shadow-sm">
        <p class="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
          Completados
        </p>
        <p class="font-data text-2xl font-bold text-emerald-300 mt-1">
          {{ contStore.completados }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-[#10141c] rounded-lg border border-white/[0.08] p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
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
            v-model="search"
            type="text"
            placeholder="Buscar por código, origen, VIN, marca..."
            class="w-full pl-10 pr-4 py-2.5 border border-white/[0.08] rounded-md text-sm focus:outline-none focus:border-amber-400/70"
          />
        </div>
        <select
          v-model="filterEstado"
          class="px-4 py-2.5 border border-white/[0.08] rounded-lg text-sm bg-[#10141c] focus:outline-none focus:border-amber-400/70"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_recepcion">En Recepción</option>
          <option value="completado">Completado</option>
        </select>
      </div>
    </div>

    <!-- Contenedores list -->
    <div class="space-y-4">
      <div
        v-for="cont in filteredContenedores"
        :key="cont.id"
        class="bg-[#10141c] rounded-lg shadow-sm border border-white/[0.06] overflow-hidden transition hover:shadow-md"
      >
        <!-- Header row -->
        <button class="w-full flex items-center gap-4 p-5 text-left" @click="toggleExpand(cont.id)">
          <div
            :class="[
              'w-12 h-12 rounded-md flex items-center justify-center shrink-0',
              cont.estado === 'completado'
                ? 'bg-emerald-500/15'
                : cont.estado === 'en_recepcion'
                  ? 'bg-amber-400/15'
                  : 'bg-sky-500/15',
            ]"
          >
            <svg
              v-if="cont.estado === 'completado'"
              class="w-6 h-6 text-emerald-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              v-else
              class="w-6 h-6"
              :class="cont.estado === 'en_recepcion' ? 'text-amber-300' : 'text-sky-300'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <p class="text-sm font-bold text-zinc-100 font-data">{{ cont.codigo }}</p>
              <span
                :class="[
                  'text-xs font-semibold px-2.5 py-0.5 rounded-sm',
                  estadoBadge(cont.estado),
                ]"
              >
                {{ estadoLabel(cont.estado) }}
              </span>
            </div>
            <p class="text-xs text-zinc-500 mt-0.5">{{ cont.origen }} · {{ cont.transportista }}</p>
          </div>
          <div class="text-right shrink-0 hidden sm:block">
            <p class="text-sm font-bold text-zinc-100">{{ cont.vehiculosEsperados }} vehículos</p>
            <p class="text-xs text-zinc-500">
              {{ formatDate(cont.fechaLlegada) }} · {{ cont.horaLlegada }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="cont.estado === 'completado'"
              class="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-[#0b0e14] rounded-lg transition"
              title="Imprimir resumen"
              @click.stop="imprimirRecepcion(cont.id)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
            </button>
            <svg
              class="w-5 h-5 text-zinc-500 transition-transform"
              :class="expandedId === cont.id ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        <!-- Expanded detail -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[600px]"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 max-h-[600px]"
          leave-to-class="opacity-0 max-h-0"
        >
          <div v-if="expandedId === cont.id" class="border-t border-white/[0.06] overflow-hidden">
            <!-- Info grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-[#0d111a]/50">
              <div>
                <p class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Placa Camión
                </p>
                <p class="text-sm font-bold text-zinc-100 font-data">{{ cont.placaCamion }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Recibido Por
                </p>
                <p class="text-sm font-bold text-zinc-100">{{ cont.recibidoPor || '—' }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Escaneados
                </p>
                <p class="text-sm font-bold text-emerald-300">
                  {{ cont.vehiculos.filter((v: any) => v.escaneado).length }} /
                  {{ cont.vehiculosEsperados }}
                </p>
              </div>
              <div v-if="cont.observaciones">
                <p class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Observaciones
                </p>
                <p class="text-sm text-zinc-200">{{ cont.observaciones }}</p>
              </div>
            </div>

            <!-- Vehicles table -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-[#0d111a] border-b border-white/[0.06]">
                    <th
                      class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                    >
                      #
                    </th>
                    <th
                      class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                    >
                      VIN
                    </th>
                    <th
                      class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                    >
                      Vehículo
                    </th>
                    <th
                      class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                    >
                      Color
                    </th>
                    <th
                      class="px-4 py-2.5 text-left font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                    >
                      Código Impronta
                    </th>
                    <th
                      class="px-4 py-2.5 text-center font-data text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em]"
                    >
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/[0.04]">
                  <tr
                    v-for="(veh, idx) in cont.vehiculos"
                    :key="veh.vin"
                    class="hover:bg-[#0d111a]/80"
                  >
                    <td class="px-4 py-3 font-semibold text-zinc-500">{{ idx + 1 }}</td>
                    <td class="px-4 py-3 font-data text-xs text-zinc-400">
                      {{ veh.vin.slice(0, 8) }}…{{ veh.vin.slice(-4) }}
                    </td>
                    <td class="px-4 py-3 font-semibold text-zinc-100">
                      {{ veh.marca }} {{ veh.modelo }} {{ veh.anio }}
                    </td>
                    <td class="px-4 py-3 text-zinc-400">{{ veh.color }}</td>
                    <td class="px-4 py-3 font-data text-xs text-zinc-500">
                      {{ veh.codigoImpronta }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        :class="[
                          'text-xs font-semibold px-2.5 py-1 rounded-sm',
                          veh.escaneado
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-[#0b0e14] text-zinc-500',
                        ]"
                      >
                        {{ veh.escaneado ? '✓ Escaneado' : 'Pendiente' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Empty state -->
      <div
        v-if="filteredContenedores.length === 0"
        class="bg-[#10141c] rounded-lg shadow-sm border border-white/[0.06] p-12 text-center"
      >
        <svg
          class="w-16 h-16 text-zinc-600 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p class="text-zinc-500 font-medium">No se encontraron recepciones</p>
        <p class="text-zinc-500 text-sm mt-1">Ajusta los filtros o inicia una nueva recepción</p>
      </div>
    </div>
  </div>
</template>
