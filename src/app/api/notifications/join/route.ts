import { NextRequest, NextResponse } from 'next/server'
import { sendQueueNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, name, ticket, queue, position } = await req.json()
    if (email) await sendQueueNotification(email, name, ticket, queue, position)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // Don't fail the join flow if email fails
    console.error('Notification email error:', err.message)
    return NextResponse.json({ ok: true })
  }
}
