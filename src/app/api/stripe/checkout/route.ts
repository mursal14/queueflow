import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, userId } = await req.json()
    const planConfig = PLANS[plan as keyof typeof PLANS]

    if (!planConfig || !planConfig.priceId) {
      return NextResponse.json({ error: 'Invalid plan or plan has no price' }, { status: 400 })
    }

    // Check if Stripe keys are configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('*').eq('id', userId || user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Get or create Stripe customer
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name:  profile.full_name || undefined,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await supabaseAdmin.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url:  `${appUrl}/billing`,
      metadata:    { user_id: user.id, plan },
      subscription_data: {
        trial_period_days: 14,
        metadata: { user_id: user.id, plan },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('[Stripe Checkout]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
