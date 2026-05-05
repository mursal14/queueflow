import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTeamInviteEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, orgId } = await req.json()

    const { data: member } = await supabaseAdmin.from('team_members').select('invite_token').eq('organization_id', orgId).eq('email', email).single()
    const { data: org } = await supabaseAdmin.from('organizations').select('name, owner_id').eq('id', orgId).single()
    const { data: owner } = org ? await supabaseAdmin.from('profiles').select('full_name').eq('id', org.owner_id).single() : { data: null }

    if (member && org) {
      await sendTeamInviteEmail(email, owner?.full_name || 'The team', org.name, member.invite_token)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // Email may not be configured, don't fail
    console.error('Team invite email error:', err.message)
    return NextResponse.json({ ok: true })
  }
}
