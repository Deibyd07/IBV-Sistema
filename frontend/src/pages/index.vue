<script setup lang="ts">
definePageMeta({
  layout: 'blank',
})

const currentYear = new Date().getFullYear()

useHead({
  title: 'Sistema IBV | Control de Patio Vehicular',
  meta: [
    {
      name: 'description',
      content:
        'Torre de control para el patio vehicular: recepción, impronta, inventario y despacho con trazabilidad total y operación en tiempo real.',
    },
    { property: 'og:title', content: 'Sistema IBV | Control de Patio Vehicular' },
    {
      property: 'og:description',
      content:
        'Gestiona el flujo completo: recepción, impronta, inventario y despacho con trazabilidad completa.',
    },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
    },
  ],
})

const modules = [
  {
    num: '01',
    code: 'REC',
    name: 'Recepción',
    desc: 'Registro del vehículo al arribo: datos esenciales, documentos y entrada al patio en minutos.',
  },
  {
    num: '02',
    code: 'IMP',
    name: 'Impronta',
    desc: 'Captura fotográfica del estado real de la unidad. Evidencia visual que respalda cada movimiento.',
  },
  {
    num: '03',
    code: 'INV',
    name: 'Inventario',
    desc: 'Checklist digital de equipamiento por categorías. Verificación exhaustiva, sin papel.',
  },
  {
    num: '04',
    code: 'DSP',
    name: 'Despacho',
    desc: 'Lotes, transportistas y salida del patio validada por escaneo QR secuencial.',
  },
]

const manifest = [
  {
    hora: '07:42',
    unidad: 'HILUX 2.8 SRV',
    etapa: 'REC',
    estado: 'EN PROCESO',
    badge: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
  },
  {
    hora: '08:15',
    unidad: 'ONIX TURBO RS',
    etapa: 'IMP',
    estado: 'COMPLETO',
    badge: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  },
  {
    hora: '09:03',
    unidad: 'DUSTER ZEN 4X2',
    etapa: 'INV',
    estado: 'COMPLETO',
    badge: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
  },
  {
    hora: '09:47',
    unidad: 'RANGER XLT 3.2',
    etapa: 'DSP',
    estado: 'EN RUTA',
    badge: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10',
  },
  {
    hora: '10:12',
    unidad: 'COROLLA SE-G',
    etapa: 'REC',
    estado: 'EN COLA',
    badge: 'text-zinc-300 border-zinc-500/40 bg-zinc-500/10',
  },
]

const stats = [
  { value: '100%', label: 'Trazabilidad' },
  { value: '24/7', label: 'Operación' },
  { value: '05', label: 'Módulos' },
  { value: 'QR', label: 'Validación' },
]

const specs = [
  {
    id: 'S-01',
    name: 'Seguridad por roles',
    desc: 'Permisos granulares por nivel: administrador, recibidor, inventario, despachador y portería.',
  },
  {
    id: 'S-02',
    name: 'Reportes en tiempo real',
    desc: 'Dashboards con métricas y KPIs operativos actualizados al instante, sin recargar.',
  },
  {
    id: 'S-03',
    name: 'Operación móvil',
    desc: 'Diseño responsive y escaneo QR desde cualquier dispositivo dentro del patio.',
  },
]

const ticker = [
  'Recepción',
  'Impronta',
  'Inventario',
  'Despacho',
  'Trazabilidad total',
  'Operación 24/7',
  'Escaneo QR',
  'Control de portería',
]
</script>

