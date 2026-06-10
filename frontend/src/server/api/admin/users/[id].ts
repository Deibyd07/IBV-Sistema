/**
 * API para gestionar usuarios específicos
 * GET /api/admin/users/:id - Obtiene un usuario
 * PATCH /api/admin/users/:id - Actualiza usuario
 * DELETE /api/admin/users/:id - Elimina usuario
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    // Limpiar URL y Key de espacios, saltos de línea y caracteres unicode invisibles
    const stripInvisible = (s: string) => s.replace(/[\u200B-\u200F\uFEFF\u00A0\u2060]/g, '').trim()
    const supabaseUrl = stripInvisible((config.supabaseUrl || '').toString())
    const supabaseServiceKey = stripInvisible((config.supabaseServiceKey || '').toString())

    if (!supabaseUrl || !supabaseServiceKey) {
      setResponseStatus(event, 500)
      return {
        success: false,
        error: 'CONFIG_MISSING',
        message: `Supabase config missing. URL: ${!!supabaseUrl} (len:${supabaseUrl.length}), Key: ${!!supabaseServiceKey} (len:${supabaseServiceKey.length})`,
      }
    }

    // Validar que la URL es válida
    let cleanUrl = supabaseUrl
    try {
      new URL(cleanUrl)
    } catch {
      // Intentar forzar https si falta
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = `https://${cleanUrl}`
      }
      // Quitar trailing slash
      cleanUrl = cleanUrl.replace(/\/+$/, '')
      try {
        new URL(cleanUrl)
      } catch {
        setResponseStatus(event, 500)
        return {
          success: false,
          error: 'INVALID_URL',
          message: `URL inválida: "${supabaseUrl}" (limpia: "${cleanUrl}")`,
        }
      }
    }

    const $supabaseAdmin = createClient(cleanUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const method = getMethod(event)
    const userId = getRouterParam(event, 'id')

    if (!userId || isNaN(Number(userId))) {
      setResponseStatus(event, 400)
      return { success: false, error: 'INVALID_ID', message: `ID inválido: ${userId}` }
    }

    const userIdNum = Number(userId)

    // ============================================
    // GET /api/admin/users/:id
    // ============================================
    if (method === 'GET') {
      const { data, error } = await $supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('id', userIdNum)
        .single()

      if (error) {
        setResponseStatus(event, 404)
        return { success: false, error: 'GET_ERROR', message: error.message }
      }

      return { success: true, data }
    }

    // ============================================
    // PATCH /api/admin/users/:id
    // ============================================
    if (method === 'PATCH') {
      // Paso 1: Leer body
      const body = await readBody(event).catch((e: any) => null)
      if (!body) {
        setResponseStatus(event, 400)
        return {
          success: false,
          error: 'NO_BODY',
          message: 'No se pudo leer el body de la petición',
        }
      }

      // Paso 2: Obtener usuario actual
      const { data: currentUser, error: getError } = await $supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('id', userIdNum)
        .single()

      if (getError || !currentUser) {
        setResponseStatus(event, 404)
        return {
          success: false,
          error: 'USER_NOT_FOUND',
          message: `Usuario ${userIdNum} no encontrado: ${getError?.message || 'sin datos'}`,
        }
      }

      // Paso 3: Preparar datos
      const updateData: Record<string, any> = {}
      if (body.nombres !== undefined) updateData.nombres = body.nombres
      if (body.apellidos !== undefined) updateData.apellidos = body.apellidos
      if (body.rol !== undefined) updateData.rol = body.rol
      if (body.activo !== undefined) updateData.activo = body.activo

      if (Object.keys(updateData).length === 0) {
        return { success: true, message: 'Sin cambios', user: currentUser }
      }

      // Paso 4: UPDATE con select
      const { data: updatedData, error: updateError } = await $supabaseAdmin
        .from('usuarios')
        .update(updateData)
        .eq('id', userIdNum)
        .select('*')
        .maybeSingle()

      if (updateError) {
        setResponseStatus(event, 500)
        return {
          success: false,
          error: 'UPDATE_ERROR',
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        }
      }

      // Si maybeSingle devolvió null, intentar sin select
      let finalUser = updatedData
      if (!finalUser) {
        const { error: err2 } = await $supabaseAdmin
          .from('usuarios')
          .update(updateData)
          .eq('id', userIdNum)

        if (err2) {
          setResponseStatus(event, 500)
          return {
            success: false,
            error: 'FALLBACK_UPDATE_ERROR',
            message: err2.message,
            code: err2.code,
          }
        }

        // Releer para confirmar
        const { data: reread } = await $supabaseAdmin
          .from('usuarios')
          .select('*')
          .eq('id', userIdNum)
          .single()

        finalUser = reread || { ...currentUser, ...updateData }
      }

      // Paso 5: Actualizar Auth metadata (no crítico)
      try {
        const { data: authUsers } = await $supabaseAdmin.auth.admin.listUsers()
        if (authUsers?.users) {
          const authUser = authUsers.users.find((u: any) => u.email === currentUser.correo)
          if (authUser) {
            const nombreCompleto = `${finalUser.nombres} ${finalUser.apellidos}`.trim()
            await $supabaseAdmin.auth.admin.updateUserById(authUser.id, {
              user_metadata: {
                nombres: finalUser.nombres,
                apellidos: finalUser.apellidos,
                full_name: nombreCompleto,
                display_name: nombreCompleto,
                rol: finalUser.rol,
              },
            })
          }
        }
      } catch (_authErr) {
        console.error('[PATCH] Auth update failed (non-critical):', _authErr)
      }

      return { success: true, message: 'Usuario actualizado', user: finalUser }
    }

    // ============================================
    // DELETE /api/admin/users/:id
    // ============================================
    if (method === 'DELETE') {
      const { data: usuario, error: getError } = await $supabaseAdmin
        .from('usuarios')
        .select('correo')
        .eq('id', userIdNum)
        .single()

      if (getError || !usuario) {
        setResponseStatus(event, 404)
        return { success: false, error: 'USER_NOT_FOUND', message: 'Usuario no encontrado' }
      }

      // Eliminar de Auth
      const { data: authUsers } = await $supabaseAdmin.auth.admin.listUsers()
      if (authUsers?.users) {
        const authUser = authUsers.users.find((u: any) => u.email === usuario.correo)
        if (authUser) {
          const { error: authDeleteError } = await $supabaseAdmin.auth.admin.deleteUser(authUser.id)
          if (authDeleteError) {
            setResponseStatus(event, 500)
            return { success: false, error: 'AUTH_DELETE_ERROR', message: authDeleteError.message }
          }
        }
      }

      // Eliminar de BD
      const { error: deleteError } = await $supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('id', userIdNum)

      if (deleteError) {
        setResponseStatus(event, 500)
        return { success: false, error: 'DB_DELETE_ERROR', message: deleteError.message }
      }

      return { success: true, message: 'Usuario eliminado' }
    }

    setResponseStatus(event, 405)
    return { success: false, error: 'METHOD_NOT_ALLOWED', message: `Método ${method} no permitido` }
  } catch (err: any) {
    console.error('[Admin Users Dynamic] Unhandled error:', err)
    setResponseStatus(event, 500)
    return {
      success: false,
      error: 'UNHANDLED_ERROR',
      message: err.message || 'Error desconocido',
      stack: (err.stack || '').substring(0, 300),
    }
  }
})
