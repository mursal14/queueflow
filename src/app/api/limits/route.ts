import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PLANS } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ allowed: false, reason: 'Unauthorized' }, { status: 401 })
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return NextResponse.json({ allowed: false, reason: 'Unauthorized' }, { status: 401 })

    const { resource } = await req.json() // 'queue' | 'location' | 'team_member' | 'display'

    const { data: profile } = await supabaseAdmin.from('profiles').select('plan, subscription_status').eq('id', user.id).single()
    const { data: org } = await supabaseAdmin.from('organizations').select('id').eq('owner_id', user.id).single()

    if (!profile || !org) return NextResponse.json({ allowed: false, reason: 'Account not found' }, { status: 404 })

    // Past due or cancelled — only free limits apply
    const effectivePlan = (['active', 'trialing'].includes(profile.subscription_status)) ? profile.plan : 'free'
    const limits = PLANS[effectivePlan as keyof typeof PLANS]?.limits || PLANS.free.limits

    let current = 0
    let limit = 0
    let label = ''

    switch (resource) {
      case 'queue':
        ({ count: current } = await supabaseAdmin.from('queues').select('id', { count: 'exact', head: true }).eq('organization_id', org.id))
        limit = limits.queues; label = 'queues'
        break
      case 'location':
        ({ count: current } = await supabaseAdmin.from('locations').select('id', { count: 'exact', head: true }).eq('organization_id', org.id))
        limit = limits.locations; label = 'locations'
        break
      case 'team_member':
        ({ count: current } = await supabaseAdmin.from('team_members').select('id', { count: 'exact', head: true }).eq('organization_id', org.id))
        limit = limits.team; label = 'team members'
        break
      case 'display':
        ({ count: current } = await supabaseAdmin.from('display_screens').select('id', { count: 'exact', head: true }).eq('organization_id', org.id))
        limit = limits.displays; label = 'display screens'
        break
      default:
        return NextResponse.json({ allowed: false, reason: 'Unknown resource' }, { status: 400 })
    }

    if ((current || 0) >= limit) {
      return NextResponse.json({
        allowed: false,
        reason: `Your ${effectivePlan} plan allows ${limit} ${label}. You have ${current}. Please upgrade to create more.`,
        current, limit, plan: effectivePlan,
      })
    }

    return NextResponse.json({ allowed: true, current, limit, plan: effectivePlan })
  } catch (err: any) {
    return NextResponse.json({ allowed: false, reason: err.message }, { status: 500 })
  }
}
