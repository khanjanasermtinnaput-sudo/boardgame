// Net Worth — account edge function
//
// Handles username + 4-digit PIN authentication without email/password, and
// without depending on Supabase's anonymous-auth provider:
//   - unknown username  -> create a real auth user (synthetic email + random
//                          password, admin API) + profile + hashed PIN
//   - known username    -> verify the PIN against the stored hash
//
// Either way the function mints a Supabase Auth session server-side (via
// signInWithPassword using a password only this function ever knows — it's
// rotated on every login) and hands the access/refresh tokens back to the
// client. The client never sees a username/password Supabase Auth login; it
// only ever sees username + PIN. Credential storage/verification happens
// here via the service-role client — the `credentials` table has no
// client-facing RLS policies at all.

import { createClient } from 'npm:@supabase/supabase-js@2'
import bcrypt from 'npm:bcryptjs@2.4.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const USERNAME_RE = /^[A-Za-z0-9_]{1,10}$/
const PIN_RE = /^[0-9]{4}$/
const EMAIL_DOMAIN = 'players.networth.local'

// PIN brute-force lockout: after MAX_FAILED_ATTEMPTS wrong guesses in a row,
// lock the account with exponential backoff (capped) before the next guess
// is even attempted. Resets to 0 on a successful login.
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_BASE_SECONDS = 30
const LOCKOUT_MAX_SECONDS = 900

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (match) => `\\${match}`)
}

function syntheticEmail(usernameLower: string): string {
  return `${usernameLower}@${EMAIL_DOMAIN}`
}

function randomPassword(): string {
  return crypto.randomUUID() + crypto.randomUUID()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  let body: { username?: string; pin?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const username = (body.username ?? '').trim()
  const pin = (body.pin ?? '').trim()

  if (!USERNAME_RE.test(username)) {
    return json({ error: 'invalid_username' }, 400)
  }
  if (!PIN_RE.test(pin)) {
    return json({ error: 'invalid_pin' }, 400)
  }

  const usernameLower = username.toLowerCase()
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })

  const { data: existing, error: lookupErr } = await admin
    .from('profiles')
    .select('id, username, avatar_url, games_played, wins, best_net_worth')
    .ilike('username', escapeLike(username))
    .maybeSingle()

  if (lookupErr) {
    return json({ error: 'lookup_failed' }, 500)
  }

  // Register: username not taken yet.
  if (!existing) {
    const password = randomPassword()
    const { data: created, error: createUserErr } = await admin.auth.admin.createUser({
      email: syntheticEmail(usernameLower),
      password,
      email_confirm: true,
      user_metadata: { username },
    })

    if (createUserErr || !created.user) {
      return json({ error: 'create_failed' }, 500)
    }
    const newUserId = created.user.id

    const pinHash = await bcrypt.hash(pin, 10)

    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .insert({ id: newUserId, username })
      .select('id, username, avatar_url, games_played, wins, best_net_worth')
      .single()

    if (profileErr) {
      await admin.auth.admin.deleteUser(newUserId)
      if (profileErr.code === '23505') {
        return json({ error: 'username_taken' }, 409)
      }
      return json({ error: 'create_failed' }, 500)
    }

    const { error: credErr } = await admin.from('credentials').insert({ profile_id: newUserId, pin_hash: pinHash })

    if (credErr) {
      await admin.from('profiles').delete().eq('id', newUserId)
      await admin.auth.admin.deleteUser(newUserId)
      return json({ error: 'create_failed' }, 500)
    }

    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
      email: syntheticEmail(usernameLower),
      password,
    })
    if (signInErr || !signIn.session) {
      return json({ error: 'session_failed' }, 500)
    }

    return json({
      created: true,
      profile,
      session: { access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token },
    })
  }

  // Login: verify the PIN against the stored hash.
  const { data: cred, error: credLookupErr } = await admin
    .from('credentials')
    .select('pin_hash, failed_attempts, locked_until')
    .eq('profile_id', existing.id)
    .single()

  if (credLookupErr || !cred) {
    return json({ error: 'account_error' }, 500)
  }

  if (cred.locked_until && new Date(cred.locked_until).getTime() > Date.now()) {
    return json({ error: 'account_locked', locked_until: cred.locked_until }, 429)
  }

  const valid = await bcrypt.compare(pin, cred.pin_hash)
  if (!valid) {
    const nextAttempts = cred.failed_attempts + 1
    const update: { failed_attempts: number; locked_until?: string } = { failed_attempts: nextAttempts }

    if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutSeconds = Math.min(
        LOCKOUT_BASE_SECONDS * 2 ** (nextAttempts - MAX_FAILED_ATTEMPTS),
        LOCKOUT_MAX_SECONDS,
      )
      update.locked_until = new Date(Date.now() + lockoutSeconds * 1000).toISOString()
    }

    await admin.from('credentials').update(update).eq('profile_id', existing.id)

    if (update.locked_until) {
      return json({ error: 'account_locked', locked_until: update.locked_until }, 429)
    }
    return json({ error: 'invalid_pin' }, 401)
  }

  if (cred.failed_attempts > 0 || cred.locked_until) {
    await admin.from('credentials').update({ failed_attempts: 0, locked_until: null }).eq('profile_id', existing.id)
  }

  // Rotate the auth password on every successful login — this function is
  // the only caller that ever knows it, so a leaked-in-transit token from
  // one login can't be replayed to mint another session later.
  const newPassword = randomPassword()
  const { error: rotateErr } = await admin.auth.admin.updateUserById(existing.id, { password: newPassword })
  if (rotateErr) {
    return json({ error: 'account_error' }, 500)
  }

  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
    email: syntheticEmail(usernameLower),
    password: newPassword,
  })
  if (signInErr || !signIn.session) {
    return json({ error: 'session_failed' }, 500)
  }

  return json({
    created: false,
    profile: existing,
    session: { access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token },
  })
})
