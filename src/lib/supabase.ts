import { createClient } from '@supabase/supabase-js'
import { createBrowserClient as ssrBrowser, createServerClient as ssrServer } from '@supabase/ssr'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ── Browser client (used in 'use client' components) ──────────
// Single shared instance — safe because env vars are public
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── Admin client (server-side API routes only) ────────────────
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── SSR helpers (if needed for server components) ─────────────
// Use these only in Server Components / Route Handlers, not in 'use client'
export { ssrBrowser, ssrServer }
