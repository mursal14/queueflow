'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true)
      else {
        toast.error('Invalid or expired reset link')
        router.push('/login')
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be 8+ characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="card p-10 w-full max-w-md text-center">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-3">Password Updated!</h2>
      <p className="text-gray-600">Redirecting you to the dashboard…</p>
    </div>
  )

  if (!validSession) return (
    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
  )

  return (
    <div className="w-full max-w-md">
      <div className="card p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-1">Set New Password</h1>
        <p className="text-gray-500 text-sm mb-6">Choose a strong password for your account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input required type={showPw ? 'text' : 'password'} className="input pr-11" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input required type="password" className="input" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : 'Update Password'}
          </button>
        </form>
        <div className="text-center mt-4 text-sm"><Link href="/login" className="text-blue-600 hover:underline">← Back to login</Link></div>
      </div>
    </div>
  )
}
