import { Resend } from 'resend'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.EMAIL_FROM || 'QueueFlow <noreply@queueflow.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ── helpers ───────────────────────────────────────────────────
function baseHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>body{margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)}
.header{background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px 32px 24px;text-align:center}
.header h1{color:#fff;margin:0;font-size:24px;font-weight:800}
.header p{color:#bfdbfe;margin:6px 0 0;font-size:14px}
.body{padding:32px}.footer{padding:16px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6}
.btn{display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;margin:16px 0}
.ticket{background:linear-gradient(135deg,#eff6ff,#eef2ff);border:2px solid #bfdbfe;border-radius:16px;padding:24px;text-align:center;margin:20px 0}
.ticket-num{font-size:56px;font-weight:900;color:#3b82f6;line-height:1}
.info-row{display:flex;gap:12px;margin:8px 0}
.info-box{flex:1;background:#f9fafb;border-radius:10px;padding:12px;text-align:center}
.info-box .val{font-size:20px;font-weight:700;color:#111827}
.info-box .lbl{font-size:11px;color:#9ca3af;margin-top:2px}
h2{color:#111827;font-size:20px;margin:0 0 8px}p{color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 12px}
</style></head><body>
<div class="wrap">
<div class="header"><h1>QueueFlow</h1><p>${title}</p></div>
<div class="body">${body}</div>
<div class="footer">QueueFlow · <a href="${APP_URL}" style="color:#9ca3af">${APP_URL.replace(/^https?:\/\//,'')}</a><br>You received this because you joined a queue.</div>
</div></body></html>`
}

// ── exports ───────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM, to: email,
    subject: 'Welcome to QueueFlow 🎉',
    html: baseHtml('Welcome aboard!', `
      <h2>Hi ${name}! Welcome to QueueFlow 👋</h2>
      <p>Your 14-day free trial has started. Create your first queue in minutes and start serving customers today.</p>
      <div style="text-align:center"><a class="btn" href="${APP_URL}/onboarding">Set Up Your Queue →</a></div>
      <p style="font-size:13px;color:#9ca3af">No credit card required during trial. You can upgrade any time from the Billing page.</p>
    `),
  }).catch(console.error)
}

export async function sendTeamInviteEmail(
  email: string, inviterName: string, orgName: string, token: string
) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM, to: email,
    subject: `${inviterName} invited you to ${orgName} on QueueFlow`,
    html: baseHtml(`Invitation to ${orgName}`, `
      <h2>You've been invited!</h2>
      <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> on QueueFlow.</p>
      <div style="text-align:center"><a class="btn" href="${APP_URL}/join-team?token=${token}">Accept Invitation →</a></div>
      <p style="font-size:13px;color:#9ca3af">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
    `),
  }).catch(console.error)
}

export async function sendQueueNotification(
  email: string, customerName: string, ticketNumber: string,
  queueName: string, position: number
) {
  if (!email || !process.env.RESEND_API_KEY) return
  const waitMin = position > 1 ? `~${(position - 1) * 10} minutes` : 'very soon!'
  await resend.emails.send({
    from: FROM, to: email,
    subject: `Your ticket ${ticketNumber} — ${queueName}`,
    html: baseHtml(`Ticket confirmed · ${queueName}`, `
      <h2>You're in the queue, ${customerName}!</h2>
      <p>Keep this email handy — we'll notify you when it's your turn.</p>
      <div class="ticket">
        <div class="ticket-num">${ticketNumber}</div>
        <div style="color:#6b7280;margin-top:8px;font-size:14px">Your ticket number</div>
      </div>
      <div class="info-row">
        <div class="info-box"><div class="val">#${position}</div><div class="lbl">Position</div></div>
        <div class="info-box"><div class="val">${waitMin}</div><div class="lbl">Est. wait</div></div>
      </div>
      <p style="font-size:13px;margin-top:16px">Please stay nearby — you'll receive another notification when it's your turn.</p>
    `),
  }).catch(console.error)
}

export async function sendCalledEmail(
  email: string, customerName: string, ticketNumber: string, counter: string
) {
  if (!email || !process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM, to: email,
    subject: `🔔 It's your turn! Ticket ${ticketNumber}`,
    html: baseHtml("It's your turn!", `
      <h2 style="color:#059669">It's your turn, ${customerName}!</h2>
      <p>Please proceed to the service counter right away.</p>
      <div class="ticket" style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-color:#6ee7b7">
        <div class="ticket-num" style="color:#059669">${ticketNumber}</div>
        <div style="color:#065f46;font-size:20px;font-weight:700;margin-top:10px">${counter || 'Please go to the counter'}</div>
      </div>
      <p style="font-size:13px;color:#9ca3af">If you miss your turn, please ask a staff member for assistance.</p>
    `),
  }).catch(console.error)
}
