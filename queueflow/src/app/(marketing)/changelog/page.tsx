import Link from 'next/link'
import { Zap, CheckCircle2 } from 'lucide-react'

const RELEASES = [
  {
    version: '1.0.0', date: '2025-01-01', tag: 'Latest',
    changes: [
      'Initial release with full queue management',
      'Stripe checkout & subscription billing',
      'Real-time WebSocket queue updates',
      'TV display screen with natural voice audio',
      'SMS notifications via Twilio',
      'Email notifications via Resend',
      'Team management with roles',
      'Analytics dashboard with 7-day chart',
      'QR code generation per queue',
      'GDPR-compliant privacy & terms pages',
    ]
  }
]

export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Link href="/" className="text-blue-600 text-sm hover:underline mb-8 block">← Back to QueueFlow</Link>
      <div className="flex items-center gap-3 mb-3">
        <Zap className="w-7 h-7 text-blue-600" />
        <h1 className="text-4xl font-bold">Changelog</h1>
      </div>
      <p className="text-gray-500 text-lg mb-12">New features and improvements.</p>
      <div className="space-y-10">
        {RELEASES.map(r => (
          <div key={r.version} className="relative pl-8 border-l-2 border-blue-100">
            <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">v{r.version}</h2>
              <span className="badge bg-blue-100 text-blue-700">{r.tag}</span>
              <span className="text-gray-400 text-sm">{r.date}</span>
            </div>
            <ul className="space-y-2">
              {r.changes.map(c => (
                <li key={c} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
