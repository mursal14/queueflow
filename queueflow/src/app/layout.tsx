import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'QueueFlow – AI-Powered Queue Management', template: '%s | QueueFlow' },
  description: 'Transform customer experience with virtual queuing, AI predictions, real-time updates and Stripe payments. Start your 14-day free trial.',
  keywords: ['queue management', 'virtual queue', 'customer flow', 'appointment', 'saas'],
  openGraph: { title: 'QueueFlow', description: 'AI-Powered Queue Management SaaS', type: 'website' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', background: '#1f2937', color: '#fff' } }} />
      </body>
    </html>
  )
}
