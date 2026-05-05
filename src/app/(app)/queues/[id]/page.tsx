'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, PhoneCall, CheckCircle2, UserX, Clock, Users,
  Link2, QrCode, Volume2, VolumeX, Loader2, RefreshCw,
  Pause, Play, X, Save, Bell
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import type { Queue, QueueEntry } from '@/types'

const STATUS_COLORS: Record<string,string> = {
  waiting:'bg-blue-100 text-blue-700', called:'bg-yellow-100 text-yellow-700',
  serving:'bg-purple-100 text-purple-700', completed:'bg-green-100 text-green-700',
  noshow:'bg-red-100 text-red-700', cancelled:'bg-gray-100 text-gray-500',
}

export default function QueueDetailPage() {
  const { id } = useParams<{id:string}>()
  const [queue, setQueue]     = useState<Queue|null>(null)
  const [entries, setEntries] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)
  const [muted, setMuted]     = useState(false)
  const [showQr, setShowQr]   = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({name:'',description:'',avg_service_minutes:10})
  const [counter, setCounter] = useState('Counter 1')
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL||''

  const loadEntries = useCallback(async()=>{
    const {data} = await supabase.from('queue_entries').select('*')
      .eq('queue_id',id).in('status',['waiting','called','serving']).order('position')
    setEntries(data||[])
  },[id])

  useEffect(()=>{
    async function init(){
      const {data:q} = await supabase.from('queues').select('*').eq('id',id).single()
      if(q){setQueue(q);setEditForm({name:q.name,description:q.description||'',avg_service_minutes:q.avg_service_minutes})}
      await loadEntries(); setLoading(false)
    }
    init()
    const channel = supabase.channel(`qm-${id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'queue_entries',filter:`queue_id=eq.${id}`},loadEntries)
      .subscribe()
    return ()=>{ supabase.removeChannel(channel) }
  },[id,loadEntries])

  function announceVoice(ticket:string,ctr=counter){
    if(muted||!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance()
    u.text = `Attention. Ticket ${ticket.split('').join(' ')} — please go to ${ctr}. Ticket ${ticket.split('').join(' ')}.`
    u.rate=0.88; u.pitch=1.1; u.volume=1
    const go=()=>{
      const v=window.speechSynthesis.getVoices()
      const best=['Samantha','Karen','Victoria','Google UK English Female','Google US English','Microsoft Zira']
      for(const n of best){const found=v.find(x=>x.name.includes(n));if(found){u.voice=found;break}}
      window.speechSynthesis.speak(u)
    }
    window.speechSynthesis.getVoices().length===0 ? (window.speechSynthesis.onvoiceschanged=go) : go()
  }

  async function notify(entry:QueueEntry){
    const promises=[]
    if(entry.customer_email) promises.push(fetch('/api/notifications/called',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:entry.customer_email,name:entry.customer_name,ticket:entry.ticket_number,counter})}))
    if(entry.customer_phone) promises.push(fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'called',phone:entry.customer_phone,ticket:entry.ticket_number,queue:queue?.name,counter})}))
    await Promise.allSettled(promises)
  }

  async function callNext(){
    const next=entries.find(e=>e.status==='waiting')
    if(!next){toast.error('No customers waiting');return}
    setCalling(true)
    try{
      await supabase.from('queue_entries').update({status:'called',called_at:new Date().toISOString(),counter}).eq('id',next.id)
      await loadEntries(); announceVoice(next.ticket_number); await notify(next)
      toast.success(`Called ${next.ticket_number}`)
    }catch(err:any){toast.error(err.message)}finally{setCalling(false)}
  }

  async function callEntry(entry:QueueEntry){
    await supabase.from('queue_entries').update({status:'called',called_at:new Date().toISOString(),counter}).eq('id',entry.id)
    await loadEntries(); announceVoice(entry.ticket_number); await notify(entry)
    toast.success(`Called ${entry.ticket_number}`)
  }

  async function updateStatus(entryId:string,status:string){
    await supabase.from('queue_entries').update({status,...(status==='completed'?{completed_at:new Date().toISOString()}:{})}).eq('id',entryId)
    await loadEntries(); toast.success(`Marked as ${status}`)
  }

  async function toggleQueueStatus(){
    if(!queue) return
    const s=queue.status==='active'?'paused':'active'
    await supabase.from('queues').update({status:s}).eq('id',id)
    setQueue(q=>q?{...q,status:s as any}:q); toast.success(`Queue ${s}`)
  }

  async function saveEdit(e:React.FormEvent){
    e.preventDefault()
    await supabase.from('queues').update(editForm).eq('id',id)
    setQueue(q=>q?{...q,...editForm}:q); setShowEdit(false); toast.success('Queue updated')
  }

  if(loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
  if(!queue)  return <div className="text-center py-20 text-gray-500">Queue not found</div>

  const waiting=entries.filter(e=>e.status==='waiting')
  const active=entries.filter(e=>e.status==='called'||e.status==='serving')

  return(
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link href="/queues" className="btn-ghost btn-sm p-2"><ArrowLeft className="w-5 h-5"/></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{queue.name}</h1>
            <span className={`badge ${queue.status==='active'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{queue.status}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Prefix: <strong>{queue.prefix}</strong> · Public ID: <span className="font-mono">{queue.public_id}</span></p>
        </div>
        <select value={counter} onChange={e=>setCounter(e.target.value)} className="text-sm font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none cursor-pointer">
          {['Counter 1','Counter 2','Counter 3','Window A','Window B','Desk A','Desk B'].map(c=><option key={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={()=>setMuted(m=>!m)} className={`btn-ghost btn-sm ${muted?'text-gray-400':'text-green-600'}`}>{muted?<VolumeX className="w-4 h-4"/>:<Volume2 className="w-4 h-4"/>}</button>
          <button onClick={()=>{navigator.clipboard.writeText(`${APP_URL}/join/${queue.public_id}`);toast.success('Link copied!')}} className="btn-secondary btn-sm"><Link2 className="w-4 h-4"/> Copy Link</button>
          <button onClick={()=>setShowQr(true)} className="btn-secondary btn-sm"><QrCode className="w-4 h-4"/> QR</button>
          <button onClick={toggleQueueStatus} className="btn-secondary btn-sm">{queue.status==='active'?<><Pause className="w-4 h-4"/> Pause</>:<><Play className="w-4 h-4"/> Resume</>}</button>
          <button onClick={()=>setShowEdit(true)} className="btn-secondary btn-sm hidden sm:flex">Edit</button>
          <button onClick={callNext} disabled={calling||waiting.length===0} className="btn-primary">
            {calling?<><Loader2 className="w-4 h-4 animate-spin"/> Calling…</>:<><PhoneCall className="w-4 h-4"/> Call Next</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Waiting',v:waiting.length,icon:Users,c:'text-blue-600',bg:'bg-blue-50'},
          {label:'Serving',v:active.length,icon:PhoneCall,c:'text-yellow-600',bg:'bg-yellow-50'},
          {label:'Est. wait',v:waiting.length>0?`~${Math.round(waiting.length*queue.avg_service_minutes*0.6)}m`:'—',icon:Clock,c:'text-orange-600',bg:'bg-orange-50'},
        ].map(s=>(
          <div key={s.label} className="card p-4 text-center">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}><s.icon className={`w-5 h-5 ${s.c}`}/></div>
            <div className="text-2xl font-bold text-gray-900">{s.v}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active */}
      {active.length>0&&(
        <div className="card overflow-hidden border-yellow-200">
          <div className="px-5 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-yellow-600"/>
            <span className="font-bold text-yellow-800 text-sm">Currently Serving ({active.length})</span>
          </div>
          {active.map(e=><EntryRow key={e.id} entry={e} onUpdate={updateStatus} highlight/>)}
        </div>
      )}

      {/* Waiting */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Waiting <span className="text-blue-600">({waiting.length})</span></h3>
          <button onClick={loadEntries} className="btn-ghost btn-sm p-1.5 text-gray-400"><RefreshCw className="w-4 h-4"/></button>
        </div>
        {waiting.length===0?(
          <div className="py-14 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30"/>
            <p>Queue is empty. Share the link to start accepting customers.</p>
          </div>
        ):waiting.map(e=><EntryRow key={e.id} entry={e} onUpdate={updateStatus} onCall={()=>callEntry(e)}/>)}
      </div>

      {/* QR Modal */}
      {showQr&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setShowQr(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1">{queue.name}</h3>
            <p className="text-sm text-gray-500 mb-5">Customers scan to join</p>
            <div className="flex justify-center mb-5 p-3 bg-white border border-gray-100 rounded-xl">
              <QRCodeSVG value={`${APP_URL}/join/${queue.public_id}`} size={220} marginSize={2} level="M"/>
            </div>
            <p className="text-xs text-gray-400 font-mono break-all mb-5">{APP_URL}/join/{queue.public_id}</p>
            <div className="flex gap-3">
              <button onClick={()=>{navigator.clipboard.writeText(`${APP_URL}/join/${queue.public_id}`);toast.success('Copied!')}} className="btn-secondary flex-1 btn-sm">Copy URL</button>
              <button onClick={()=>setShowQr(false)} className="btn-primary flex-1 btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setShowEdit(false)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold">Edit Queue</h3>
              <button onClick={()=>setShowEdit(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={saveEdit} className="space-y-4">
              <div><label className="label">Queue Name</label><input required className="input" value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/></div>
              <div><label className="label">Description</label><input className="input" value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))}/></div>
              <div><label className="label">Avg. Service (min)</label><input type="number" className="input" min={1} max={120} value={editForm.avg_service_minutes} onChange={e=>setEditForm(f=>({...f,avg_service_minutes:Number(e.target.value)}))}/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowEdit(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center"><Save className="w-4 h-4"/> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function EntryRow({entry,onUpdate,onCall,highlight=false}:{entry:QueueEntry,onUpdate:(id:string,s:string)=>void,onCall?:()=>void,highlight?:boolean}){
  const waitMin=entry.joined_at?Math.round((Date.now()-new Date(entry.joined_at).getTime())/60000):0
  return(
    <div className={`flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${highlight?'bg-yellow-50/30':''}`}>
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
        {entry.ticket_number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 truncate">{entry.customer_name}</div>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
          {entry.customer_phone&&<span>📱 {entry.customer_phone}</span>}
          {entry.customer_email&&<span>✉️ {entry.customer_email.split('@')[0]}…</span>}
          <span>⏱ {waitMin}m</span>
          <span>#{entry.position}</span>
          {entry.counter&&<span>→ {entry.counter}</span>}
        </div>
      </div>
      <span className={`badge hidden sm:inline-flex capitalize ${STATUS_COLORS[entry.status]||'bg-gray-100 text-gray-500'}`}>{entry.status}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {entry.status==='waiting'&&onCall&&<button onClick={onCall} className="btn-ghost btn-sm text-blue-600" title="Call"><PhoneCall className="w-4 h-4"/></button>}
        {(entry.status==='called'||entry.status==='serving')&&<button onClick={()=>onUpdate(entry.id,'completed')} className="btn-ghost btn-sm text-green-600" title="Complete"><CheckCircle2 className="w-4 h-4"/></button>}
        <button onClick={()=>onUpdate(entry.id,'noshow')} className="btn-ghost btn-sm text-red-400" title="No show"><UserX className="w-4 h-4"/></button>
      </div>
    </div>
  )
}
