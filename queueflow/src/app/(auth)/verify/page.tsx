'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

export default function VerifyPage() {
  const params = useSearchParams()
  const email = params.get('email') || ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function resend() {
    if (!email) { toast.error('Email address not found. Please sign up again.'); return }
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      setResent(true)
      toast.success('Verification email sent!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-10 shadow-xl text-center">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
        <p className="text-gray-600 mb-2">
          We sent a verification link to:
        </p>
        {email && <div className="font-semibold text-gray-900 mb-6 bg-gray-50 rounded-xl px-4 py-3 text-sm">{email}</div>}
        <p className="text-sm text-gray-500 mb-8">Click the link in the email to activate your account. Check your spam folder if you don't see it.</p>

        <div className="space-y-3">
          {resent ? (
            <div className="flex items-center gap-2 justify-center text-green-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" /> Email resent!
            </div>
          ) : (
            <button onClick={resend} disabled={resending} className="btn-secondary w-full justify-center py-3">
              {resending ? <><Loader2 className="w-4 h-4 animate-spin" /> Resending…</> : <><RefreshCw className="w-4 h-4" /> Resend Email</>}
            </button>
          )}
          <Link href="/login" className="block text-center text-sm text-blue-600 hover:underline">Already verified? Sign in →</Link>
        </div>
      </div>
    </div>
  )
}
