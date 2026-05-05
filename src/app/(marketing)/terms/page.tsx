import Link from 'next/link'
export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="text-blue-600 text-sm hover:underline mb-8 block">← Back to QueueFlow</Link>
      <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-500 mb-10">Last updated: {new Date().toLocaleDateString()}</p>
      {[
        { title: '1. Acceptance of Terms', body: 'By accessing or using QueueFlow, you agree to be bound by these Terms. If you disagree with any part, you may not use our services.' },
        { title: '2. Description of Service', body: 'QueueFlow provides a cloud-based queue management platform as a Software-as-a-Service (SaaS). Features vary by subscription plan.' },
        { title: '3. Account Responsibilities', body: 'You are responsible for maintaining confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.' },
        { title: '4. Subscription and Billing', body: 'Paid plans are billed monthly or annually via Stripe. You may cancel at any time; your plan remains active until the end of the billing period. No refunds for partial periods.' },
        { title: '5. Free Trial', body: 'We offer a 14-day free trial. No credit card required for the free plan. For paid plans, your card is not charged until after the trial ends.' },
        { title: '6. Acceptable Use', body: 'You may not use QueueFlow for illegal activities, to harm others, to send spam, or to violate any applicable laws. We reserve the right to suspend accounts for violations.' },
        { title: '7. Data Ownership', body: 'You retain ownership of all data you input into QueueFlow. You grant us a license to store and process this data solely to provide the service.' },
        { title: '8. Service Availability', body: 'We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance.' },
        { title: '9. Limitation of Liability', body: 'QueueFlow is not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount paid in the 3 months preceding the claim.' },
        { title: '10. Changes to Terms', body: 'We may update these terms with 30 days notice via email. Continued use after notice constitutes acceptance of new terms.' },
        { title: '11. Contact', body: 'Legal inquiries: legal@queueflow.app' },
      ].map(s => (
        <div key={s.title} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h2>
          <p className="text-gray-600 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  )
}
