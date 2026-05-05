'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Volume2, VolumeX, Wifi, WifiOff, Maximize2 } from 'lucide-react'

export default function DisplayDashboard() {
  const { token }   = useParams<{ token: string }>()
  const [screen, setScreen]         = useState<any>(null)
  const [queues, setQueues]         = useState<any[]>([])
  const [calledEntries, setCalled]  = useState<any[]>([])
  const [muted, setMuted]           = useState(false)
  const [connected, setConnected]   = useState(false)
  const [time, setTime]             = useState(new Date())
  const announcedRef = useRef<Set<string>>(new Set())
  const screenRef    = useRef<any>(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── voice ────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (muted || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance()
    u.text   = text
    u.rate   = screenRef.current?.voice_rate  || 0.88
    u.pitch  = screenRef.current?.voice_pitch || 1.1
    u.volume = 1

    const FEMALE = ['Samantha','Karen','Victoria','Moira','Google UK English Female','Google US English','Microsoft Zira']
    const MALE   = ['Daniel','Alex','Tom','Google UK English Male','Fred','Microsoft David']
    const prefs  = screenRef.current?.voice_gender === 'male' ? MALE : FEMALE

    const go = () => {
      const voices = window.speechSynthesis.getVoices()
      for (const name of prefs) {
        const v = voices.find(x => x.name.includes(name))
        if (v) { u.voice = v; break }
      }
      window.speechSynthesis.speak(u)
    }
    window.speechSynthesis.getVoices().length === 0
      ? (window.speechSynthesis.onvoiceschanged = go)
      : go()
  }, [muted])

  // ── load data ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data: s } = await supabase
      .from('display_screens')
      .select('*, organizations(name, primary_color)')
      .eq('access_token', token)
      .single()
    if (!s) return
    setScreen(s); screenRef.current = s; setConnected(true)

    const { data: qs } = await supabase
      .from('queues')
      .select('id, name, prefix, avg_service_minutes')
      .eq('organization_id', s.organization_id)
      .eq('status', 'active')

    if (!qs?.length) { setQueues([]); return }

    const enriched = await Promise.all(qs.map(async (q: any) => {
      const { data: entries } = await supabase
        .from('queue_entries')
        .select('ticket_number, customer_name, position, status, called_at')
        .eq('queue_id', q.id)
        .in('status', ['waiting', 'called', 'serving'])
        .order('position')
      return {
        ...q,
        waiting: (entries || []).filter(e => e.status === 'waiting'),
        active:  (entries || []).filter(e => e.status === 'called' || e.status === 'serving'),
      }
    }))

    setQueues(enriched)

    // Collect all called tickets
    const called = enriched.flatMap(q => q.active)
    setCalled(called)

    // Announce new calls
    if (s.voice_enabled) {
      called.forEach(e => {
        const key = e.ticket_number
        if (!announcedRef.current.has(key)) {
          announcedRef.current.add(key)
          // Small delay so voice triggers after render
          setTimeout(() => speak(
            `Attention please. Ticket number ${e.ticket_number.split('').join(' ')}. Please proceed to the service counter. Ticket ${e.ticket_number.split('').join(' ')}.`
          ), 400)
        }
      })
    }
    // Clean up announced set for entries no longer active
    const activeKeys = new Set(called.map(e => e.ticket_number))
    announcedRef.current.forEach(k => { if (!activeKeys.has(k)) announcedRef.current.delete(k) })
  }, [token, speak])

  useEffect(() => {
    loadData()
    const channel = supabase.channel('display-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, loadData)
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen()
  }

  if (!screen) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading display…</p>
      </div>
    </div>
  )

  const color   = screen.organizations?.primary_color || '#3b82f6'
  const orgName = screen.organizations?.name || 'QueueFlow'
  const cols    = Math.min(queues.length || 1, 3)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none">

      {/* ── TOP BAR ──────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black" style={{ color }}>{orgName}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{screen.name}</p>
        </div>

        <div className="flex items-center gap-6">
          {/* Clock */}
          <div className="text-right">
            <div className="text-4xl font-bold tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-gray-500 text-sm">{time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <button onClick={() => setMuted(m => !m)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              {muted ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-green-400" />}
            </button>
            <button onClick={fullscreen} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ── NOW SERVING BANNER ───────────────────────────── */}
      {calledEntries.length > 0 && (
        <div className="mx-6 mt-5 rounded-2xl overflow-hidden flex-shrink-0">
          <div className="text-center text-sm font-black uppercase tracking-[0.2em] py-2.5" style={{ background: color }}>
            ✦ Now Serving ✦
          </div>
          <div className="bg-white/5 border-x border-b border-white/10 rounded-b-2xl px-6 py-5 flex flex-wrap gap-4 justify-center">
            {calledEntries.slice(0, 8).map(e => (
              <div
                key={e.ticket_number}
                className="px-8 py-4 rounded-2xl text-center min-w-[110px] border-2 animate-fade-in"
                style={{ backgroundColor: `${color}25`, borderColor: `${color}60` }}
              >
                <div className="text-5xl font-black" style={{ color }}>{e.ticket_number}</div>
                <div className="text-gray-400 text-xs mt-1 truncate max-w-[100px]">{e.customer_name.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QUEUE PANELS ─────────────────────────────────── */}
      <div
        className="flex-1 p-6 grid gap-5 overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {queues.length === 0 && (
          <div className="col-span-3 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-xl font-semibold">No active queues</p>
              <p className="text-sm mt-2">Create a queue in the dashboard to see it here.</p>
            </div>
          </div>
        )}
        {queues.map(q => (
          <div key={q.id} className="bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
            {/* Queue header */}
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10" style={{ background: `${color}18` }}>
              <span className="font-bold text-lg tracking-wide">{q.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{q.waiting.length} waiting</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {q.waiting.length === 0 && q.active.length === 0 && (
                <div className="py-8 text-center text-gray-600 text-sm">Queue is empty</div>
              )}
              {q.waiting.slice(0, 10).map((e: any, i: number) => (
                <div
                  key={e.ticket_number}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    i === 0 ? 'bg-white/15 border border-white/20' : 'bg-white/5'
                  }`}
                >
                  <span className={`font-black text-xl w-16 flex-shrink-0 ${i === 0 ? 'text-white' : 'text-gray-400'}`} style={i === 0 ? { color } : {}}>
                    {e.ticket_number}
                  </span>
                  <span className={`flex-1 truncate text-sm ${i === 0 ? 'text-white font-semibold' : 'text-gray-500'}`}>
                    {e.customer_name}
                  </span>
                  {i === 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color, background: `${color}25` }}>
                      NEXT
                    </span>
                  )}
                  {i > 0 && (
                    <span className="text-xs text-gray-600">#{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="px-8 py-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-600 flex-shrink-0">
        <span>Powered by QueueFlow</span>
        <div className="flex items-center gap-2">
          {connected
            ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Live</>
            : <><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Reconnecting…</>
          }
        </div>
      </footer>
    </div>
  )
}
