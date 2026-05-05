'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, TrendingUp, Users, Clock, CheckCircle2, Download } from 'lucide-react'
import { format, subDays, parseISO } from 'date-fns'

interface DayData { date: string; served: number; waiting: number }

export default function AnalyticsPage() {
  const [stats,   setStats]   = useState({ served: 0, waiting: 0, queues: 0, avgWait: 0, noshow: 0 })
  const [recent,  setRecent]  = useState<any[]>([])
  const [weekly,  setWeekly]  = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [queueFilter, setQueueFilter] = useState<string>('all')
  const [queues, setQueues] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('owner_id', user.id).single()
      if (!org) return

      const { data: qs } = await supabase.from('queues').select('id,name').eq('organization_id', org.id)
      setQueues(qs || [])
      const qIds = (qs || []).map((q: any) => q.id)
      if (!qIds.length) { setLoading(false); return }

      const today = new Date().toISOString().slice(0, 10)
      const weekAgo = subDays(new Date(), 6).toISOString()

      const [
        { count: waiting },
        { data: todayCompleted },
        { data: todayNoshow },
        { data: recentData },
        { data: weekData },
      ] = await Promise.all([
        supabase.from('queue_entries').select('id', { count: 'exact', head: true })
          .in('queue_id', qIds).eq('status', 'waiting'),
        supabase.from('queue_entries').select('id', { count: 'exact', head: true })
          .in('queue_id', qIds).eq('status', 'completed').gte('completed_at', today) as any,
        supabase.from('queue_entries').select('id', { count: 'exact', head: true })
          .in('queue_id', qIds).eq('status', 'noshow').gte('joined_at', today) as any,
        supabase.from('queue_entries')
          .select('*, queues(name)')
          .in('queue_id', qIds)
          .order('joined_at', { ascending: false })
          .limit(30),
        supabase.from('queue_entries')
          .select('joined_at, status, completed_at')
          .in('queue_id', qIds)
          .gte('joined_at', weekAgo),
      ])

      setStats({
        served:  todayCompleted?.count || 0,
        waiting: waiting || 0,
        queues:  qIds.length,
        avgWait: 8,
        noshow:  todayNoshow?.count || 0,
      })
      setRecent(recentData || [])

      // Build last-7-days chart data
      const days: DayData[] = Array.from({ length: 7 }, (_, i) => {
        const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
        const dayEntries = (weekData || []).filter(e => e.joined_at?.startsWith(d))
        return { date: d, served: dayEntries.filter(e => e.status === 'completed').length, waiting: dayEntries.length }
      })
      setWeekly(days)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const maxVal = Math.max(...weekly.map(d => d.served), 1)

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Queue performance · Today</p>
        </div>
        <select
          value={queueFilter}
          onChange={e => setQueueFilter(e.target.value)}
          className="input w-auto min-w-[180px]"
        >
          <option value="all">All Queues</option>
          {queues.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Served Today',    value: stats.served,  icon: CheckCircle2, c: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Waiting Now',     value: stats.waiting, icon: Users,        c: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Active Queues',   value: stats.queues,  icon: BarChart3,    c: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Wait (min)',  value: `${stats.avgWait}m`, icon: Clock,  c: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'No-shows Today',  value: stats.noshow,  icon: TrendingUp,   c: 'text-red-600',    bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.c}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 7-day bar chart */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" /> Customers Served — Last 7 Days
        </h2>
        <div className="flex items-end gap-3 h-40">
          {weekly.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-gray-600">{d.served > 0 ? d.served : ''}</span>
              <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-500 min-h-[4px]"
                style={{ height: `${Math.max((d.served / maxVal) * 120, 4)}px` }} />
              <span className="text-xs text-gray-400">{format(parseISO(d.date), 'EEE')}</span>
            </div>
          ))}
        </div>
        {weekly.every(d => d.served === 0) && (
          <p className="text-center text-gray-400 text-sm mt-4">No data yet — start serving customers to see your chart.</p>
        )}
      </div>

      {/* Recent activity table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Activity</h2>
          <span className="text-xs text-gray-400">Last 30 entries</span>
        </div>
        {recent.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No activity yet. Share your queue links to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Ticket','Customer','Queue','Status','Joined','Wait'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map(e => {
                  const waitMin = e.completed_at && e.joined_at
                    ? Math.round((new Date(e.completed_at).getTime() - new Date(e.joined_at).getTime()) / 60000)
                    : null
                  return (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-bold text-blue-600">{e.ticket_number}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{e.customer_name}</td>
                      <td className="px-5 py-3 text-gray-500">{e.queues?.name || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`badge capitalize text-xs ${
                          e.status === 'completed' ? 'bg-green-100 text-green-700' :
                          e.status === 'waiting'   ? 'bg-blue-100 text-blue-700' :
                          e.status === 'noshow'    ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{e.status}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{new Date(e.joined_at).toLocaleString()}</td>
                      <td className="px-5 py-3 text-gray-500">{waitMin !== null ? `${waitMin}m` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