<template>
  <div
    class="page-root min-h-screen bg-[#0b0e14] text-zinc-100 overflow-x-hidden selection:bg-amber-400 selection:text-black"
  >
    <!-- ════════ Navbar ════════ -->
    <nav class="sticky top-0 z-40 bg-[#0b0e14]/85 backdrop-blur-lg border-b border-white/[0.08]">
      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div class="flex justify-between items-center h-16">
          <!-- Logo plate -->
          <div class="flex items-center gap-3">
            <img
              src="/logo-ibv-mark.png"
              alt="Sistema IBV"
              class="h-16 w-16 -ml-2 drop-shadow-[0_0_12px_rgba(251,191,36,0.25)]"
            />
            <p
              class="hidden sm:block font-data text-[10px] uppercase tracking-[0.25em] text-zinc-500"
            >
              Control de patio
            </p>
          </div>

          <!-- Estado + CTA -->
          <div class="flex items-center gap-3 sm:gap-5">
            <div
              class="hidden sm:flex items-center gap-2 font-data text-[11px] uppercase tracking-[0.2em] text-emerald-300"
            >
              <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-blink" />
              En línea
            </div>
            <NuxtLink
              to="/login"
              class="font-data px-4 sm:px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs uppercase tracking-[0.15em] rounded-md transition-all shadow-[0_0_24px_rgba(251,191,36,0.2)] hover:shadow-[0_0_32px_rgba(251,191,36,0.35)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14] motion-reduce:transform-none"
            >
              Iniciar sesión
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- ════════ Hero ════════ -->
    <section class="relative overflow-hidden grid-bg">
      <!-- Glows -->
      <div class="absolute inset-0 -z-10 pointer-events-none">
        <div
          class="absolute -top-32 -right-32 w-[480px] h-[480px] bg-amber-400/[0.05] rounded-full blur-3xl"
        />
        <div
          class="absolute bottom-0 -left-32 w-[420px] h-[420px] bg-cyan-400/[0.04] rounded-full blur-3xl"
        />
      </div>

      <div
        class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-14 pb-16 sm:pt-20 sm:pb-20 lg:min-h-[calc(100vh-4rem)] lg:flex lg:items-center"
      >
        <div class="grid lg:grid-cols-12 gap-12 lg:gap-10 xl:gap-16 items-center w-full">
          <!-- Contenido -->
          <div class="lg:col-span-7 space-y-7 sm:space-y-9">
            <p
              class="rise d-1 font-data text-xs sm:text-sm text-amber-300 uppercase tracking-[0.3em]"
            >
              // Gestión vehicular integral
            </p>

            <h1
              class="rise d-2 font-display uppercase text-4xl sm:text-6xl lg:text-6xl xl:text-7xl leading-[0.95] tracking-tight"
            >
              <span class="block text-white">Cada vehículo.</span>
              <span class="block text-white">Cada etapa.</span>
              <span class="block text-amber-400">Bajo control.</span>
            </h1>

            <p class="rise d-3 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
              Sistema IBV opera el flujo completo del patio — desde la recepción hasta el despacho —
              con evidencia fotográfica, checklist digital y validación por QR en cada punto.
            </p>

            <div class="rise d-4 flex flex-col sm:flex-row gap-4">
              <NuxtLink
                to="/login"
                class="group inline-flex items-center justify-center gap-3 px-7 py-4 bg-amber-400 hover:bg-amber-300 text-black font-display uppercase text-sm tracking-[0.1em] rounded-md transition-all shadow-[0_0_32px_rgba(251,191,36,0.25)] hover:shadow-[0_0_48px_rgba(251,191,36,0.4)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14] motion-reduce:transform-none"
              >
                Acceder al sistema
                <svg
                  class="w-5 h-5 group-hover:translate-x-1 transition-transform motion-reduce:transform-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </NuxtLink>
              <a
                href="#modulos"
                class="inline-flex items-center justify-center gap-2 px-7 py-4 border border-white/15 hover:border-amber-400/60 text-zinc-300 hover:text-amber-300 font-data uppercase text-xs tracking-[0.2em] rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]"
              >
                Ver flujo operativo
              </a>
            </div>

            <!-- Stats -->
            <div
              class="rise d-5 grid grid-cols-2 sm:grid-cols-4 border-y border-white/10 divide-x divide-white/10 max-w-2xl"
            >
              <div v-for="stat in stats" :key="stat.label" class="py-5 px-4 first:pl-0">
                <div class="font-display text-2xl sm:text-3xl text-white">{{ stat.value }}</div>
                <div class="font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1.5">
                  {{ stat.label }}
                </div>
              </div>
            </div>
          </div>

          <!-- Manifiesto de patio -->
          <div class="lg:col-span-5 rise d-4 hidden md:block">
            <div
              class="plate bg-[#10141c] border border-white/10 rounded-lg shadow-2xl shadow-black/50"
            >
              <!-- Header del tablero -->
              <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div class="flex items-center gap-3">
                  <span class="w-2 h-2 bg-emerald-400 rounded-full animate-blink" />
                  <span class="font-data text-[11px] uppercase tracking-[0.25em] text-zinc-300">
                    Manifiesto de patio
                  </span>
                </div>
                <span class="barcode w-16 h-5 text-zinc-600" aria-hidden="true" />
              </div>

              <!-- Filas -->
              <div class="divide-y divide-white/[0.06]">
                <div
                  v-for="row in manifest"
                  :key="row.hora"
                  class="flex items-center gap-4 px-5 py-3.5 hover:bg-[#10141c]/[0.03] transition-colors"
                >
                  <span class="font-data text-xs text-zinc-500 w-12 shrink-0">{{ row.hora }}</span>
                  <span class="font-data text-xs text-zinc-200 flex-1 truncate uppercase">
                    {{ row.unidad }}
                  </span>
                  <span class="font-data text-[10px] text-amber-300/80 w-8 shrink-0">
                    {{ row.etapa }}
                  </span>
                  <span
                    class="font-data text-[10px] uppercase tracking-wider px-2 py-1 rounded-sm border shrink-0"
                    :class="row.badge"
                  >
                    {{ row.estado }}
                  </span>
                </div>
              </div>

              <!-- Footer del tablero -->
              <div
                class="flex items-center justify-between px-5 py-4 border-t border-white/10 font-data text-[11px] uppercase tracking-[0.15em]"
              >
                <span class="text-zinc-500">142 unidades en patio</span>
                <span class="text-amber-300">8 listas para despacho</span>
              </div>
            </div>
            <p
              class="font-data text-[10px] uppercase tracking-[0.25em] text-zinc-600 mt-4 text-right"
            >
              Actualización en tiempo real — IBV/OPS
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════ Cinta transportadora ════════ -->
    <div class="border-y border-white/10 bg-[#0d111a] overflow-hidden" aria-hidden="true">
      <div class="hazard h-1.5" />
      <div class="relative flex overflow-hidden py-4">
        <div class="animate-marquee flex w-max shrink-0 items-center">
          <template v-for="n in 2" :key="n">
            <span
              v-for="item in ticker"
              :key="`${n}-${item}`"
              class="flex items-center font-data text-xs uppercase tracking-[0.3em] text-zinc-500 whitespace-nowrap"
            >
              <span class="px-6">{{ item }}</span>
              <span class="text-amber-400/60">◆</span>
            </span>
          </template>
        </div>
      </div>
      <div class="hazard h-1.5" />
    </div>

    <!-- ════════ Flujo operativo ════════ -->
    <section id="modulos" class="py-20 sm:py-28 scroll-mt-16">
      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p class="font-data text-xs text-amber-300 uppercase tracking-[0.3em] mb-4">
              // Flujo operativo
            </p>
            <h2 class="font-display uppercase text-3xl sm:text-5xl text-white leading-tight">
              Cuatro etapas.
              <br />
              <span class="text-zinc-500">Una sola línea.</span>
            </h2>
          </div>
          <p class="font-data text-[11px] uppercase tracking-[0.2em] text-zinc-500 sm:text-right">
            Entrada → Salida
            <br />
            Sin puntos ciegos
          </p>
        </div>

        <div
          class="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#10141c]/10 border border-white/10"
        >
          <div
            v-for="mod in modules"
            :key="mod.code"
            class="group relative bg-[#0b0e14] p-7 sm:p-8 hover:bg-[#10141c] transition-colors overflow-hidden"
          >
            <span
              class="absolute -top-3 -right-2 font-display text-[5.5rem] leading-none text-white/[0.04] group-hover:text-amber-400/[0.07] transition-colors select-none"
              aria-hidden="true"
            >
              {{ mod.num }}
            </span>

            <div class="relative">
              <div class="flex items-center gap-3 mb-6">
                <span
                  class="font-data text-[10px] uppercase tracking-[0.2em] text-amber-300 border border-amber-400/30 bg-amber-400/[0.06] px-2 py-1 rounded-sm"
                >
                  {{ mod.code }}
                </span>
                <span
                  class="h-px flex-1 bg-[#10141c]/10 group-hover:bg-amber-400/40 transition-colors"
                />
              </div>
              <h3 class="font-display uppercase text-xl text-white mb-3 tracking-wide">
                {{ mod.name }}
              </h3>
              <p class="text-sm text-zinc-400 leading-relaxed">{{ mod.desc }}</p>
            </div>
          </div>
        </div>

        <!-- Ficha técnica -->
        <div class="mt-20 sm:mt-24">
          <p class="font-data text-xs text-amber-300 uppercase tracking-[0.3em] mb-2">
            // Ficha técnica
          </p>
          <div class="border-t border-white/10">
            <div
              v-for="spec in specs"
              :key="spec.id"
              class="group grid sm:grid-cols-12 gap-2 sm:gap-6 items-baseline py-6 sm:py-7 border-b border-white/10 hover:bg-[#10141c]/[0.02] transition-colors sm:px-2"
            >
              <span class="sm:col-span-1 font-data text-xs text-amber-300/70">{{ spec.id }}</span>
              <h3
                class="sm:col-span-4 font-display uppercase text-lg sm:text-xl text-white tracking-wide"
              >
                {{ spec.name }}
              </h3>
              <p class="sm:col-span-6 text-sm text-zinc-400 leading-relaxed">{{ spec.desc }}</p>
              <span
                class="hidden sm:block sm:col-span-1 text-right font-data text-zinc-600 group-hover:text-amber-300 transition-colors"
                aria-hidden="true"
              >
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════ CTA final ════════ -->
    <section class="relative border-y border-white/10 bg-[#0d111a] overflow-hidden">
      <div class="hazard h-1.5 absolute top-0 inset-x-0" aria-hidden="true" />
      <div
        class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-20 sm:py-24 text-center grid-bg"
      >
        <p class="font-data text-xs text-amber-300 uppercase tracking-[0.3em] mb-5">
          // Acceso operativo
        </p>
        <h2
          class="font-display uppercase text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.05] mb-8"
        >
          El patio no espera.
          <br />
          <span class="text-amber-400">Toma el control.</span>
        </h2>
        <NuxtLink
          to="/login"
          class="group inline-flex items-center gap-3 px-8 py-4 bg-amber-400 hover:bg-amber-300 text-black font-display uppercase text-sm tracking-[0.1em] rounded-md transition-all shadow-[0_0_32px_rgba(251,191,36,0.25)] hover:shadow-[0_0_48px_rgba(251,191,36,0.4)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d111a] motion-reduce:transform-none"
        >
          Iniciar sesión
          <svg
            class="w-5 h-5 group-hover:translate-x-1 transition-transform motion-reduce:transform-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </NuxtLink>
      </div>
      <div class="hazard h-1.5 absolute bottom-0 inset-x-0" aria-hidden="true" />
    </section>

    <!-- ════════ Footer ════════ -->
    <footer class="relative overflow-hidden">
      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div
          class="py-12 sm:py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 border-b border-white/[0.06]"
        >
          <div class="space-y-4">
            <img
              src="/logo-ibv-mark.png"
              alt="Sistema IBV — Control de patio"
              class="h-28 w-28 -ml-3"
            />
            <p class="text-sm text-zinc-500 leading-relaxed max-w-sm">
              Recepción, impronta, inventario y despacho con trazabilidad completa y operación en
              tiempo real.
            </p>
          </div>

          <div>
            <h3 class="font-data text-[11px] uppercase tracking-[0.25em] text-amber-300/80 mb-5">
              Módulos
            </h3>
            <ul class="space-y-3 font-data text-xs uppercase tracking-[0.15em] text-zinc-500">
              <li v-for="mod in modules" :key="mod.code">
                <span class="text-zinc-700 mr-2">{{ mod.num }}</span>
                {{ mod.name }}
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-data text-[11px] uppercase tracking-[0.25em] text-amber-300/80 mb-5">
              Soporte
            </h3>
            <ul class="space-y-3 font-data text-xs uppercase tracking-[0.15em]">
              <li>
                <a
                  href="mailto:soporte@sistemaibv.com"
                  class="text-zinc-500 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14] rounded-sm normal-case tracking-normal"
                >
                  soporte@sistemaibv.com
                </a>
              </li>
              <li class="text-zinc-500">Operativo 24/7</li>
            </ul>
          </div>

          <div>
            <h3 class="font-data text-[11px] uppercase tracking-[0.25em] text-amber-300/80 mb-5">
              Acceso
            </h3>
            <ul class="space-y-3 font-data text-xs uppercase tracking-[0.15em]">
              <li>
                <NuxtLink
                  to="/"
                  class="text-zinc-500 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14] rounded-sm"
                >
                  Inicio
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/login"
                  class="text-zinc-500 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14] rounded-sm"
                >
                  Iniciar sesión
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <div class="py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p class="font-data text-[11px] uppercase tracking-[0.15em] text-zinc-600">
            © {{ currentYear }} Sistema IBV — Todos los derechos reservados
          </p>
          <p class="font-data text-[11px] uppercase tracking-[0.25em] text-zinc-700">
            IBV/OPS · v2
          </p>
        </div>
      </div>

      <!-- Palabra gigante -->
      <div
        class="pointer-events-none select-none overflow-hidden -mb-6 sm:-mb-10"
        aria-hidden="true"
      >
        <p
          class="font-display uppercase whitespace-nowrap text-[19vw] leading-[0.8] text-center text-outline"
        >
          Sistema IBV
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.page-root {
  font-family: 'Archivo', system-ui, sans-serif;
}

