import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').slice(0, 40)
}

export function formatWaitTime(minutes: number): string {
  if (minutes < 1) return 'Less than a minute'
  if (minutes === 1) return '1 minute'
  if (minutes < 60) return `${Math.round(minutes)} minutes`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`
}

export function estimateWait(position: number, avgServiceMinutes: number): number {
  return (position - 1) * avgServiceMinutes
}

export const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}
