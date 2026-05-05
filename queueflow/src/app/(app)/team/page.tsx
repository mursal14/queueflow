'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserPlus, Loader2, Trash2, Shield, User, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import type { TeamMember } from '@/types'

const ROLES = [{ id: 'admin', label: 'Admin', icon: Shield, desc: 'Full access' }, { id: 'staff', label: 'Staff', icon: User, desc: 'Manage queues' }, { id: 'viewer', label: 'Viewer', icon: Eye, desc: 'View only' }]

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviting, setInviting] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
    if (!org) return
    setOrgId(org.id)
    const { data } = await supabase.from('team_members').select('*').eq('organization_id', org.id).order('invited_at', { ascending: false })
    setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    try {
      const { error } = await supabase.from('team_members').insert({ organization_id: orgId, email: inviteEmail, role: inviteRole })
      if (error) throw error
      // Send invite email via API
      await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, orgId }),
      })
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setInviting(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Remove this team member?')) return
    await supabase.from('team_members').delete().eq('id', id)
    toast.success('Member removed')
    load()
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div><h1 className="text-2xl font-bold text-gray-900">Team Management</h1><p className="text-gray-500 text-sm mt-0.5">Invite staff to manage queues</p></div>

      {/* Invite form */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /> Invite Team Member</h2>
        <form onSubmit={invite} className="flex flex-col sm:flex-row gap-3">
          <input type="email" required className="input flex-1" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <select className="input sm:w-36" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <button type="submit" disabled={inviting} className="btn-primary whitespace-nowrap">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {inviting ? 'Inviting…' : 'Send Invite'}
          </button>
        </form>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {ROLES.map(r => (
            <div key={r.id} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${inviteRole === r.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setInviteRole(r.id)}>
              <r.icon className="w-4 h-4 text-blue-600 mb-1" />
              <div className="text-sm font-semibold text-gray-900">{r.label}</div>
              <div className="text-xs text-gray-500">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Members list */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">Team Members ({members.length})</h2></div>
        {loading ? <div className="py-10 flex justify-center"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          : members.length === 0 ? (
            <div className="py-12 text-center text-gray-400"><p>No team members yet. Invite someone above.</p></div>
          ) : members.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">{m.email[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{m.email}</div>
                <div className="text-xs text-gray-400">Invited {new Date(m.invited_at || '').toLocaleDateString()}</div>
              </div>
              <span className="badge bg-blue-100 text-blue-700 capitalize">{m.role}</span>
              <span className={`badge ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
              <button onClick={() => remove(m.id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
      </div>
    </div>
  )
}
