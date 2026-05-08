import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidas.')
}

const createSharedClient = () =>
  createSupabaseClient(supabaseUrl, supabaseAnonKey)

const client = globalThis.__supabaseClient ??= createSharedClient()

export function createClient() {
  return client
}
