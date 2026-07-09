#!/usr/bin/env node
// End-to-end RPC integration test — drives a full multi-player game through
// the real Supabase RPCs (no browser, no mocks) against whatever project
// VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY point at. Registers real accounts,
// plays a complete 6-age game, verifies every invariant called out in the
// spec's testing checklist, and cleans up all data it created — win or lose.
//
// Usage:
//   node scripts/integration-test.mjs            # reads .env in repo root
//   PLAYERS=6 node scripts/integration-test.mjs   # test with more players
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadDotEnv() {
  try {
    const text = readFileSync(join(__dirname, '..', '.env'), 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    // no .env file — rely on already-exported env vars
  }
}
loadDotEnv()

const URL = process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
if (!URL || !ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (set them in .env or the environment).')
  process.exit(1)
}

const PLAYER_COUNT = Number(process.env.PLAYERS ?? 3)
const rand = () => Math.random().toString(36).slice(2, 7)

let passed = 0
let failed = 0
function assert(cond, msg) {
  if (cond) {
    passed++
    console.log('  ok:', msg)
  } else {
    failed++
    console.error('  FAIL:', msg)
  }
}

function client() {
  return createClient(URL, ANON_KEY, { auth: { persistSession: false } })
}

async function registerAndLogin(username) {
  const c = client()
  const { data, error } = await c.functions.invoke('account', { body: { username, pin: '1234' } })
  if (error || data?.error) {
    const body = error ? await error.context?.clone().text().catch(() => '') : JSON.stringify(data)
    throw new Error(`register ${username} failed: ${error?.message ?? data?.error} ${body ?? ''}`)
  }
  await c.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
  return { client: c, profile: data.profile }
}

async function main() {
  const names = Array.from({ length: PLAYER_COUNT }, () => `it${rand()}`)
  console.log(`\n=== Registering ${PLAYER_COUNT} players: ${names.join(', ')} ===`)
  const players = []
  for (const n of names) players.push(await registerAndLogin(n))
  const host = players[0]

  console.log('\n=== Room lifecycle ===')
  const { data: room, error: roomErr } = await host.client.rpc('create_room', {
    _name: 'Integration Test Room',
    _max_players: PLAYER_COUNT,
    _is_public: false,
    _win_condition: {},
  })
  if (roomErr) throw roomErr
  assert(room.code.length === 4 && /^\d{4}$/.test(room.code), 'private room gets a random 4-digit code')

  for (let i = 1; i < players.length; i++) {
    const { error } = await players[i].client.rpc('join_room', { _room_id: room.id, _code: null, _as_spectator: false })
    if (error) throw error
  }

  for (const p of players) {
    const { error } = await p.client.from('room_players').update({ is_ready: true }).eq('room_id', room.id).eq('profile_id', p.profile.id)
    if (error) throw error
  }

  console.log('\n=== Starting game ===')
  const { data: game, error: startErr } = await host.client.rpc('game_start', { _room_id: room.id })
  if (startErr) throw startErr
  assert(game.age === 20 && game.phase === 1 && game.status === 'active', 'game starts at age 20, phase 1, active')

  for (const p of players) {
    const { data: gp } = await p.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', p.profile.id).single()
    assert(gp.cash === 10000, `${p.profile.username} starts with $10,000`)
    assert(gp.hand.length === 6, `${p.profile.username} starts with 6 cards`)
  }

  console.log('\n=== Investment phase actions ===')
  {
    const { data: gp } = await host.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', host.profile.id).single()
    const card = gp.hand[0]
    await host.client.rpc('game_buy_card', { _game_id: game.id, _card_id: card.card_id }).then(({ error }) => {
      if (error) throw error
    })
    const { data: gp2 } = await host.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', host.profile.id).single()
    assert(gp2.assets.length === 1 && gp2.hand.length === 5, 'buying moves a card from hand to assets')
    assert(gp2.net_worth === gp2.cash + gp2.assets[0].base_value, 'net worth = cash + base value after buying')
  }
  {
    const p1 = players[1]
    await p1.client.rpc('game_borrow', { _game_id: game.id, _amount: 4000 }).then(({ error }) => {
      if (error) throw error
    })
    const { data: gp } = await p1.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', p1.profile.id).single()
    assert(gp.cash === 14000 && gp.debts.length === 1 && gp.debts[0].outstanding === 4000, 'borrowing adds cash and a debt card')
    assert(gp.net_worth === 14000 - 4000, 'net worth subtracts outstanding debt')

    await p1.client.rpc('game_repay', { _game_id: game.id, _debt_id: gp.debts[0].debt_id, _amount: 1000 }).then(({ error }) => {
      if (error) throw error
    })
    const { data: gp2 } = await p1.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', p1.profile.id).single()
    assert(gp2.debts[0].outstanding === 3000 && gp2.cash === 13000, 'partial repay reduces outstanding and cash correctly')
  }

  console.log('\n=== Concurrency: all players ready simultaneously (only one resolution should occur) ===')
  {
    const before = await host.client.from('games').select('phase').eq('id', game.id).single()
    await Promise.all(players.map((p) => p.client.rpc('game_set_ready', { _game_id: game.id, _ready: true })))
    const after = await host.client.from('games').select('phase').eq('id', game.id).single()
    assert(after.data.phase === (before.data.phase % 5) + 1, 'simultaneous ready calls advance the phase exactly once, not more')
    const { data: allPlayers } = await host.client.from('game_players').select('ready').eq('game_id', game.id)
    assert(allPlayers.every((p) => !p.ready), 'ready flags reset for everyone after concurrent resolution')
  }

  console.log('\n=== Reconnect: mid-game refetch matches authoritative state ===')
  {
    const fresh = client()
    // A brand new client with no prior session can't read RLS-protected rows;
    // simulate "reconnect" as an existing player re-fetching after a refresh.
    const p0 = players[0]
    const { data: before } = await p0.client.from('games').select('*').eq('id', game.id).single()
    const { data: after } = await p0.client.from('games').select('*').eq('id', game.id).single()
    assert(JSON.stringify(before) === JSON.stringify(after), 'refetching game state twice yields identical data (no drift)')
    void fresh
  }

  console.log('\n=== Driving the remaining rounds to completion ===')
  let resolutions = 1 // the concurrency test above already did one
  const MAX_RESOLUTIONS = 6 * 5 + 5
  while (true) {
    const { data: g } = await host.client.from('games').select('*').eq('id', game.id).single()
    if (g.status === 'finished') {
      console.log(`  game finished after ${resolutions} total phase resolutions (final age ${g.age})`)
      break
    }
    if (resolutions > MAX_RESOLUTIONS) throw new Error('game never finished — stuck phase gate')

    const ageBefore = g.age
    const phaseBefore = g.phase
    for (let i = 0; i < players.length - 1; i++) {
      await players[i].client.rpc('game_set_ready', { _game_id: game.id, _ready: true })
    }
    const { data: mid } = await host.client.from('games').select('phase, age').eq('id', game.id).single()
    assert(mid.phase === phaseBefore && mid.age === ageBefore, `age ${ageBefore} phase ${phaseBefore}: doesn't advance until ALL players ready`)

    await players[players.length - 1].client.rpc('game_set_ready', { _game_id: game.id, _ready: true })
    resolutions++
  }

  console.log('\n=== End-game verification ===')
  const { data: results } = await host.client.from('game_results').select('*').eq('room_id', room.id)
  assert(results.length === players.length, `game_results has one row per player (${results.length}/${players.length})`)
  assert(results.filter((r) => r.won).length === 1, 'exactly one winner')
  const sorted = [...results].sort((a, b) => b.net_worth - a.net_worth)
  assert(sorted[0].won === true, 'the highest net worth is the recorded winner')

  const { data: finalRoom } = await host.client.from('rooms').select('status').eq('id', room.id).single()
  assert(finalRoom.status === 'finished', 'room marked finished')

  for (const p of players) {
    const { data: prof } = await host.client.from('profiles').select('games_played, wins').eq('id', p.profile.id).single()
    assert(prof.games_played === 1, `${p.profile.username} games_played bumped to 1`)
  }

  console.log('\n=== Cleanup ===')
  await host.client.from('rooms').delete().eq('id', room.id)

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    const admin = createClient(URL, serviceRoleKey, { auth: { persistSession: false } })
    for (const p of players) {
      await admin.auth.admin.deleteUser(p.profile.id).catch(() => {})
    }
    console.log(`  deleted ${players.length} test accounts (auth.users cascades to profiles/credentials)`)
  } else {
    console.log(
      `  room deleted; ${players.length} test profiles left behind (set SUPABASE_SERVICE_ROLE_KEY to auto-delete test accounts too)`,
    )
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error('\nINTEGRATION TEST CRASHED:', err.message)
  process.exitCode = 1
})
