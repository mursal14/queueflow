import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Profile, Organization } from '@/types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
    })
  }, [])

  return { profile, loading }
}

export function useOrg() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase.from('organizations').select('*').eq('owner_id', user.id).single().then(({ data }) => {
        setOrg(data)
        setLoading(false)
      })
    })
  }, [])

  return { org, loading }
}

export function usePlanLimits() {
  const { profile } = useProfile()
  const plan = profile?.plan || 'free'
  const LIMITS: Record<string, { queues: number; team: number; locations: number; displays: number }> = {
    free:         { queues: 2,    team: 2,    locations: 1,    displays: 1 },
    starter:      { queues: 10,   team: 5,    locations: 3,    displays: 3 },
    professional: { queues: 50,   team: 25,   locations: 10,   displays: 10 },
    enterprise:   { queues: 9999, team: 9999, locations: 9999, displays: 9999 },
  }
  return LIMITS[plan] || LIMITS.free
}
