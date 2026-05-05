import Link from 'next/link'
import { Users } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
      <nav className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">Queue<span className="text-blue-600">Flow</span></span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </div>
    </div>
  )
}
