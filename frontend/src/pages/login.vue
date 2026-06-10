<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { gsap } from 'gsap'

definePageMeta({ layout: 'blank' })

useHead({
  title: 'Iniciar sesión | Sistema IBV',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
    },
  ],
})

const authStore = useAuthStore()
const router = useRouter()
const rootRef = ref<HTMLElement | null>(null)
let ctx: gsap.Context | null = null

const showPass = ref(false)
const loading = ref(false)
const error = ref('')
const activeDemo = ref(-1)
const selectedPassword = ref('')
const form = ref({ email: '', password: '' })

const features = [
  {
    num: '01',
    tag: 'REC',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    label: 'Registro de impronta con captura fotográfica',
  },
  {
    num: '02',
    tag: 'INV',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Checklist de inventario por categorías',
  },
  {
    num: '03',
    tag: 'DSP',
    icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12v.01M12 4h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z',
    label: 'Despacho por escaneo QR secuencial',
  },
]

const roles = ['Administrador', 'Recibidor', 'Inventario', 'Despachador', 'Portería']

const demoCredentials = [
  {
    email: 'admin1@ibv.com',
    label: 'Administrador',
    code: 'ADM',
    accent: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
    password: 'Admin@2026Secure',
  },
  {
    email: 'recibidor1@ibv.com',
    label: 'Recibidor',
    code: 'REC',
    accent: 'text-sky-300 border-sky-400/40 bg-sky-400/10',
    password: 'Recibidor@2026Secure',
  },
  {
    email: 'inventario1@ibv.com',
    label: 'Inventario',
    code: 'INV',
    accent: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
    password: 'Inventario@2026Secure',
  },
  {
    email: 'despacho1@ibv.com',
    label: 'Despachador',
    code: 'DSP',
    accent: 'text-orange-300 border-orange-400/40 bg-orange-400/10',
    password: 'Despachador@2026Secure',
  },
  {
    email: 'porteria1@ibv.com',
    label: 'Portería',
    code: 'PRT',
    accent: 'text-rose-300 border-rose-400/40 bg-rose-400/10',
    password: 'Porteria@2026Secure',
  },
]

const fillDemo = (demo: (typeof demoCredentials)[0], idx: number) => {
  activeDemo.value = idx
  form.value.email = demo.email
  form.value.password = demo.password
  selectedPassword.value = demo.password
  error.value = ''

  gsap.fromTo(
    '.js-submit-btn',
    { scale: 1 },
    { scale: 1.04, duration: 0.15, yoyo: true, repeat: 1 }
  )
}

const handleLogin = async () => {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try {
    const redirect = await authStore.login(form.value.email, form.value.password)
    await router.push(redirect)
  } catch (e: unknown) {
    error.value = (e as Error).message || 'Credenciales inválidas'
    gsap.fromTo('.js-card-inner', { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  ctx = gsap.context(() => {
    // ─── Left panel timeline ───
    const main = gsap.timeline({ defaults: { ease: 'power4.out' } })
    main
      .fromTo('.js-hero', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 })
      .fromTo(
        '.js-title',
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.7, clearProps: 'y' },
        '-=0.3'
      )
      .fromTo('.js-subtitle', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, '-=0.3')
      .fromTo(
        '.js-stat',
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.5, clearProps: 'y' },
        '-=0.2'
      )
      .fromTo(
        '.js-feature',
        { autoAlpha: 0, x: -20 },
        { autoAlpha: 1, x: 0, stagger: 0.1, duration: 0.5, clearProps: 'x' },
        '-=0.3'
      )
      .fromTo(
        '.js-chip',
        { autoAlpha: 0, scale: 0.7 },
        { autoAlpha: 1, scale: 1, stagger: 0.06, duration: 0.4, clearProps: 'scale' },
        '-=0.3'
      )

    // ─── Right panel timeline ───
    const card = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 })
    card
      .fromTo('.js-back', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
      .fromTo('.js-mobile-logo', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, '<')
      .fromTo(
        '.js-card',
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 0.8, clearProps: 'y' },
        '-=0.2'
      )
      .fromTo(
        '.js-demo',
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, clearProps: 'y' },
        '-=0.4'
      )

    // ─── Floating glows ───
    gsap.utils.toArray<HTMLElement>('.js-orb').forEach((el: HTMLElement, i: number) => {
      gsap.to(el, {
        y: `random(-14, 14)`,
        x: `random(-8, 8)`,
        duration: gsap.utils.random(3, 5),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.4,
      })
    })

    // ─── Shimmer del borde ───
    gsap.to('.js-shimmer', {
      backgroundPosition: '200% center',
      duration: 3,
      ease: 'none',
      repeat: -1,
    })
  }, rootRef.value!)
})

