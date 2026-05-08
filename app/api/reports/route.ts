import { createServerClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/reports - Obtener todos los reportes del mapa
 * Retorna los reportes con sus posts asociados del foro
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: reports, error: reportsError } = await supabase
      .from('map_reports')
      .select('id, latitude, longitude, category, description, created_at, post_id')
      .order('created_at', { ascending: false })

    if (reportsError) {
      return NextResponse.json(
        { error: 'Error fetching reports', details: reportsError.message },
        { status: 500 }
      )
    }

    const postIds = reports?.filter((report) => report.post_id).map((report) => report.post_id) ?? []
    const postMap: Record<string, { id: string; content: string; image_url?: string | null }> = {}

    if (postIds.length > 0) {
      const { data: posts, error: postsError } = await supabase
        .from('anonymous_posts')
        .select('id, content, image_url')
        .in('id', postIds)

      if (postsError) {
        const missingImageColumn =
          postsError.code === '42703' ||
          postsError.message?.includes("column anonymous_posts.image_url does not exist") ||
          postsError.message?.includes("Could not find the 'image_url' column")

        if (missingImageColumn) {
          const { data: postsFallback, error: fallbackError } = await supabase
            .from('anonymous_posts')
            .select('id, content')
            .in('id', postIds)

          if (fallbackError) {
            return NextResponse.json(
              { error: 'Error fetching related posts', details: fallbackError.message },
              { status: 500 }
            )
          }

          postsFallback?.forEach((post) => {
            if (post.id) {
              postMap[post.id] = { id: post.id, content: post.content }
            }
          })
        } else {
          return NextResponse.json(
            { error: 'Error fetching related posts', details: postsError.message },
            { status: 500 }
          )
        }
      } else {
        posts?.forEach((post) => {
          if (post.id) {
            postMap[post.id] = post
          }
        })
      }
    }

    const reportsWithPosts = reports?.map((report) => ({
      ...report,
      anonymous_posts: report.post_id ? (postMap[report.post_id] ? { image_url: postMap[report.post_id].image_url } : null) : null,
    })) ?? []

    return NextResponse.json(
      { reports: reportsWithPosts, count: reportsWithPosts.length },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reports - Crear un nuevo reporte
 * Requiere: latitude, longitude, category, description
 * Opcional: image_url (URL pública de imagen)
 * Automáticamente crea un post en el foro
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude, category, description, image_url } = body

    // Validar campos requeridos
    if (!latitude || !longitude || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude, category, description' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // 1. Crear post en el foro
    const postPayload: Record<string, unknown> = {
      content: description,
      category: category,
    }

    // Intentar con image_url si se proporciona
    if (image_url) {
      postPayload.image_url = image_url
    }

    let { data: postData, error: postError } = await supabase
      .from('anonymous_posts')
      .insert(postPayload)
      .select()
      .single()

    // Si falla porque la columna no existe, reintentar sin image_url
    if (
      postError &&
      image_url &&
      (postError.code === '42703' || 
       postError.message?.includes("Could not find the 'image_url' column") || 
       postError.message?.includes("column anonymous_posts.image_url does not exist") ||
       postError.message?.includes("does not exist"))
    ) {
      console.log("[v0] Retrying post creation without image_url column")
      
      const fallbackPayload = {
        content: description,
        category: category,
      }
      
      const fallbackResult = await supabase
        .from('anonymous_posts')
        .insert(fallbackPayload)
        .select()
        .single()

      postData = fallbackResult.data
      postError = fallbackResult.error
    }

    if (postError || !postData) {
      return NextResponse.json(
        { error: 'Error creating forum post', details: postError?.message },
        { status: 500 }
      )
    }

    // 2. Crear reporte vinculado al post
    const { data: reportData, error: reportError } = await supabase
      .from('map_reports')
      .insert({
        latitude,
        longitude,
        category,
        description,
        post_id: postData.id,
      })
      .select()
      .single()

    if (reportError || !reportData) {
      return NextResponse.json(
        { error: 'Error creating map report', details: reportError?.message },
        { status: 500 }
      )
    }

    // 3. Actualizar el post con la referencia del reporte (si es posible)
    await supabase
      .from('anonymous_posts')
      .update({ map_report_id: reportData.id })
      .eq('id', postData.id)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.warn("[v0] Could not update post with map_report_id:", updateError.message)
          // This is not critical, the link is already established via post_id in map_reports
        }
      })

    return NextResponse.json(
      { report: reportData, post: postData },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
