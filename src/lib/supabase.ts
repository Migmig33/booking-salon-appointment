import { createClient } from "@supabase/supabase-js"

// These browser credentials are intentionally public and remain protected by
// Supabase RLS/RPC permissions. Environment variables can override them for
// local development or a future project migration.
const productionSupabaseUrl = "https://jwqdomybmrnfokdngtka.supabase.co"
const productionSupabasePublishableKey =
  "sb_publishable_FBimCmbOWjIALiHMLNnJjw_cLr62Hze"

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || productionSupabaseUrl
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  productionSupabasePublishableKey

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
