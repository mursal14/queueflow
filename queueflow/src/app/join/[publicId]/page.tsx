'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Users, Clock, Ticket, CheckCircle2, AlertCircle, Loader2, Bell, MessageSquare } from 'lucide-react'
import { formatWaitTime, estimateWait } from '@/lib/utils'
import type { Queue, QueueEntry } from '@/types'

type Step = 'loading'|'form'|'queued'|'called'|'done'|'closed'|'error'

export default function JoinQueuePage() {
  const { publicId } = useParams<{publicId:string}>()
  const [queue,   setQueue]   = useState<Queue|null>(null)
  const [org,     setOrg]     = useState<any>(null)
  const [entry,   setEntry]   = useState<QueueEntry|null>(null)
  const [step,    setStep]    = useState<Step>('loading')
  const [form,    setForm]    = useState({customer_name:'',customer_phone:'',customer_email:''})
  const [submitting, setSubmitting] = useState(false)
  const [waitingCount,setWaitingCount] = useState(0)
  const [error,   setError]   = useState('')
  const set=(k:string)=>(e:React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    async function init(){
      const {data:q} = await supabase.from('queues').select('*').eq('public_id',publicId).single()
      if(!q){setStep('error');return}
      setQueue(q)
      if(q.status==='closed'){setStep('closed');return}
      // Load org for branding
      const {data:o} = await supabase.from('organizations').select('name,primary_color').eq('id',q.organization_id).single()
      setOrg(o)
      // Current count
      const {count} = await supabase.from('queue_entries').select('id',{count:'exact',head:true}).eq('queue_id',q.id).eq('status','waiting')
      setWaitingCount(count||0)
      setStep('form')
    }
    init()
  },[publicId])

  const refreshEntry = useCallback(async()=>{
    if(!entry) return
    const {data} = await supabase.from('queue_entries').select('*').eq('id',entry.id).single()
    if(!data) return
    setEntry(data)
    if(data.status==='called'||data.status==='serving') setStep('called')
    else if(data.status==='completed') setStep('done')
  },[entry])

  useEffect(()=>{
    if(!entry||!queue) return
    const channel = supabase.channel(`entry-${entry.id}`)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'queue_entries',filter:`id=eq.${entry.id}`},(p)=>{
        const u=p.new as QueueEntry
        setEntry(u)
        if(u.status==='called'||u.status==='serving') setStep('called')
        else if(u.status==='completed') setStep('done')
      })
      .on('postgres_changes',{event:'*',schema:'public',table:'queue_entries',filter:`queue_id=eq.${queue.id}`},async()=>{
        const {count} = await supabase.from('queue_entries').select('id',{count:'exact',head:true}).eq('queue_id',queue.id).eq('status','waiting')
        setWaitingCount(count||0)
        refreshEntry()
      })
      .subscribe()
    return ()=>{supabase.removeChannel(channel)}
  },[entry,queue,refreshEntry])

  async function handleJoin(e:React.FormEvent){
    e.preventDefault()
    if(!queue) return
    // Check capacity
    if(waitingCount>=(queue.max_capacity||200)){
      setError('This queue is at capacity. Please try again later.')
      return
    }
    setSubmitting(true); setError('')
    try{
      const {data:ticket} = await supabase.rpc('next_ticket',{queue_uuid:queue.id})
      const {count:pos} = await supabase.from('queue_entries').select('id',{count:'exact',head:true}).eq('queue_id',queue.id).eq('status','waiting')
      const position=(pos||0)+1
      const {data:newEntry,error:err} = await supabase.from('queue_entries').insert({
        queue_id:queue.id,
        ticket_number:ticket,
        customer_name:form.customer_name,
        customer_phone:form.customer_phone||null,
        customer_email:form.customer_email||null,
        position,
      }).select().single()
      if(err) throw err
      setEntry(newEntry)
      setWaitingCount(position)

      // Notifications (fire and forget — don't block UI)
      const queueName = queue.name
      if(form.customer_email){
        fetch('/api/notifications/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.customer_email,name:form.customer_name,ticket,queue:queueName,position})})
      }
      if(form.customer_phone){
        fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'join',phone:form.customer_phone,ticket,queue:queueName,position})})
      }
      setStep('queued')
    }catch(err:any){
      setError(err.message||'Failed to join queue')
    }finally{setSubmitting(false)}
  }

  const brandColor = org?.primary_color || '#3b82f6'
  const waitMin = entry ? estimateWait(entry.position, queue?.avg_service_minutes||10) : 0

  return(
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand header */}
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg" style={{background:`linear-gradient(135deg,${brandColor},${brandColor}dd)`}}>
            <Users className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{org?.name||queue?.name||'Queue'}</h1>
          {queue&&<p className="text-gray-500 text-sm mt-1">{queue.name}</p>}
        </div>

        {step==='loading'&&(
          <div className="card p-12 text-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto"/></div>
        )}

        {step==='error'&&(
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3"/>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Not Found</h2>
            <p className="text-gray-500">This queue link is invalid or has been removed.</p>
          </div>
        )}

        {step==='closed'&&(
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3"/>
            <h2 className="text-xl font-bold mb-2">Queue Closed</h2>
            <p className="text-gray-500">Not accepting customers right now. Please try again later.</p>
          </div>
        )}

        {step==='form'&&queue&&(
          <div className="card p-7 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Join the Queue</h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl">
                <Users className="w-3.5 h-3.5"/>
                <span>{waitingCount} waiting</span>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="label">Your Name <span className="text-red-500">*</span></label>
                <input required className="input" placeholder="John Smith" value={form.customer_name} onChange={set('customer_name')}/>
              </div>
              <div>
                <label className="label">Phone Number {queue.require_phone&&<span className="text-red-500">*</span>}
                  {!queue.require_phone&&<span className="text-gray-400 text-xs font-normal ml-1">— for SMS alerts</span>}
                </label>
                <input type="tel" className="input" placeholder="+1 555 000 0000"
                  required={queue.require_phone}
                  value={form.customer_phone} onChange={set('customer_phone')}/>
              </div>
              <div>
                <label className="label">Email {queue.require_email&&<span className="text-red-500">*</span>}
                  {!queue.require_email&&<span className="text-gray-400 text-xs font-normal ml-1">— for email alerts</span>}
                </label>
                <input type="email" className="input" placeholder="john@email.com"
                  required={queue.require_email}
                  value={form.customer_email} onChange={set('customer_email')}/>
              </div>

              {(form.customer_phone||form.customer_email)&&(
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-blue-700">
                  <Bell className="w-3.5 h-3.5 flex-shrink-0"/>
                  We'll notify you when it's your turn
                </div>
              )}

              {error&&<div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

              <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl text-white shadow-lg hover:opacity-90 transition-all disabled:opacity-60" style={{background:`linear-gradient(135deg,${brandColor},${brandColor}dd)`}}>
                {submitting?<><Loader2 className="w-5 h-5 animate-spin"/> Joining…</>:<>Join Queue &rarr;</>}
              </button>
            </form>

            {waitingCount===0?(
              <p className="text-center text-sm text-green-600 font-semibold mt-3">🎉 No one waiting — you'd be first!</p>
            ):(
              <p className="text-center text-xs text-gray-400 mt-3">
                Est. wait: ~{formatWaitTime(waitingCount*(queue.avg_service_minutes||10))}
              </p>
            )}
          </div>
        )}

        {step==='queued'&&entry&&queue&&(
          <div className="card p-8 text-center shadow-xl">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg" style={{background:`linear-gradient(135deg,${brandColor},${brandColor}cc)`}}>
              <Ticket className="w-10 h-10 text-white"/>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">You're in the queue!</h2>
            <p className="text-gray-500 text-sm mb-6">Keep this page open. It updates automatically.</p>

            <div className="rounded-2xl p-6 mb-5 border-2" style={{background:`${brandColor}0f`,borderColor:`${brandColor}30`}}>
              <div className="text-6xl font-black mb-1" style={{color:brandColor}}>{entry.ticket_number}</div>
              <div className="text-sm text-gray-500">Your ticket</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-gray-900">#{entry.position}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 justify-center mt-1"><Users className="w-3 h-3"/> Position</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-gray-900">{waitMin>0?`~${Math.round(waitMin)}m`:'Soon!'}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 justify-center mt-1"><Clock className="w-3 h-3"/> Est. wait</div>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700 text-left">
              <Bell className="w-4 h-4 mt-0.5 flex-shrink-0"/>
              <span>This page updates live. {(entry.customer_phone||entry.customer_email)?'We\'ll also notify you.':''} Stay close!</span>
            </div>
          </div>
        )}

        {step==='called'&&entry&&(
          <div className="card p-8 text-center shadow-xl border-2 border-green-400">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 animate-bounce">
              <Bell className="w-10 h-10 text-green-600"/>
            </div>
            <h2 className="text-3xl font-extrabold text-green-700 mb-2">It's Your Turn!</h2>
            <p className="text-gray-600 mb-6">Please go to the service counter now.</p>
            <div className="text-7xl font-black text-green-600 mb-5">{entry.ticket_number}</div>
            <div className="bg-green-50 rounded-xl px-6 py-4 text-green-800 font-semibold text-lg">
              {entry.counter||'Please proceed to the counter'}
            </div>
          </div>
        )}

        {step==='done'&&(
          <div className="card p-10 text-center shadow-xl">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-5"/>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">All Done!</h2>
            <p className="text-gray-600">Thank you for your visit. We hope to see you again! 😊</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-6">Powered by QueueFlow</p>
      </div>
    </div>
  )
}
