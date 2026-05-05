'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, ListOrdered, QrCode, Link2, Pause, Play, Trash2, ExternalLink } from 'lucide-react'
import type { Queue } from '@/types'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

export default function QueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState('')
  const [qrQueue, setQrQueue] = useState<Queue | null>(null)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
    if (!org) return
    setOrgId(org.id)
    const { data } = await supabase
      .from('queues')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
    // Get waiting counts
    const withCounts = await Promise.all((data || []).map(async (q: Queue) => {
      const { count } = await supabase.from('queue_entries').select('id', { count: 'exact', head: true }).eq('queue_id', q.id).eq('status', 'waiting')
      return { ...q, waiting_count: count || 0 }
    }))
    setQueues(withCounts)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleStatus(q: Queue) {
    const newStatus = q.status === 'active' ? 'paused' : 'active'
    await supabase.from('queues').update({ status: newStatus }).eq('id', q.id)
    toast.success(`Queue ${newStatus}`)
    load()
  }

  async function deleteQueue(id: string) {
    if (!confirm('Delete this queue? All entries will be removed.')) return
    await supabase.from('queues').delete().eq('id', id)
    toast.success('Queue deleted')
    load()
  }

  function copyLink(q: Queue) {
    navigator.clipboard.writeText(`${APP_URL}/join/${q.public_id}`)
    toast.success('Public link copied!')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Queues</h1><p className="text-gray-500 text-sm mt-0.5">Manage your virtual queues</p></div>
        <Link href="/queues/new" className="btn-primary"><Plus className="w-4 h-4" /> New Queue</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : queues.length === 0 ? (
        <div className="card p-16 text-center">
          <ListOrdered className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No queues yet</h3>
          <p className="text-gray-400 mb-6">Create your first queue and start accepting customers today.</p>
          <Link href="/queues/new" className="btn-primary btn-lg mx-auto"><Plus className="w-5 h-5" /> Create First Queue</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {queues.map(q => (
            <div key={q.id} className="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{q.prefix}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-lg">{q.name}</span>
                  <span className={`badge ${q.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.status}</span>
                </div>
                {q.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{q.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="font-bold text-gray-900 text-base">{q.waiting_count}</span> waiting
                  <span>·</span>
                  <span>~{q.avg_service_minutes} min/customer</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => copyLink(q)} className="btn-ghost btn-sm" title="Copy public link"><Link2 className="w-4 h-4" /></button>
                <button onClick={() => setQrQueue(q)} className="btn-ghost btn-sm" title="Show QR code"><QrCode className="w-4 h-4" /></button>
                <a href={`/join/${q.public_id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" title="Open public page"><ExternalLink className="w-4 h-4" /></a>
                <Link href={`/queues/${q.id}`} className="btn-secondary btn-sm">Manage</Link>
                <button onClick={() => toggleStatus(q)} className="btn-ghost btn-sm" title="Toggle status">
                  {q.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteQueue(q.id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrQueue && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQrQueue(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">{qrQueue.name}</h3>
            <p className="text-gray-500 text-sm mb-6">Customers scan this to join the queue</p>
            <div className="flex justify-center mb-6">
              <QRCodeSVG value={`${APP_URL}/join/${qrQueue.public_id}`} size={200} marginSize={2} />
            </div>
            <p className="text-xs text-gray-400 mb-4 break-all">{APP_URL}/join/{qrQueue.public_id}</p>
            <div className="flex gap-3">
              <button onClick={() => { copyLink(qrQueue); setQrQueue(null) }} className="btn-secondary flex-1 btn-sm">Copy Link</button>
              <button onClick={() => setQrQueue(null)} className="btn-primary flex-1 btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
