import { supabase } from './supabase'

const REMEMBERED_USERNAME_KEY = 'networth.rememberedUsername'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  games_played: number
  wins: number
  best_net_worth: number
}

export const PROFILE_COLUMNS = 'id, username, avatar_url, games_played, wins, best_net_worth'

export function getRememberedUsername(): string | null {
  return localStorage.getItem(REMEMBERED_USERNAME_KEY)
}

function setRememberedUsername(username: string | null): void {
  if (username) localStorage.setItem(REMEMBERED_USERNAME_KEY, username)
  else localStorage.removeItem(REMEMBERED_USERNAME_KEY)
}

export async function ensureAnonymousSession(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session.user.id

  const { data: signInData, error } = await supabase.auth.signInAnonymously()
  if (error || !signInData.session) {
    throw new Error(error?.message ?? 'anonymous_sign_in_failed')
  }
  return signInData.session.user.id
}

export async function fetchOwnProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser()
  const uid = userData.user?.id
  if (!uid) return null

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', uid)
    .maybeSingle()

  if (error) throw error
  return data
}

async function extractFunctionErrorMessage(error: unknown): Promise<string | undefined> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: Response }).context
    if (context) {
      try {
        const body = await context.clone().json()
        return typeof body?.error === 'string' ? body.error : undefined
      } catch {
        return undefined
      }
    }
  }
  return undefined
}

export interface AuthenticateResult {
  created: boolean
  profile: Profile
}

export async function authenticate(username: string, pin: string): Promise<AuthenticateResult> {
  await ensureAnonymousSession()

  const { data, error } = await supabase.functions.invoke<AuthenticateResult & { error?: string }>('account', {
    body: { username, pin },
  })

  if (error) {
    const message = await extractFunctionErrorMessage(error)
    throw new Error(message ?? 'auth_failed')
  }
  if (!data || data.error) {
    throw new Error(data?.error ?? 'auth_failed')
  }

  setRememberedUsername(data.profile.username)
  return data
}

export async function switchAccount(): Promise<void> {
  setRememberedUsername(null)
  await supabase.auth.signOut()
}
