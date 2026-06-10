/**
 * API para gestionar usuarios
 * GET /api/admin/users - Lista todos
 * POST /api/admin/users - Crea nuevo
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripInvisible = (s: string) => s.replace(/[\u200B-\u200F\uFEFF\u00A0\u2060]/g, '').trim()
  const supabaseUrl = stripInvisible((config.supabaseUrl || '').toString())
  const supabaseServiceKey = stripInvisible((config.supabaseServiceKey || '').toString())

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Admin Users Index] Configuración faltante:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    })
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase configuration missing on server.',
    })
  }

  // Limpiar URL
  let cleanUrl = supabaseUrl
  if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`
  cleanUrl = cleanUrl.replace(/\/+$/, '')

  const $supabaseAdmin = createClient(cleanUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const method = getMethod(event)

  try {
    // ============================================
    // GET /api/admin/users - Lista todos
    // ============================================
    if (method === 'GET') {
      const { data, error } = await $supabaseAdmin
        .from('usuarios')
        .select('*')
        .order('fecha_registro', { ascending: false })

      if (error) throw error

      return { success: true, data }
    }

    // ============================================
    // POST /api/admin/users - Crea nuevo
    // ============================================
    if (method === 'POST') {
      const body = await readBody(event)

      if (!body.correo || !body.nombres || !body.password) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email, nombres y password son requeridos',
        })
      }

      // Crear en Auth
      const nombreCompleto = `${body.nombres} ${body.apellidos || ''}`.trim()
      const { data: authUser, error: authError } = await $supabaseAdmin.auth.admin.createUser({
        email: body.correo,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          nombres: body.nombres,
          apellidos: body.apellidos || '',
          full_name: nombreCompleto,
          display_name: nombreCompleto,
          rol: body.rol || 'cliente',
        },
      })

      if (authError) {
        throw new Error(`Error en Auth: ${authError.message}`)
      }

      // Crear en tabla usuarios
      const { data: user, error: userError } = await $supabaseAdmin
        .from('usuarios')
        .insert({
          correo: body.correo,
          nombres: body.nombres,
          apellidos: body.apellidos || '',
          rol: body.rol || 'cliente',
          activo: body.activo ?? true,
          es_superusuario: body.rol === 'admin',
          es_personal: true,
          fecha_registro: new Date().toISOString(),
        })
        .select()
        .single()

      if (userError) {
        await $supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        throw new Error(`Error en BD: ${userError.message}`)
      }

      return {
        success: true,
        message: 'Usuario creado exitosamente',
        user,
      }
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Método no permitido',
    })
  } catch (err: any) {
    console.error('[Admin Users GET/POST]', err)

    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Error procesando solicitud',
    })
  }
})