.font-display {
  font-family: 'Archivo Black', 'Archivo', system-ui, sans-serif;
  font-weight: 400;
}

.font-data {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
}

/* Rejilla blueprint */
.grid-bg {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 48px 48px;
}

/* Franja de peligro */
.hazard {
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(251, 191, 36, 0.85) 0 12px,
    #0b0e14 12px 24px
  );
}

/* Esquinas tipo placa */
.plate::before,
.plate::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: #fbbf24;
  z-index: 1;
}

.plate {
  position: relative;
}

.plate::before {
  top: -1px;
  left: -1px;
  border-top: 2px solid #fbbf24;
  border-left: 2px solid #fbbf24;
}

.plate::after {
  bottom: -1px;
  right: -1px;
  border-bottom: 2px solid #fbbf24;
  border-right: 2px solid #fbbf24;
}

/* Código de barras decorativo */
.barcode {
  display: inline-block;
  background-image: repeating-linear-gradient(
    90deg,
    currentColor 0 2px,
    transparent 2px 4px,
    currentColor 4px 5px,
    transparent 5px 9px,
    currentColor 9px 12px,
    transparent 12px 14px
  );
}

/* Texto delineado */
.text-outline {
  color: transparent;
  -webkit-text-stroke: 1px rgba(251, 191, 36, 0.14);
}

/* Animaciones */
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.rise {
  animation: rise 0.7s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}

.d-1 {
  animation-delay: 0.05s;
}
.d-2 {
  animation-delay: 0.15s;
}
.d-3 {
  animation-delay: 0.25s;
}
.d-4 {
  animation-delay: 0.35s;
}
.d-5 {
  animation-delay: 0.45s;
}

@keyframes marquee {
  to {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  animation: marquee 32s linear infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}

.animate-blink {
  animation: blink 1.6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .rise {
    animation: none;
  }
  .animate-marquee,
  .animate-blink {
    animation: none;
  }
}
</style>
