import { createServerClient } from '@/lib/supabase/server-client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió una imagen válida.' }, { status: 400 })
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? file.type.split('/')[1] ?? 'jpg'
  const safeExtension = /^(jpg|jpeg|png|webp|avif)$/.test(extension) ? extension : 'jpg'
  const filePath = `reports/${crypto.randomUUID()}.${safeExtension}`

  try {
    const supabase = createServerClient()
    const { error: uploadError } = await supabase.storage
      .from('report-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = supabase.storage
      .from('report-images')
      .getPublicUrl(filePath)

    if (!data?.publicUrl) {
      return NextResponse.json({ error: 'No se pudo obtener la URL pública de la imagen.' }, { status: 500 })
    }

    return NextResponse.json({ publicUrl: data.publicUrl })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno de subida.' },
      { status: 500 }
    )
  }
}
