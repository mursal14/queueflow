import { NextRequest, NextResponse } from 'next/server'
import { sendCalledEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, name, ticket, counter } = await req.json()
    if (email) await sendCalledEmail(email, name, ticket, counter)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Called notification error:', err.message)
    return NextResponse.json({ ok: true })
  }
}
