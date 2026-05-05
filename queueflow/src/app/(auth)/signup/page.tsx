'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free Plan',
  starter: 'Starter – $29/mo',
  professional: 'Professional – $79/mo',
  enterprise: 'Enterprise – $199/mo',
}

export default function SignupPage() {
  const router = useRouter()
  const params = useSearchParams()
  const plan = params.get('plan') || 'free'

  const [form, setForm] = useState({ email: '', password: '', full_name: '', org_name: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be 8+ characters'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, org_name: form.org_name, plan } },
      })
      if (error) throw error

      // Create org via API
      if (data.session) {
        await fetch('/api/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
          body: JSON.stringify({ org_name: form.org_name, plan }),
        })
        // If paid plan → Stripe checkout
        if (plan !== 'free') {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
            body: JSON.stringify({ plan, userId: data.user!.id }),
          })
          const json = await res.json()
          if (json.url) { window.location.href = json.url; return }
        }
        router.push('/onboarding')
      } else {
        router.push(`/verify?email=${encodeURIComponent(form.email)}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="card p-10 w-full max-w-md text-center">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email!</h2>
      <p className="text-gray-600 mb-6">We sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.</p>
      <Link href="/login" className="btn-primary w-full justify-center">Go to Login</Link>
    </div>
  )

  return (
    <div className="w-full max-w-md">
      <div className="card p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm mb-6">14-day free trial · No credit card required now</p>

        {plan !== 'free' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm font-semibold text-blue-700 flex items-center gap-2">
            ✓ Selected: {PLAN_LABELS[plan]}
            <span className="ml-auto text-xs font-normal text-blue-500">Stripe checkout after signup</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Full Name</label><input required className="input" placeholder="Jane Smith" value={form.full_name} onChange={set('full_name')} /></div>
          <div><label className="label">Business / Organisation Name</label><input required className="input" placeholder="Acme Clinic" value={form.org_name} onChange={set('org_name')} /></div>
          <div><label className="label">Work Email</label><input required type="email" className="input" placeholder="jane@acme.com" value={form.email} onChange={set('email')} /></div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input required type={showPw ? 'text' : 'password'} className="input pr-11" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : plan !== 'free' ? 'Create Account & Pay →' : 'Create Free Account →'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
        </p>
        <div className="text-center mt-5 text-sm text-gray-600">
          Already have an account? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
