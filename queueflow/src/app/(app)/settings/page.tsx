'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Loader2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const [{ data: p }, { data: o }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('organizations').select('*').eq('owner_id', user.id).single(),
      ])
      setProfile(p)
      setOrg(o)
    })
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await Promise.all([
        supabase.from('profiles').update({ full_name: profile.full_name }).eq('id', profile.id),
        supabase.from('organizations').update({ name: org.name, primary_color: org.primary_color, address: org.address }).eq('id', org.id),
      ])
      toast.success('Settings saved!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-500 text-sm mt-0.5">Manage your account and organisation</p></div>

      <form onSubmit={saveProfile} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Personal</h2>
          <div><label className="label">Full Name</label><input className="input" value={profile.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input bg-gray-50" disabled value={profile.email} /></div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /> Organisation</h2>
          <div><label className="label">Organisation Name</label><input className="input" value={org?.name || ''} onChange={e => setOrg({ ...org, name: e.target.value })} /></div>
          <div><label className="label">Address</label><input className="input" placeholder="123 Main St, City, Country" value={org?.address || ''} onChange={e => setOrg({ ...org, address: e.target.value })} /></div>
          <div>
            <label className="label">Brand Colour</label>
            <div className="flex items-center gap-3">
              <input type="color" className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5" value={org?.primary_color || '#3b82f6'} onChange={e => setOrg({ ...org, primary_color: e.target.value })} />
              <input className="input" value={org?.primary_color || '#3b82f6'} onChange={e => setOrg({ ...org, primary_color: e.target.value })} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3.5">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </form>
    </div>
  )
}
