import Link from 'next/link'
import { BookOpen, Zap, CreditCard, Users, Monitor, Bell, Code2, HelpCircle } from 'lucide-react'

const DOCS = [
  {
    icon: Zap, title: 'Quick Start', color: 'text-yellow-600', bg: 'bg-yellow-50',
    items: [
      { q: 'How do I create a queue?', a: 'Go to Queues → New Queue. Fill in the name, ticket prefix and service time. Click Create. You immediately get a public join URL and QR code.' },
      { q: 'How do customers join?', a: 'Share the public URL or print/display the QR code. Customers open it on any device — no app download required. They fill in their name and optionally phone/email.' },
      { q: 'How do I call the next customer?', a: 'In the queue management page, click the "Call Next" button. The first waiting customer is moved to "Called" status. If a display screen is connected, it updates instantly with audio.' },
    ]
  },
  {
    icon: Monitor, title: 'Display Screens', color: 'text-blue-600', bg: 'bg-blue-50',
    items: [
      { q: 'How do I set up a TV display?', a: 'Go to Display Screens → Create Screen. Copy the unique URL and open it on any TV, tablet or monitor browser. It shows live queue status and announces ticket numbers with natural-sounding voice.' },
      { q: 'Can I customise the voice?', a: 'Yes. The display uses your browser\'s text-to-speech engine. It automatically selects the most natural available voice (Samantha, Karen, Google UK Female, etc). Voice, rate and pitch can be adjusted per screen.' },
      { q: 'What happens if the screen loses internet?', a: 'The display shows a "Disconnected" indicator and reconnects automatically when internet is restored. No manual intervention needed.' },
    ]
  },
  {
    icon: Bell, title: 'Notifications', color: 'text-purple-600', bg: 'bg-purple-50',
    items: [
      { q: 'How does email notification work?', a: 'When a customer provides their email on the join page, they automatically receive a confirmation with their ticket number. When called, they receive another email.' },
      { q: 'How do I enable SMS notifications?', a: 'Add your Twilio credentials to the environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER. SMS sends automatically when a phone number is provided.' },
      { q: 'Are notifications free?', a: 'Email via Resend is free up to 3,000/month. SMS via Twilio costs ~$0.0075/message plus your Twilio number (~$1/month). All optional — the core system works without them.' },
    ]
  },
  {
    icon: CreditCard, title: 'Billing & Plans', color: 'text-green-600', bg: 'bg-green-50',
    items: [
      { q: 'What happens when my trial ends?', a: 'If you\'ve added a payment method, you\'re automatically charged on day 15. If not, your account downgrades to the Free plan (2 queues, 1 location). Your data is never deleted.' },
      { q: 'Can I upgrade mid-month?', a: 'Yes. Go to Billing and click Upgrade. You\'re charged a prorated amount for the remainder of the month. The new limits take effect immediately.' },
      { q: 'How do I cancel?', a: 'Go to Billing → Manage Billing (opens Stripe portal) → Cancel subscription. Your plan stays active until the end of the paid period.' },
    ]
  },
  {
    icon: Users, title: 'Team Management', color: 'text-indigo-600', bg: 'bg-indigo-50',
    items: [
      { q: 'What are the team roles?', a: 'Admin: Full access including billing. Staff: Can manage queues and serve customers. Viewer: Read-only access to dashboards and analytics.' },
      { q: 'How do I invite someone?', a: 'Go to Team → type their email, choose a role, click Send Invite. They receive an email with a link. Once they click it and create an account, they appear as Active.' },
    ]
  },
  {
    icon: Code2, title: 'API & Integrations', color: 'text-gray-600', bg: 'bg-gray-100',
    items: [
      { q: 'Does QueueFlow have an API?', a: 'Yes. All queue operations are available via REST API using your Supabase credentials. Professional and Enterprise plans include API access documentation.' },
      { q: 'Can I embed the queue on my website?', a: 'Yes. The public join page URL can be embedded in an iframe, or you can redirect customers to it from your website or booking system.' },
    ]
  },
]

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link href="/" className="text-blue-600 text-sm hover:underline mb-8 block">← Back to QueueFlow</Link>
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <h1 className="text-4xl font-bold">Documentation</h1>
      </div>
      <p className="text-gray-600 text-xl mb-12">Everything you need to get started and grow with QueueFlow.</p>

      <div className="space-y-10">
        {DOCS.map(section => (
          <div key={section.title}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-9 h-9 rounded-xl ${section.bg} flex items-center justify-center`}>
                <section.icon className={`w-5 h-5 ${section.color}`} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
            </div>
            <div className="space-y-4">
              {section.items.map(item => (
                <details key={item.q} className="group border border-gray-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 font-semibold text-gray-900 list-none">
                    <span className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />{item.q}</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4">▾</span>
                  </summary>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-gray-700 leading-relaxed">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white text-center">
        <h3 className="text-2xl font-bold mb-3">Still need help?</h3>
        <p className="text-blue-100 mb-5">Our team responds within 24 hours on business days.</p>
        <a href="mailto:support@queueflow.app" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
          Email Support →
        </a>
      </div>
    </div>
  )
}
