import { createClient } from "@supabase/supabase-js"

// The current Vercel installation does not define these values yet, so retain
// its browser-safe production fallback. Environment variables take priority.
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
