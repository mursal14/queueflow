export type Plan = 'free' | 'starter' | 'professional' | 'enterprise'
export type QueueStatus = 'active' | 'paused' | 'closed'
export type EntryStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'noshow' | 'cancelled'
export type TeamRole = 'admin' | 'staff' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  plan: Plan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status: string
  trial_ends_at: string
  onboarding_done: boolean
  onboarding_step: number
  created_at: string
}

export interface Organization {
  id: string
  owner_id: string
  name: string
  slug: string
  logo_url?: string
  primary_color: string
  address?: string
  timezone: string
  created_at: string
}

export interface Location {
  id: string
  organization_id: string
  name: string
  address?: string
  timezone: string
  is_active: boolean
}

export interface Queue {
  id: string
  organization_id: string
  location_id?: string
  name: string
  description?: string
  prefix: string
  current_number: number
  status: QueueStatus
  avg_service_minutes: number
  public_id: string
  require_phone: boolean
  require_email: boolean
  max_capacity: number
  created_at: string
  // joined from entries
  waiting_count?: number
}

export interface QueueEntry {
  id: string
  queue_id: string
  ticket_number: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  position: number
  status: EntryStatus
  notes?: string
  joined_at: string
  called_at?: string
  completed_at?: string
  counter?: string
}

export interface TeamMember {
  id: string
  organization_id: string
  user_id?: string
  email: string
  role: TeamRole
  status: 'pending' | 'active' | 'disabled'
  invite_token: string
  joined_at?: string
}

export interface DisplayScreen {
  id: string
  organization_id: string
  location_id?: string
  name: string
  access_token: string
  theme: 'dark' | 'light' | 'brand'
  voice_enabled: boolean
  voice_gender: 'male' | 'female'
  voice_rate: number
  voice_pitch: number
}
