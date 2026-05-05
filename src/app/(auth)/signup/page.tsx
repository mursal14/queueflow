'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_LABELS: Record<string, { label: string; price: string }> = {
  free:         { label: 'Free Plan',         price: '$0/month' },
  starter:      { label: 'Starter',           price: '$29/month' },
  professional: { label: 'Professional',      price: '$79/month' },
  enterprise:   { label: 'Enterprise',        price: '$199/month' },
}

export default function SignupPage() {
  const router  = useRouter()
  const params  = useSearchParams()
  const plan    = params.get('plan') || 'free'

  const [form,    setForm]    = useState({ email: '', password: '', full_name: '', org_name: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      // 1. Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, org_name: form.org_name, plan },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error

      if (data.session) {
        // Email confirmation disabled — user is signed in immediately
        // 2. Set up org via API
        await fetch('/api/auth/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ org_name: form.org_name, plan }),
        })

        // 3. For paid plans → Stripe checkout
        if (plan !== 'free') {
          const res  = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({ plan, userId: data.user!.id }),
          })
          const json = await res.json()
          if (json.url) {
            window.location.href = json.url
            return
          }
          // If Stripe not configured yet, go to dashboard
          toast('Stripe not configured — going to dashboard. Set up billing later.', { icon: 'ℹ️' })
        }

        router.push('/onboarding')
      } else {
        // Email confirmation required
        setDone(true)
      }
    } catch (err: any) {
      toast.error(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="card p-10 w-full max-w-md text-center shadow-xl">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email!</h2>
      <p className="text-gray-600 mb-2">We sent a verification link to:</p>
      <div className="font-semibold text-gray-900 bg-gray-50 rounded-xl px-4 py-3 text-sm mb-6">{form.email}</div>
      <p className="text-gray-500 text-sm mb-6">Click the link to activate your account. Check your spam folder if you don't see it.</p>
      <Link href="/login" className="btn-primary w-full justify-center">Go to Login →</Link>
    </div>
  )

  const planInfo = PLAN_LABELS[plan]

  return (
    <div className="w-full max-w-md">
      <div className="card p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm mb-5">
          {plan === 'free' ? 'Free forever — no credit card needed' : '14-day free trial — then ' + planInfo?.price}
        </p>

        {/* Selected plan badge */}
        {plan !== 'free' && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-blue-800">{planInfo?.label}</span>
              <span className="text-xs text-blue-500 ml-2">— Stripe checkout after signup</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input required className="input" placeholder="Jane Smith" value={form.full_name} onChange={set('full_name')} />
          </div>
          <div>
            <label className="label">Business / Organisation</label>
            <input required className="input" placeholder="Acme Clinic" value={form.org_name} onChange={set('org_name')} />
          </div>
          <div>
            <label className="label">Work Email</label>
            <input required type="email" className="input" placeholder="jane@acme.com" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                required
                type={showPw ? 'text' : 'password'}
                className="input pr-11"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={set('password')}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-2">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
            ) : plan !== 'free' ? (
              <>Create Account & Pay <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Create Free Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          By signing up you agree to our{' '}
          <Link href="/terms"   className="underline hover:text-gray-600">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </p>
        <div className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
