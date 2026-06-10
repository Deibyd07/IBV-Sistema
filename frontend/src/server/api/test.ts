export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  return {
    message: 'Test API working',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!config.supabaseUrl,
      hasSupabaseServiceKey: !!config.supabaseServiceKey,
      supabaseUrlLength: config.supabaseUrl?.length || 0,
      serviceKeyLength: config.supabaseServiceKey?.length || 0,
      hasPublicSupabaseUrl: !!config.public.supabaseUrl,
      hasPublicAnonKey: !!config.public.supabaseAnonKey,
    },
  }
})
