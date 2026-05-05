'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Monitor, Plus, Copy, ExternalLink, Trash2, Loader2, Volume2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DisplayPage() {
  const [screens, setScreens] = useState<any[]>([])
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
    if (!org) return
    setOrgId(org.id)
    const { data } = await supabase.from('display_screens').select('*').eq('organization_id', org.id).order('created_at')
    setScreens(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const { error } = await supabase.from('display_screens').insert({ organization_id: orgId, name: newName })
    if (error) toast.error(error.message)
    else { toast.success('Display screen created!'); setNewName('') }
    setCreating(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this display screen?')) return
    await supabase.from('display_screens').delete().eq('id', id)
    toast.success('Deleted')
    load()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-gray-900">Display Screens</h1><p className="text-gray-500 text-sm mt-0.5">TV dashboards for your waiting areas</p></div>

      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600" /> Add Display Screen</h2>
        <form onSubmit={create} className="flex gap-3">
          <input className="input flex-1" placeholder="e.g. Lobby Screen, Counter A Display" value={newName} onChange={e => setNewName(e.target.value)} required />
          <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor className="w-4 h-4" />} Create
          </button>
        </form>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        : screens.length === 0 ? (
          <div className="card p-16 text-center">
            <Monitor className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-gray-600 mb-2">No display screens yet</h3>
            <p className="text-gray-400 text-sm">Create a display screen and open its URL on any TV or monitor in your waiting area.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {screens.map(s => (
              <div key={s.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center"><Monitor className="w-5 h-5 text-blue-400" /></div>
                    <div><div className="font-bold text-gray-900">{s.name}</div><div className="text-xs text-gray-400 capitalize">{s.theme} theme</div></div>
                  </div>
                  <button onClick={() => remove(s.id)} className="btn-ghost btn-sm text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-4">
                  <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{APP_URL}/display/{s.access_token}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(`${APP_URL}/display/${s.access_token}`); toast.success('URL copied!') }} className="btn-secondary btn-sm flex-1 justify-center"><Copy className="w-4 h-4" /> Copy URL</button>
                  <a href={`/display/${s.access_token}`} target="_blank" rel="noreferrer" className="btn-primary btn-sm flex-1 justify-center"><ExternalLink className="w-4 h-4" /> Open Display</a>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
