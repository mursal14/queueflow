import Link from 'next/link'
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="text-blue-600 text-sm hover:underline mb-8 block">← Back to QueueFlow</Link>
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-10">Last updated: {new Date().toLocaleDateString()}</p>
      {[
        { title: '1. Information We Collect', body: 'We collect information you provide directly to us, such as when you create an account, subscribe to a plan, or use our services. This includes your name, email address, payment information (processed securely by Stripe), and usage data.' },
        { title: '2. How We Use Information', body: 'We use the information to provide, maintain, and improve our services, process transactions, send notifications, and comply with legal obligations. We do not sell your personal data to third parties.' },
        { title: '3. Data Storage', body: 'Your data is stored securely in Supabase (PostgreSQL database) hosted on AWS infrastructure. All data is encrypted at rest and in transit using industry-standard TLS/SSL protocols.' },
        { title: '4. Payment Information', body: 'All payment information is processed by Stripe and is never stored on our servers. Stripe is PCI-DSS Level 1 compliant, the highest level of certification.' },
        { title: '5. GDPR Rights', body: 'If you are in the European Economic Area, you have the right to access, rectify, port, and erase your data. You may also object to processing and request restriction. Contact us at privacy@queueflow.app.' },
        { title: '6. Cookies', body: 'We use essential cookies for authentication and session management. We do not use third-party advertising cookies. You can disable cookies in your browser settings.' },
        { title: '7. Data Retention', body: 'We retain your data for as long as your account is active or as needed to provide services. Queue entries are retained for 90 days after completion, then automatically deleted.' },
        { title: '8. Contact Us', body: 'For privacy inquiries: privacy@queueflow.app. For GDPR requests: gdpr@queueflow.app. We will respond within 30 days.' },
      ].map(s => (
        <div key={s.title} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h2>
          <p className="text-gray-600 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  )
}
