export default defineNuxtConfig({
  compatibilityDate: '2026-02-23',
  srcDir: 'src/',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  app: {
    head: {
      title: 'Sistema IBV - Inventario y Despacho de Vehículos',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Sistema de gestión de inventario y despacho de vehículos en bodegas',
        },
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/logo-ibv.png' }],
    },
  },

  runtimeConfig: {
    // Privado (solo servidor) - Se mapea automáticamente desde NUXT_SUPABASE_URL y NUXT_SUPABASE_SERVICE_KEY
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },

  typescript: {
    shim: false,
    strict: true,
  },

  nitro: {
    preset: 'vercel',
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
})
