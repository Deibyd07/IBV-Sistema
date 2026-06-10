import { createClient } from '@supabase/supabase-js'

let supabase: ReturnType<typeof createClient>

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const supabaseUrl = config.public.supabaseUrl
  const supabaseAnonKey = config.public.supabaseAnonKey

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase Plugin] URL o ANON_KEY no configurados. supabaseUrl:',
      !!supabaseUrl,
      'anonKey:',
      !!supabaseAnonKey
    )
    // No lanzar error para no romper SSR — el cliente se inicializará después
    return
  }

  // Verificar si ya está definido (evitar redefinición en hot-reload)
  if (nuxtApp.$supabase) {
    console.log('[Supabase Plugin] Ya está inicializado, reutilizando instancia')
    return {
      provide: {
        supabase: nuxtApp.$supabase,
      },
    }
  }

  // Si hay una instancia global pero no en nuxtApp, reutilizarla
  if (supabase) {
    console.log('[Supabase Plugin] Reutilizando instancia global')
    return {
      provide: {
        supabase,
      },
    }
  }

  // Crear nueva instancia solo si no existe
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
    },
  })

  console.log('[Supabase Plugin] Instancia creada')

  return {
    provide: {
      supabase,
    },
  }
})

export { supabase }
