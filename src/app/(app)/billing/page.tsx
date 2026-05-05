'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CreditCard, CheckCircle2, Loader2, ExternalLink, Zap, ArrowUpRight } from 'lucide-react'
import { PLAN_COLORS } from '@/lib/utils'
import toast from 'react-hot-toast'

const PLANS = [
  { id: 'free', name: 'Free', price: 0, features: ['2 queues', '1 location', '2 team members'] },
  { id: 'starter', name: 'Starter', price: 29, features: ['10 queues', '3 locations', '5 team members', 'Custom branding', 'QR codes'] },
  { id: 'professional', name: 'Professional', price: 79, features: ['50 queues', '10 locations', '25 team members', 'SMS notifications', 'API access', 'Advanced analytics'] },
  { id: 'enterprise', name: 'Enterprise', price: 199, features: ['Unlimited everything', 'Custom domain', 'SSO', '24/7 support', 'SLA'] },
]

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => { setProfile(data); setLoading(false) })
    })
  }, [])

  async function handleUpgrade(planId: string) {
    if (planId === 'free') return
    setUpgrading(planId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ plan: planId, userId: profile.id }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else toast.error(json.error || 'Checkout failed')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpgrading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId: profile.id }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else toast.error('Could not open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const trialDays = profile?.trial_ends_at ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1><p className="text-gray-500 text-sm mt-0.5">Manage your plan and payment method</p></div>

      {/* Current plan */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-gray-900 mb-1">Current Plan</h2>
            <div className="flex items-center gap-3">
              <span className={`badge text-sm px-3 py-1 capitalize font-bold ${PLAN_COLORS[profile?.plan || 'free']}`}>{profile?.plan || 'free'}</span>
              <span className={`badge ${profile?.subscription_status === 'active' ? 'bg-green-100 text-green-700' : profile?.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                {profile?.subscription_status || 'trialing'}
              </span>
            </div>
            {profile?.subscription_status === 'trialing' && (
              <p className="text-sm text-orange-600 mt-2 font-medium">⏰ Trial ends in {trialDays} days — upgrade to keep your service running.</p>
            )}
          </div>
          {profile?.stripe_subscription_id && (
            <button onClick={handlePortal} disabled={portalLoading} className="btn-secondary btn-sm">
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div>
        <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Zap className="w-5 h-5 text-blue-600" /> Available Plans</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isCurrent = profile?.plan === plan.id
            return (
              <div key={plan.id} className={`card p-6 transition-all duration-300 ${isCurrent ? 'border-2 border-blue-500 bg-blue-50/30' : 'hover:shadow-lg'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  {isCurrent && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="text-2xl font-extrabold text-gray-900 mb-4">{plan.price === 0 ? 'Free' : `$${plan.price}/mo`}</div>
                <ul className="space-y-1.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full py-2 text-center text-sm font-semibold text-blue-700 bg-blue-100 rounded-xl">Current Plan</div>
                ) : plan.id !== 'free' && (
                  <button onClick={() => handleUpgrade(plan.id)} disabled={upgrading === plan.id} className="btn-primary w-full justify-center text-sm py-2.5">
                    {upgrading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                    {upgrading === plan.id ? 'Redirecting…' : 'Upgrade →'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-sm text-gray-400 p-4 bg-gray-50 rounded-xl">
        <strong>Payments are processed by Stripe.</strong> Your card details are never stored on our servers. All transactions are encrypted and PCI-DSS compliant.
      </div>
    </div>
  )
}
