import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno
config({ path: '.env' })

async function setupStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Variables de entorno faltantes:')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey)
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Crear el bucket si no existe
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('Error al listar buckets:', listError)
    return
  }

  const bucketExists = buckets.some(bucket => bucket.name === 'report-images')

  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket('report-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      fileSizeLimit: 5242880, // 5MB
    })

    if (createError) {
      console.error('Error al crear bucket:', createError)
      return
    }

    console.log('✅ Bucket "report-images" creado exitosamente')
  } else {
    console.log('✅ Bucket "report-images" ya existe')
  }

  console.log('✅ El bucket está disponible para subir imágenes.')
  console.log('Si necesitas revisar las políticas, ve a Supabase Dashboard > Storage > report-images > Policies')
}

setupStorage().catch(console.error)