import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

// IMPORTANT: Stripe webhook requires raw body — do NOT parse as JSON
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log('[Stripe Webhook] Event:', event.type)

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.user_id
        const plan    = session.metadata?.plan
        if (userId && plan) {
          await supabaseAdmin.from('profiles').update({
            plan,
            subscription_status: session.subscription ? 'active' : 'active',
            stripe_subscription_id: session.subscription as string,
            onboarding_done: true,
          }).eq('id', userId)
          console.log('[Stripe Webhook] Activated plan:', plan, 'for user:', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (userId) {
          // Map Stripe status to our internal status
          const statusMap: Record<string, string> = {
            active:     'active',
            trialing:   'trialing',
            past_due:   'past_due',
            canceled:   'canceled',
            incomplete: 'incomplete',
            incomplete_expired: 'canceled',
            unpaid:     'past_due',
          }
          await supabaseAdmin.from('profiles').update({
            subscription_status: statusMap[sub.status] || sub.status,
          }).eq('id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (userId) {
          await supabaseAdmin.from('profiles').update({
            plan: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
          }).eq('id', userId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await supabaseAdmin.from('profiles')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await supabaseAdmin.from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)
        break
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Stripe Webhook] Handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
