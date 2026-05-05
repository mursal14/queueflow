'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div className="card p-10 w-full max-w-md text-center">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-3">Email sent!</h2>
      <p className="text-gray-600 mb-6">Check <strong>{email}</strong> for a password reset link.</p>
      <Link href="/login" className="btn-primary w-full justify-center">Back to Login</Link>
    </div>
  )

  return (
    <div className="w-full max-w-md">
      <div className="card p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
        <p className="text-gray-500 text-sm mb-6">We'll email you a reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Email</label><input required type="email" className="input" placeholder="jane@acme.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center mt-4 text-sm"><Link href="/login" className="text-blue-600 hover:underline">← Back to login</Link></div>
      </div>
    </div>
  )
}
