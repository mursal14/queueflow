'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Building2, ListOrdered, Monitor, CheckCircle2, ArrowRight, Loader2, Users2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, icon: Building2, title: 'Set Up Your Organisation', desc: 'Tell us about your business' },
  { id: 2, icon: ListOrdered, title: 'Create Your First Queue', desc: 'Start accepting customers' },
  { id: 3, icon: Monitor, title: 'Set Up a Display Screen', desc: 'Show queue status on any TV' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [orgId, setOrgId] = useState('')

  const [orgData, setOrgData] = useState({ name: '', address: '', timezone: 'America/New_York', primary_color: '#3b82f6' })
  const [queueData, setQueueData] = useState({ name: '', prefix: 'A', avg_service_minutes: 10, description: '' })
  const [displayData, setDisplayData] = useState({ name: 'Main Lobby Display', theme: 'dark', voice_enabled: true })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      supabase.from('organizations').select('id, name').eq('owner_id', user.id).single().then(({ data }) => {
        if (data) { setOrgId(data.id); setOrgData(d => ({ ...d, name: data.name })) }
      })
    })
  }, [router])

  async function saveOrg() {
    setSaving(true)
    try {
      if (orgId) {
        await supabase.from('organizations').update(orgData).eq('id', orgId)
      } else {
        const slug = orgData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now().toString(36)
        const { data } = await supabase.from('organizations').insert({ ...orgData, owner_id: userId, slug }).select().single()
        if (data) setOrgId(data.id)
      }
      await supabase.from('profiles').update({ onboarding_step: 2 }).eq('id', userId)
      setStep(2)
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  async function saveQueue() {
    setSaving(true)
    try {
      await supabase.from('queues').insert({ ...queueData, organization_id: orgId })
      await supabase.from('profiles').update({ onboarding_step: 3 }).eq('id', userId)
      setStep(3)
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  async function saveDisplay() {
    setSaving(true)
    try {
      if (displayData.name) {
        await supabase.from('display_screens').insert({ ...displayData, organization_id: orgId })
      }
      await supabase.from('profiles').update({ onboarding_step: 4, onboarding_done: true }).eq('id', userId)
      router.push('/dashboard?welcome=true')
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  const set = (setter: any) => (k: string) => (e: any) =>
    setter((d: any) => ({ ...d, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <Users2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">Queue<span className="text-blue-600">Flow</span></span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-400'}`}>
                  {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                </div>
                <span className={`text-xs mt-1 font-medium ${step === s.id ? 'text-blue-600' : 'text-gray-400'}`}>{s.title.split(' ')[0]}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step cards */}
      <div className="w-full max-w-lg">
        {step === 1 && (
          <div className="card p-8 shadow-xl">
            <Building2 className="w-10 h-10 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Set Up Your Organisation</h1>
            <p className="text-gray-500 text-sm mb-6">This info appears on customer-facing pages and displays.</p>
            <div className="space-y-4">
              <div><label className="label">Organisation / Business Name *</label><input required className="input" placeholder="Acme Medical Centre" value={orgData.name} onChange={e => setOrgData(d => ({ ...d, name: e.target.value }))} /></div>
              <div><label className="label">Address</label><input className="input" placeholder="123 Main St, City, Country" value={orgData.address} onChange={e => setOrgData(d => ({ ...d, address: e.target.value }))} /></div>
              <div>
                <label className="label">Timezone</label>
                <select className="input" value={orgData.timezone} onChange={e => setOrgData(d => ({ ...d, timezone: e.target.value }))}>
                  {['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Toronto','Europe/London','Europe/Paris','Europe/Berlin','Asia/Dubai','Asia/Singapore','Asia/Tokyo','Australia/Sydney'].map(tz => <option key={tz} value={tz}>{tz.replace('_',' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Brand Colour</label>
                <div className="flex gap-3 items-center">
                  <input type="color" className="w-12 h-10 rounded-lg border border-gray-300 p-0.5 cursor-pointer" value={orgData.primary_color} onChange={e => setOrgData(d => ({ ...d, primary_color: e.target.value }))} />
                  <span className="text-sm text-gray-600 font-mono">{orgData.primary_color}</span>
                  <div className="flex gap-2 ml-auto">
                    {['#3b82f6','#059669','#7c3aed','#dc2626','#d97706','#0891b2'].map(c => (
                      <button key={c} type="button" className={`w-6 h-6 rounded-full border-2 transition-all ${orgData.primary_color === c ? 'border-gray-900 scale-125' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setOrgData(d => ({ ...d, primary_color: c }))} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={saveOrg} disabled={saving || !orgData.name} className="btn-primary w-full justify-center mt-6 py-3.5">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card p-8 shadow-xl">
            <ListOrdered className="w-10 h-10 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold mb-1">Create Your First Queue</h1>
            <p className="text-gray-500 text-sm mb-6">Customers will join this queue from a unique public link.</p>
            <div className="space-y-4">
              <div><label className="label">Queue Name *</label><input required className="input" placeholder="e.g. Customer Service, Counter A, Main Queue" value={queueData.name} onChange={e => setQueueData(d => ({ ...d, name: e.target.value }))} /></div>
              <div><label className="label">Description</label><input className="input" placeholder="Brief description for customers" value={queueData.description} onChange={e => setQueueData(d => ({ ...d, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ticket Prefix</label>
                  <select className="input" value={queueData.prefix} onChange={e => setQueueData(d => ({ ...d, prefix: e.target.value }))}>
                    {['A','B','C','D','VIP','GEN','SVC'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Tickets: {queueData.prefix}001, {queueData.prefix}002…</p>
                </div>
                <div>
                  <label className="label">Avg. Service (min)</label>
                  <input type="number" className="input" min={1} max={120} value={queueData.avg_service_minutes} onChange={e => setQueueData(d => ({ ...d, avg_service_minutes: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">← Back</button>
              <button onClick={saveQueue} disabled={saving || !queueData.name} className="btn-primary flex-1 justify-center">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card p-8 shadow-xl">
            <Monitor className="w-10 h-10 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold mb-1">Set Up a Display Screen</h1>
            <p className="text-gray-500 text-sm mb-6">Open the display URL on any TV or monitor in your waiting area. Customers will see real-time updates with audio announcements.</p>
            <div className="space-y-4">
              <div><label className="label">Screen Name</label><input className="input" placeholder="Main Lobby Display" value={displayData.name} onChange={e => setDisplayData(d => ({ ...d, name: e.target.value }))} /></div>
              <div>
                <label className="label">Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ id: 'dark', label: '🌙 Dark', desc: 'Best for most screens' }, { id: 'light', label: '☀️ Light', desc: 'High-contrast rooms' }].map(t => (
                    <div key={t.id} onClick={() => setDisplayData(d => ({ ...d, theme: t.id }))} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${displayData.theme === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="font-semibold text-gray-900 text-sm">{t.label}</div>
                      <div className="text-xs text-gray-500">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50">
                <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={displayData.voice_enabled} onChange={e => setDisplayData(d => ({ ...d, voice_enabled: e.target.checked }))} />
                <div><div className="text-sm font-semibold text-gray-900">Enable Voice Announcements</div><div className="text-xs text-gray-500">Natural-sounding audio calls ticket numbers</div></div>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center">← Back</button>
              <button onClick={saveDisplay} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Go to Dashboard 🎉</>}
              </button>
            </div>
            <button onClick={() => saveDisplay()} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3">Skip for now</button>
          </div>
        )}
      </div>
    </div>
  )
}
