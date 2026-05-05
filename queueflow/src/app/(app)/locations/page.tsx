'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Location } from '@/types'

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', timezone: 'America/New_York' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
    if (!org) return
    setOrgId(org.id)
    const { data } = await supabase.from('locations').select('*').eq('organization_id', org.id).order('created_at')
    setLocations(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm({ name: '', address: '', timezone: 'America/New_York' }); setShowForm(true) }
  function openEdit(loc: Location) { setEditing(loc); setForm({ name: loc.name, address: loc.address || '', timezone: loc.timezone }); setShowForm(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await supabase.from('locations').update(form).eq('id', editing.id)
        toast.success('Location updated')
      } else {
        await supabase.from('locations').insert({ ...form, organization_id: orgId })
        toast.success('Location created')
      }
      setShowForm(false)
      load()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  async function toggle(loc: Location) {
    await supabase.from('locations').update({ is_active: !loc.is_active }).eq('id', loc.id)
    toast.success(loc.is_active ? 'Location deactivated' : 'Location activated')
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this location? Queues using it will become unassigned.')) return
    await supabase.from('locations').delete().eq('id', id)
    toast.success('Location deleted')
    load()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Locations</h1><p className="text-gray-500 text-sm mt-0.5">Manage your physical sites and branches</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Location</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : locations.length === 0 ? (
        <div className="card p-16 text-center">
          <MapPin className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Locations Yet</h3>
          <p className="text-gray-400 text-sm mb-6">Add your first location to organise queues by physical site.</p>
          <button onClick={openCreate} className="btn-primary mx-auto"><Plus className="w-4 h-4" /> Add First Location</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className={`card p-6 transition-all ${!loc.is_active ? 'opacity-60' : 'hover:shadow-lg'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${loc.is_active ? 'bg-blue-50' : 'bg-gray-100'}`}>
                    <MapPin className={`w-5 h-5 ${loc.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{loc.name}</h3>
                    <span className={`badge text-xs ${loc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{loc.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <button onClick={() => toggle(loc)} className="text-gray-400 hover:text-blue-600 transition-colors">
                  {loc.is_active ? <ToggleRight className="w-6 h-6 text-blue-500" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
              {loc.address && <p className="text-sm text-gray-500 mb-2">📍 {loc.address}</p>}
              <p className="text-xs text-gray-400 mb-4">🕐 {loc.timezone}</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(loc)} className="btn-secondary btn-sm flex-1 justify-center"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => remove(loc.id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing ? 'Edit Location' : 'Add Location'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="label">Location Name *</label><input required className="input" placeholder="Downtown Branch, Clinic A…" value={form.name} onChange={set('name')} /></div>
              <div><label className="label">Address</label><input className="input" placeholder="123 Main St, City, Country" value={form.address} onChange={set('address')} /></div>
              <div>
                <label className="label">Timezone</label>
                <select className="input" value={form.timezone} onChange={set('timezone')}>
                  {['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Toronto','Europe/London','Europe/Paris','Europe/Berlin','Asia/Dubai','Asia/Singapore','Asia/Tokyo','Australia/Sydney'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
