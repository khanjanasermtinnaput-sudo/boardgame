// Net Worth — account edge function
//
// Handles username + 4-digit PIN authentication without email/password:
//   - unknown username  -> create a profile + hashed PIN for the caller
//   - known username    -> verify the PIN, then re-link the profile to the
//                          caller's current (possibly new-device) session
//
// The caller must already hold an anonymous Supabase auth session (its
// auth.uid() becomes the profile id on register, or the new device id on a
// successful cross-device login). Credential storage/verification only ever
// happens here, via the service-role client — the `credentials` table has no
// client-facing RLS policies at all.

import { createClient } from 'npm:@supabase/supabase-js@2'
import bcrypt from 'npm:bcryptjs@2.4.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const USERNAME_RE = /^[A-Za-z0-9_]{1,10}$/
const PIN_RE = /^[0-9]{4}$/

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'missing_authorization' }, 401)
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

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: callerData, error: callerErr } = await callerClient.auth.getUser()
  if (callerErr || !callerData.user) {
    return json({ error: 'not_authenticated' }, 401)
  }
  const callerId = callerData.user.id

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

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
    const pinHash = await bcrypt.hash(pin, 10)

    const { data: created, error: createErr } = await admin
      .from('profiles')
      .insert({ id: callerId, username })
      .select('id, username, avatar_url, games_played, wins, best_net_worth')
      .single()

    if (createErr) {
      if (createErr.code === '23505') {
        return json({ error: 'username_taken' }, 409)
      }
      return json({ error: 'create_failed' }, 500)
    }

    const { error: credErr } = await admin
      .from('credentials')
      .insert({ profile_id: callerId, pin_hash: pinHash })

    if (credErr) {
      await admin.from('profiles').delete().eq('id', callerId)
      return json({ error: 'create_failed' }, 500)
    }

    return json({ created: true, profile: created })
  }

  // Login: verify the PIN against the stored hash.
  const { data: cred, error: credLookupErr } = await admin
    .from('credentials')
    .select('pin_hash')
    .eq('profile_id', existing.id)
    .single()

  if (credLookupErr || !cred) {
    return json({ error: 'account_error' }, 500)
  }

  const valid = await bcrypt.compare(pin, cred.pin_hash)
  if (!valid) {
    return json({ error: 'invalid_pin' }, 401)
  }

  // Re-link to the caller's current session if logging in from a new device.
  if (existing.id !== callerId) {
    const { error: relinkErr } = await admin
      .from('profiles')
      .update({ id: callerId })
      .eq('id', existing.id)

    if (relinkErr) {
      return json({ error: 'relink_failed' }, 500)
    }
  }

  return json({ created: false, profile: { ...existing, id: callerId } })
})
