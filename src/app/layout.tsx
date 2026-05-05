import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default:  'QueueFlow – Queue Management Platform',
    template: '%s | QueueFlow',
  },
  description: 'Virtual queuing with real-time updates, SMS notifications, AI wait predictions and Stripe billing. Start your 14-day free trial.',
  keywords: ['queue management','virtual queue','customer flow','appointment','saas'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1f2937',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
