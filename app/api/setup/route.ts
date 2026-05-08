import { createServerClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/setup - Verificar y configurar la base de datos y storage
 * Este endpoint verifica que todo esté listo para funcionamiento
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // 1. Verificar que el bucket existe
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error listing buckets',
        details: bucketError.message
      }, { status: 500 })
    }

    const reportImagesBucketExists = buckets?.some(b => b.name === 'report-images')

    if (!reportImagesBucketExists) {
      // Intentar crear el bucket
      const { error: createError } = await supabase.storage.createBucket('report-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
        fileSizeLimit: 5242880, // 5MB
      })

      if (createError) {
        return NextResponse.json({
          status: 'error',
          message: 'Could not create report-images bucket',
          details: createError.message
        }, { status: 500 })
      }
    }

    // 2. Verificar que la tabla anonymous_posts existe
    const { error: tableError } = await supabase
      .from('anonymous_posts')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === 'PGRST202') {
      return NextResponse.json({
        status: 'error',
        message: 'anonymous_posts table does not exist',
        details: 'Please run setup-database.ts'
      }, { status: 500 })
    }

    // 3. Verificar que la columna image_url existe
    const { error: imageColumnError } = await supabase
      .from('anonymous_posts')
      .select('image_url')
      .limit(1)

    // Si la columna no existe, intentar crear la tabla nuevamente o migrar
    if (imageColumnError?.code === '42703' || imageColumnError?.message?.includes('image_url')) {
      return NextResponse.json({
        status: 'warning',
        message: 'image_url column may not exist in anonymous_posts',
        details: 'Please check your database schema',
        hasImageColumn: false
      }, { status: 200 })
    }

    return NextResponse.json({
      status: 'ok',
      message: 'All systems ready',
      hasImageBucket: true,
      hasAnonymousPostsTable: true,
      hasImageColumn: true
    }, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
