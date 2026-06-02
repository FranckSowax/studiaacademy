import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec service role key — bypass RLS.
 * À utiliser UNIQUEMENT côté serveur dans les workers/API routes.
 * Ne JAMAIS exposer au client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour le client admin'
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
