import { supabase } from './supabase'
import { PROFILE_COLUMNS, type Profile } from './auth'

export async function fetchProfilesByIds(ids: string[]): Promise<Record<string, Profile>> {
  if (ids.length === 0) return {}
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).in('id', ids)
  if (error) throw error

  const map: Record<string, Profile> = {}
  for (const profile of data) {
    map[profile.id] = profile
  }
  return map
}

export interface LeaderboardEntry extends Profile {
  rank: number
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('best_net_worth', { ascending: false })
    .limit(limit)
  if (error) throw error

  return data.map((profile, i) => ({ ...profile, rank: i + 1 }))
}
