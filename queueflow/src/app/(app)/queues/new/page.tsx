'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, ListOrdered } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewQueuePage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', description: '', prefix: 'A', avg_service_minutes: 10, require_phone: false, require_email: false, max_capacity: 200 })
  const [loading, setLoading] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: { session } } = await supabase.auth.getSession()
      // Check limits
      const limitRes = await fetch('/api/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ resource: 'queue' }),
      })
      const limitData = await limitRes.json()
      if (!limitData.allowed) { toast.error(limitData.reason); router.push('/billing'); return }
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) throw new Error('No organisation found')
      const { error } = await supabase.from('queues').insert({ ...form, organization_id: org.id })
      if (error) throw error
      toast.success('Queue created!')
      router.push('/queues')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/queues" className="btn-ghost btn-sm p-2"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Queue</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configure your queue settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2"><label className="label">Queue Name *</label><input required className="input" placeholder="e.g. Customer Service, Counter A" value={form.name} onChange={set('name')} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} placeholder="Brief description visible to customers" value={form.description} onChange={set('description') as any} /></div>
          <div>
            <label className="label">Ticket Prefix</label>
            <select className="input" value={form.prefix} onChange={set('prefix')}>
              {['A','B','C','D','E','F','G','H','VIP','GEN'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Tickets will look like: {form.prefix}001</p>
          </div>
          <div>
            <label className="label">Avg. Service Time (minutes)</label>
            <input type="number" className="input" min={1} max={120} value={form.avg_service_minutes} onChange={set('avg_service_minutes')} />
            <p className="text-xs text-gray-400 mt-1">Used to estimate wait times</p>
          </div>
          <div>
            <label className="label">Max Capacity</label>
            <input type="number" className="input" min={1} max={1000} value={form.max_capacity} onChange={set('max_capacity')} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Customer Fields</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded accent-blue-600" checked={form.require_phone} onChange={set('require_phone')} />
              <span className="text-sm font-medium text-gray-700">Require phone number</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded accent-blue-600" checked={form.require_email} onChange={set('require_email')} />
              <span className="text-sm font-medium text-gray-700">Require email address</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/queues" className="btn-secondary flex-1 justify-center">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><ListOrdered className="w-4 h-4" /> Create Queue</>}
          </button>
        </div>
      </form>
    </div>
  )
}
