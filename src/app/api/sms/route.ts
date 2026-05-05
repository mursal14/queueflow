import { NextRequest, NextResponse } from 'next/server'

async function sendTwilioSMS(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_PHONE_NUMBER

  if (!sid || !token || !from) {
    console.log('[SMS] Twilio not configured — skipping')
    return { ok: false, error: 'not_configured' }
  }

  // Normalise phone number
  const phone = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: from, Body: body }).toString(),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[SMS] Twilio error:', err)
    return { ok: false, error: err.message }
  }
  return { ok: true }
}

export async function POST(req: NextRequest) {
  try {
    const { type, phone, ticket, queue, position, counter } = await req.json()

    if (!phone) return NextResponse.json({ ok: true, skipped: 'no_phone' })

    const messages: Record<string, string> = {
      join:     `🎫 You joined ${queue}!\nTicket: ${ticket} · Position: #${position}\nWe'll text you when it's your turn. Stay nearby!`,
      called:   `🔔 It's your turn!\nTicket ${ticket} — please go to ${counter || 'the counter'} now.`,
      reminder: `⏰ Almost your turn!\nTicket ${ticket} for ${queue}. Please be ready.`,
    }

    const message = messages[type]
    if (!message) return NextResponse.json({ ok: true, skipped: 'unknown_type' })

    const result = await sendTwilioSMS(phone, message)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('[SMS] Handler error:', err.message)
    return NextResponse.json({ ok: true, error: err.message }) // never fail the caller
  }
}