onUnmounted(() => {
  ctx?.revert()
  ctx = null
})
</script>

<template>
  <div
    ref="rootRef"
    class="page-root min-h-screen flex overflow-hidden bg-[#0b0e14] text-zinc-100 selection:bg-amber-400 selection:text-black"
  >
    <!-- ════════ Panel izquierdo — torre de control ════════ -->
    <div
      class="js-hero hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 xl:p-16 bg-[#0d111a] border-r border-white/[0.08] grid-bg"
    >
      <!-- Glows decorativos -->
      <div
        class="js-orb absolute -top-24 -left-24 w-96 h-96 bg-amber-400/[0.05] rounded-full blur-3xl"
      />
      <div
        class="js-orb absolute -bottom-16 right-0 w-[420px] h-[420px] bg-cyan-400/[0.04] rounded-full blur-3xl"
      />
      <div
        class="js-orb absolute top-1/3 left-1/3 w-56 h-56 bg-amber-300/[0.03] rounded-full blur-2xl"
      />

      <!-- Contenido superior -->
      <div class="relative z-10">
        <img
          src="/logo-ibv-mark.png"
          alt="Sistema IBV — Control de patio"
          class="h-28 w-28 -ml-3 drop-shadow-[0_0_12px_rgba(251,191,36,0.25)] mb-10"
        />

        <p class="js-subtitle font-data text-xs text-amber-300 uppercase tracking-[0.3em] mb-5">
          // Acceso operativo
        </p>
        <h1
          class="js-title font-display uppercase text-4xl xl:text-5xl text-white leading-[0.95] tracking-tight"
        >
          El patio,
          <br />
          <span class="text-amber-400">bajo control.</span>
        </h1>
        <p class="js-subtitle mt-5 text-zinc-400 text-base max-w-md leading-relaxed">
          Recepción, inventario y despacho con trazabilidad fotográfica en tiempo real.
        </p>

        <!-- Stats -->
        <div class="flex mt-10 border-y border-white/10 divide-x divide-white/10 max-w-md">
          <div class="js-stat flex-1 py-4 px-4 first:pl-0">
            <p class="font-display text-xl text-white leading-none">100%</p>
            <p class="font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-2">
              Trazabilidad
            </p>
          </div>
          <div class="js-stat flex-1 py-4 px-4">
            <p class="font-display text-xl text-white leading-none">24/7</p>
            <p class="font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-2">
              Operativo
            </p>
          </div>
          <div class="js-stat flex-1 py-4 px-4">
            <p class="font-display text-xl text-white leading-none">05</p>
            <p class="font-data text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-2">
              Módulos
            </p>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="relative z-10 space-y-px bg-white/[0.06] border border-white/[0.08]">
        <div
          v-for="feat in features"
          :key="feat.label"
          class="js-feature group flex items-center gap-4 bg-[#0d111a] px-5 py-4 hover:bg-[#11161f] transition-colors"
        >
          <span
            class="font-data text-xs text-zinc-600 group-hover:text-amber-300/70 transition-colors shrink-0"
          >
            {{ feat.num }}
          </span>
          <div
            class="w-9 h-9 rounded-sm flex items-center justify-center shrink-0 border border-white/10 bg-[#10141c]/[0.03] group-hover:border-amber-400/40 transition-colors"
          >
            <svg
              class="w-5 h-5 text-amber-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="feat.icon"
              />
            </svg>
          </div>
          <span class="flex-1 min-w-0 text-sm text-zinc-300 font-medium">{{ feat.label }}</span>
          <span class="font-data text-[10px] uppercase tracking-[0.2em] text-amber-300/60 shrink-0">
            {{ feat.tag }}
          </span>
        </div>
      </div>

      <!-- Roles + advertencia -->
      <div class="relative z-10 space-y-5">
        <div>
          <p class="font-data text-[10px] uppercase tracking-[0.25em] text-zinc-600 mb-3">
            Roles del sistema
          </p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="rol in roles"
              :key="rol"
              class="js-chip font-data px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-zinc-400 rounded-sm border border-white/10 bg-[#10141c]/[0.03] hover:border-amber-400/40 hover:text-amber-300 transition-colors cursor-default"
            >
              {{ rol }}
            </span>
          </div>
        </div>
        <div class="hazard h-1.5" aria-hidden="true" />
        <p class="font-data text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          Acceso restringido — solo personal autorizado
        </p>
      </div>
    </div>

    <!-- ════════ Panel derecho — formulario ════════ -->
    <div
      class="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 xl:p-16 relative overflow-hidden"
    >
      <div
        class="js-orb absolute top-0 right-0 w-96 h-96 bg-amber-400/[0.04] rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"
      />
      <div
        class="js-orb absolute bottom-0 left-0 w-72 h-72 bg-cyan-400/[0.04] rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"
      />

      <div class="w-full max-w-[440px] mx-auto relative z-10">
        <!-- Botón volver -->
        <button
          class="js-back group inline-flex items-center gap-2 font-data text-[11px] uppercase tracking-[0.2em] text-zinc-500 hover:text-amber-300 mb-8 px-3 py-2 rounded-sm border border-white/[0.08] hover:border-amber-400/40 bg-[#10141c]/[0.02] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]"
          @click="router.push('/')"
        >
          <svg
            class="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-0.5 motion-reduce:transform-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver al inicio
        </button>

        <!-- Logo mobile -->
        <img
          src="/logo-ibv-mark.png"
          alt="Sistema IBV — Control de patio"
          class="js-mobile-logo h-20 w-20 -ml-2 drop-shadow-[0_0_12px_rgba(251,191,36,0.25)] mb-8 lg:hidden"
        />

        <!-- ─── Tarjeta principal ─── -->
        <div class="js-card">
          <div
            class="js-shimmer rounded-lg p-px bg-[length:200%_auto] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
          >
            <div class="js-card-inner plate bg-[#10141c] rounded-[7px] p-8 sm:p-10">
              <!-- Header -->
              <div class="flex items-start justify-between mb-8">
                <div>
                  <p class="font-data text-[10px] text-amber-300 uppercase tracking-[0.3em] mb-3">
                    // Identifícate
                  </p>
                  <h2 class="font-display uppercase text-2xl text-white tracking-wide">
                    Inicio de sesión
                  </h2>
                </div>
                <span class="barcode w-14 h-6 text-zinc-700 mt-1" aria-hidden="true" />
              </div>

              <!-- Error -->
              <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div
                  v-if="error"
                  class="flex items-center gap-3 p-4 mb-6 bg-red-500/[0.08] border border-red-500/30 rounded-md text-red-300 text-sm font-medium"
                >
                  <svg
                    class="w-5 h-5 text-red-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{{ error }}</span>
                </div>
              </Transition>

              <!-- Formulario -->
              <form class="space-y-6" @submit.prevent="handleLogin">
                <!-- Email -->
                <div class="group">
                  <label
                    class="font-data block text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2.5 group-focus-within:text-amber-300 transition-colors"
                  >
                    Correo electrónico
                  </label>
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <svg
                        class="w-5 h-5 text-zinc-600 group-focus-within:text-amber-300 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      v-model="form.email"
                      type="email"
                      required
                      autocomplete="email"
                      placeholder="correo@ibv.com"
                      class="font-data w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-md text-sm text-zinc-100 bg-[#10141c]/[0.03] focus:bg-[#10141c]/[0.05] focus:border-amber-400/70 focus:ring-0 transition-all duration-300 placeholder:text-zinc-600 outline-none"
                    />
                  </div>
                </div>

                <!-- Password -->
                <div class="group">
                  <label
                    class="font-data block text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-2.5 group-focus-within:text-amber-300 transition-colors"
                  >
                    Contraseña
                  </label>
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <svg
                        class="w-5 h-5 text-zinc-600 group-focus-within:text-amber-300 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      v-model="form.password"
                      :type="showPass ? 'text' : 'password'"
                      required
                      autocomplete="current-password"
                      placeholder="••••••••"
                      class="font-data w-full pl-12 pr-14 py-3.5 border border-white/10 rounded-md text-sm text-zinc-100 bg-[#10141c]/[0.03] focus:bg-[#10141c]/[0.05] focus:border-amber-400/70 focus:ring-0 transition-all duration-300 placeholder:text-zinc-600 outline-none"
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-600 hover:text-amber-300 transition-colors focus:outline-none focus-visible:text-amber-300"
                      :aria-label="showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                      @click="showPass = !showPass"
                    >
                      <svg
                        v-if="!showPass"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Submit -->
                <button
                  type="submit"
                  :disabled="loading"
                  class="js-submit-btn font-display w-full flex items-center justify-center gap-2.5 py-4 bg-amber-400 hover:bg-amber-300 text-black uppercase text-sm tracking-[0.1em] rounded-md transition-all duration-300 shadow-[0_0_32px_rgba(251,191,36,0.2)] hover:shadow-[0_0_48px_rgba(251,191,36,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed motion-reduce:transform-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10141c]"
                >
                  <svg v-if="loading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  {{ loading ? 'Verificando...' : 'Ingresar al sistema' }}
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- ─── Credenciales demo ─── -->
        <div class="js-demo mt-8">
          <p
            class="font-data text-[10px] text-zinc-600 uppercase tracking-[0.3em] mb-3 text-center"
          >
            // Acceso rápido de prueba
          </p>
          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="(demo, idx) in demoCredentials"
              :key="demo.email"
              type="button"
              class="flex items-center gap-3.5 px-3.5 py-2.5 rounded-md border transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]"
              :class="
                activeDemo === idx
                  ? 'border-amber-400/50 bg-amber-400/[0.06]'
                  : 'border-white/[0.08] bg-[#10141c]/[0.02] hover:border-white/20 hover:bg-[#10141c]/[0.04]'
              "
              @click="fillDemo(demo, idx)"
            >
              <span
                class="font-data w-11 py-1 rounded-sm border text-[10px] font-semibold text-center shrink-0"
                :class="demo.accent"
              >
                {{ demo.code }}
              </span>
              <div class="flex-1 text-left min-w-0">
                <p
                  class="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors"
                >
                  {{ demo.label }}
                </p>
                <p class="font-data text-[10px] text-zinc-600 truncate">{{ demo.email }}</p>
              </div>
              <svg
                class="w-4 h-4 shrink-0 transition-colors"
                :class="
                  activeDemo === idx ? 'text-amber-300' : 'text-zinc-700 group-hover:text-zinc-400'
                "
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <p
            class="font-data text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-[0.15em]"
          >
            Contraseña:
            <code
              class="px-2 py-1 bg-[#10141c]/[0.04] border border-white/10 rounded-sm text-[10px] text-amber-300 normal-case tracking-normal"
            >
              {{ selectedPassword || 'Selecciona un rol' }}
            </code>
          </p>
        </div>
      </div>
    </div>
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
    #0d111a 12px 24px
  );
}

/* Esquinas tipo placa */
.plate {
  position: relative;
}

.plate::before,
.plate::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  z-index: 1;
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

/* Estado inicial antes de que GSAP cargue — evita flash de contenido */
.js-hero,
.js-title,
.js-subtitle,
.js-stat,
.js-feature,
.js-chip,
.js-card,
.js-back,
.js-demo,
.js-mobile-logo {
  visibility: hidden;
  opacity: 0;
}
</style>
