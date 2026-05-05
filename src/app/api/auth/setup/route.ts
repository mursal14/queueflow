import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { slugify } from '@/lib/utils'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { org_name, plan } = await req.json()

    // Upsert organization
    const slug = slugify(org_name || user.email?.split('@')[0] || 'org') + '-' + Math.random().toString(36).slice(2, 6)
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .insert({ owner_id: user.id, name: org_name || 'My Organization', slug })
      .select()
      .single()

    // Update profile — only columns that exist in schema
    await supabaseAdmin.from('profiles').update({
      plan: plan === 'free' ? 'free' : 'free', // stays free until Stripe webhook confirms
      subscription_status: plan === 'free' ? 'active' : 'trialing',
      onboarding_step: 1,
    }).eq('id', user.id)

    // Send welcome email (non-blocking)
    const profile_name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
    sendWelcomeEmail(user.email!, profile_name).catch(() => {})

    return NextResponse.json({ ok: true, org })
  } catch (err: any) {
    console.error('Auth setup error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
