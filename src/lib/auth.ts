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

interface AccountResponse {
  created: boolean
  profile: Profile
  session: { access_token: string; refresh_token: string }
  error?: string
}

export async function authenticate(username: string, pin: string): Promise<AuthenticateResult> {
  // No prior Supabase session needed — the account function validates
  // username/PIN itself and mints a session server-side once it succeeds.
  const { data, error } = await supabase.functions.invoke<AccountResponse>('account', {
    body: { username, pin },
  })

  if (error) {
    const message = await extractFunctionErrorMessage(error)
    throw new Error(message ?? 'auth_failed')
  }
  if (!data || data.error || !data.session) {
    throw new Error(data?.error ?? 'auth_failed')
  }

  const { error: setSessionErr } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
  if (setSessionErr) {
    throw new Error('session_failed')
  }

  setRememberedUsername(data.profile.username)
  return { created: data.created, profile: data.profile }
}

export async function switchAccount(): Promise<void> {
  setRememberedUsername(null)
  await supabase.auth.signOut()
}
