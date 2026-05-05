'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ListOrdered, Users, TrendingUp, Clock, Plus, ArrowRight,
  AlertCircle, ChevronRight, CheckCircle2, X, Sparkles
} from 'lucide-react'
import { formatWaitTime, PLAN_COLORS } from '@/lib/utils'
import type { Profile, Queue, Organization } from '@/types'

export default function DashboardPage() {
  const params = useSearchParams()
  const showWelcome = params.get('welcome') === 'true'
  const showUpgraded = params.get('upgraded') === 'true'

  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [org,      setOrg]      = useState<Organization | null>(null)
  const [queues,   setQueues]   = useState<Queue[]>([])
  const [stats,    setStats]    = useState({ served_today: 0, waiting: 0, avg_wait: 8 })
  const [loading,  setLoading]  = useState(true)
  const [banner,   setBanner]   = useState<'welcome'|'upgraded'|null>(
    showWelcome ? 'welcome' : showUpgraded ? 'upgraded' : null
  )

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: p }, { data: o }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('organizations').select('*').eq('owner_id', user.id).single(),
      ])
      setProfile(p)
      setOrg(o)

      if (o) {
        const { data: qs } = await supabase
          .from('queues').select('*').eq('organization_id', o.id).eq('status', 'active')

        const qIds = (qs || []).map((q: any) => q.id)
        const withCounts = await Promise.all((qs || []).map(async (q: any) => {
          const { count } = await supabase.from('queue_entries')
            .select('id', { count: 'exact', head: true }).eq('queue_id', q.id).eq('status', 'waiting')
          return { ...q, waiting_count: count || 0 }
        }))
        setQueues(withCounts)

        if (qIds.length) {
          const today = new Date().toISOString().slice(0, 10)
          const [{ count: waiting }, { count: served }] = await Promise.all([
            supabase.from('queue_entries').select('id', { count: 'exact', head: true })
              .in('queue_id', qIds).eq('status', 'waiting'),
            supabase.from('queue_entries').select('id', { count: 'exact', head: true })
              .in('queue_id', qIds).eq('status', 'completed').gte('completed_at', today),
          ])
          setStats({ served_today: served || 0, waiting: waiting || 0, avg_wait: 8 })
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0
  const isTrial = profile?.subscription_status === 'trialing' || profile?.subscription_status === 'active' && profile?.plan === 'free'

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ── Welcome banner ─────────────────────────── */}
      {banner === 'welcome' && (
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white overflow-hidden">
          <button onClick={() => setBanner(null)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute right-8 top-4 opacity-10">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-300" />
            <span className="font-bold text-lg">You're all set, {profile?.full_name?.split(' ')[0] || 'there'}! 🎉</span>
          </div>
          <p className="text-blue-100 text-sm mb-4">Your queue is ready. Share the link or QR code to start accepting customers.</p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/queues" className="btn bg-white text-blue-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-blue-50">
              View Queues →
            </Link>
            <Link href="/display" className="btn bg-white/10 text-white border border-white/30 px-4 py-2 rounded-xl text-sm hover:bg-white/20">
              Set Up Display
            </Link>
          </div>
        </div>
      )}

      {banner === 'upgraded' && (
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <button onClick={() => setBanner(null)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle2 className="w-6 h-6 text-green-200" />
            <span className="font-bold text-lg">Plan upgraded successfully! 🚀</span>
          </div>
          <p className="text-green-100 text-sm">Your new limits are active. Enjoy the extra capacity.</p>
        </div>
      )}

      {/* ── Page header ────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
            {profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
            {org?.name || 'Your organisation'} ·{' '}
            <span className={`badge ${PLAN_COLORS[profile?.plan || 'free']}`}>{profile?.plan} plan</span>
          </p>
        </div>
        <Link href="/queues/new" className="btn-primary hidden sm:flex">
          <Plus className="w-4 h-4" /> New Queue
        </Link>
      </div>

      {/* ── Trial banner ───────────────────────────── */}
      {isTrial && trialDaysLeft <= 14 && profile?.plan === 'free' && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold">
              {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your trial` : 'Trial ended'}
            </div>
            <div className="text-orange-100 text-sm">Upgrade now to keep serving customers without interruption.</div>
          </div>
          <Link href="/billing" className="btn bg-white text-orange-600 font-bold px-5 py-2 rounded-xl hover:bg-orange-50 flex-shrink-0 text-sm whitespace-nowrap">
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* ── Stats row ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Queues', value: queues.length,       icon: ListOrdered, c: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Waiting Now',   value: stats.waiting,       icon: Users,       c: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Served Today',  value: stats.served_today,  icon: TrendingUp,  c: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Avg Wait',      value: formatWaitTime(stats.avg_wait), icon: Clock, c: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.c}`} />
              </div>
              <span className="text-sm text-gray-500 font-medium">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Quick actions (no queues) ───────────────── */}
      {queues.length === 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { href: '/queues/new', icon: Plus, title: 'Create a Queue', desc: 'Set up your first virtual queue', color: 'from-blue-600 to-indigo-600' },
            { href: '/display',    icon: ListOrdered, title: 'Set Up Display', desc: 'TV screen with audio announcements', color: 'from-purple-600 to-pink-600' },
            { href: '/team',       icon: Users, title: 'Invite Team', desc: 'Add staff to manage queues', color: 'from-green-600 to-teal-600' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="card-hover p-5 flex items-center gap-4 group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center flex-shrink-0 shadow group-hover:scale-110 transition-transform`}>
                <a.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900">{a.title}</div>
                <div className="text-sm text-gray-500">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Active queues list ─────────────────────── */}
      {queues.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Active Queues</h2>
            <Link href="/queues" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {queues.map(q => (
              <Link key={q.id} href={`/queues/${q.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black flex-shrink-0 shadow-sm">
                  {q.prefix}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{q.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-mono">/join/{q.public_id}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{(q as any).waiting_count}</div>
                  <div className="text-xs text-gray-400">waiting</div>
                </div>
                <span className={`badge hidden sm:inline-flex ${q.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {q.status}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <Link href="/queues/new" className="btn-ghost btn-sm text-blue-600 hover:bg-blue-50 w-full justify-center">
              <Plus className="w-4 h-4" /> Add Another Queue
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
