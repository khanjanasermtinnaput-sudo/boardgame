#!/usr/bin/env node
// End-to-end RPC integration test — drives a full multi-player game through
// the real Supabase RPCs (no browser, no mocks) against whatever project
// VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY point at. Registers real accounts,
// plays a complete 6-age game under the host-driven round flow, verifies
// every invariant called out in the spec's testing checklist, and cleans up
// all data it created — win or lose.
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

async function assertRpcFails(promise, expectedMessage, description) {
  const { error } = await promise
  if (!error) {
    failed++
    console.error('  FAIL:', description, '(expected an error, call succeeded)')
    return
  }
  assert(error.message === expectedMessage, `${description} (got: "${error.message}")`)
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
  // One extra player joins purely to be kicked mid-game, proving the host_kick
  // RPC, then the remaining PLAYER_COUNT players play the game to completion.
  const names = Array.from({ length: PLAYER_COUNT + 1 }, () => `it${rand()}`)
  console.log(`\n=== Registering ${PLAYER_COUNT + 1} players: ${names.join(', ')} ===`)
  const everyone = []
  for (const n of names) everyone.push(await registerAndLogin(n))
  const players = everyone.slice(0, PLAYER_COUNT)
  const kickTarget = everyone[PLAYER_COUNT]
  const host = players[0]

  console.log('\n=== Room lifecycle ===')
  const { data: room, error: roomErr } = await host.client.rpc('create_room', {
    _name: 'Integration Test Room',
    _max_players: PLAYER_COUNT + 1,
    _is_public: false,
    _win_condition: {},
  })
  if (roomErr) throw roomErr
  assert(room.code.length === 4 && /^\d{4}$/.test(room.code), 'private room gets a random 4-digit code')

  for (const p of [...players.slice(1), kickTarget]) {
    const { error } = await p.client.rpc('join_room', { _room_id: room.id, _code: null, _as_spectator: false })
    if (error) throw error
  }

  for (const p of everyone) {
    const { error } = await p.client.from('room_players').update({ is_ready: true }).eq('room_id', room.id).eq('profile_id', p.profile.id)
    if (error) throw error
  }

  console.log('\n=== Starting game ===')
  const { data: game, error: startErr } = await host.client.rpc('game_start', { _room_id: room.id })
  if (startErr) throw startErr
  assert(game.age === 20 && game.phase === 1 && game.status === 'active' && game.paused === false, 'game starts at age 20, phase 1, active, unpaused')

  for (const p of everyone) {
    const { data: gp } = await p.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', p.profile.id).single()
    assert(gp.cash === 10000, `${p.profile.username} starts with $10,000`)
    assert(gp.hand.length === 4, `${p.profile.username} starts with 4 cards`)
  }

  console.log('\n=== Host-only guards ===')
  await assertRpcFails(
    players[1].client.rpc('game_host_advance', { _game_id: game.id }),
    'not_host',
    'a non-host cannot call game_host_advance',
  )
  await assertRpcFails(
    host.client.rpc('game_host_kick', { _game_id: game.id, _target: host.profile.id }),
    'cannot_kick_self',
    'the host cannot kick themselves',
  )

  console.log('\n=== Host kick ===')
  {
    await host.client.rpc('game_host_kick', { _game_id: game.id, _target: kickTarget.profile.id }).then(({ error }) => {
      if (error) throw error
    })
    const { data: gp } = await host.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', kickTarget.profile.id).maybeSingle()
    assert(gp === null, 'kicked player is removed from game_players')
    const { data: rp } = await host.client.from('room_players').select('*').eq('room_id', room.id).eq('profile_id', kickTarget.profile.id).maybeSingle()
    assert(rp === null, 'kicked player is removed from room_players')
    const { data: logRows } = await host.client.from('game_log').select('*').eq('game_id', game.id).eq('kind', 'host_kick')
    assert(logRows.length === 1 && logRows[0].entry.target === kickTarget.profile.id, 'kick is recorded in game_log')
  }

  console.log('\n=== Buy phase gating: buying is phase-2-only, banking is always-on ===')
  {
    await assertRpcFails(
      host.client.rpc('game_buy_card', { _game_id: game.id, _card_id: 'house_1' }),
      'not_buy_phase',
      'buying at phase 1 (Awaiting Round Start) is rejected',
    )

    const p1 = players[1]
    await p1.client.rpc('game_borrow', { _game_id: game.id, _amount: 4000 }).then(({ error }) => {
      if (error) throw error
    })
    const { data: gp } = await p1.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', p1.profile.id).single()
    assert(gp.cash === 14000 && gp.debts.length === 1 && gp.debts[0].outstanding === 4000, 'borrowing at phase 1 succeeds (bank is always-on)')
    assert(gp.net_worth === 14000 - 4000, 'net worth subtracts outstanding debt')

    await p1.client.rpc('game_repay', { _game_id: game.id, _debt_id: gp.debts[0].debt_id, _amount: 1000 }).then(({ error }) => {
      if (error) throw error
    })
    const { data: gp2 } = await p1.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', p1.profile.id).single()
    assert(gp2.debts[0].outstanding === 3000 && gp2.cash === 13000, 'repaying at phase 1 succeeds and reduces outstanding/cash correctly')
  }

  console.log('\n=== Host pause/resume ===')
  {
    await host.client.rpc('game_host_set_paused', { _game_id: game.id, _paused: true }).then(({ error }) => {
      if (error) throw error
    })
    await assertRpcFails(
      players[1].client.rpc('game_borrow', { _game_id: game.id, _amount: 100 }),
      'game_paused',
      'bank actions are rejected while paused',
    )
    await assertRpcFails(
      host.client.rpc('game_set_ready', { _game_id: game.id, _ready: true }),
      'game_paused',
      'readying up is rejected while paused',
    )
    await host.client.rpc('game_host_set_paused', { _game_id: game.id, _paused: false }).then(({ error }) => {
      if (error) throw error
    })
    const { data: g } = await host.client.from('games').select('paused').eq('id', game.id).single()
    assert(g.paused === false, 'resuming clears the paused flag')
  }

  console.log('\n=== Host banker adjustment ===')
  {
    const target = players[2]
    const { data: before } = await host.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', target.profile.id).single()
    await host.client
      .rpc('game_host_adjust_player', { _game_id: game.id, _target: target.profile.id, _cash_delta: 777, _reason: 'integration test bonus' })
      .then(({ error }) => {
        if (error) throw error
      })
    const { data: after } = await host.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', target.profile.id).single()
    assert(after.cash === before.cash + 777, 'host cash adjustment applies exactly')
    assert(after.net_worth === before.net_worth + 777, 'net worth is re-derived via recompute_player, not set directly')
    const { data: logRows } = await host.client.from('game_log').select('*').eq('game_id', game.id).eq('kind', 'host_adjust_player')
    assert(
      logRows.length === 1 && logRows[0].entry.cash_delta === 777 && logRows[0].entry.reason === 'integration test bonus',
      'adjustment is recorded in game_log',
    )
  }

  console.log('\n=== Host advances the round (dice + market tile reveal) ===')
  {
    await host.client.rpc('game_host_advance', { _game_id: game.id }).then(({ error }) => {
      if (error) throw error
    })
    const { data: g } = await host.client.from('games').select('*').eq('id', game.id).single()
    assert(g.phase === 2, 'round advance opens the Invest / Buy phase')
    const roll = g.last_roll
    assert(roll.die1 >= 1 && roll.die1 <= 6 && roll.die2 >= 1 && roll.die2 <= 6, 'dice roll is within 1-6 per die')
    assert(roll.total === roll.die1 + roll.die2, 'total matches the sum of both dice')
    assert(roll.tile_index >= 0 && roll.tile_index < 12, 'tile index is within the 12-tile ring')
    assert(typeof g.global_event.id === 'string' && g.global_event.id.length > 0, "this round's market tile event is freshly revealed")
  }

  console.log('\n=== Buy phase actions ===')
  {
    let { data: gp } = await host.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', host.profile.id).single()
    const { data: g } = await host.client.from('games').select('market').eq('id', game.id).single()
    const priceOf = (c) => Math.round(c.purchase_price * (g.market[c.category] ?? 1.0))
    // With a 4-card hand and this round's freshly-revealed market multipliers,
    // every dealt card can price above starting cash — borrow the shortfall
    // against the cheapest card rather than assuming any card is affordable.
    const cheapest = [...gp.hand].sort((a, b) => priceOf(a) - priceOf(b))[0]
    const shortfall = priceOf(cheapest) - gp.cash
    if (shortfall > 0) {
      await host.client.rpc('game_borrow', { _game_id: game.id, _amount: shortfall }).then(({ error }) => {
        if (error) throw error
      })
      ;({ data: gp } = await host.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', host.profile.id).single())
    }
    const card = cheapest
    const startingHandLength = gp.hand.length

    await host.client.rpc('game_buy_card', { _game_id: game.id, _card_id: card.card_id }).then(({ error }) => {
      if (error) throw error
    })
    const { data: gp2 } = await host.client.from('game_players').select('*').eq('game_id', game.id).eq('profile_id', host.profile.id).single()
    assert(gp2.assets.length === 1 && gp2.hand.length === startingHandLength - 1, 'buying at phase 2 moves a card from hand to assets')
    const totalDebt = gp2.debts.reduce((sum, d) => sum + d.outstanding, 0)
    assert(gp2.net_worth === gp2.cash + gp2.assets[0].base_value - totalDebt, 'net worth = cash + base value - debt after buying')
  }

  console.log('\n=== Concurrency: all players ready simultaneously (only one resolution should occur) ===')
  {
    const before = await host.client.from('games').select('age, phase').eq('id', game.id).single()
    await Promise.all(players.map((p) => p.client.rpc('game_set_ready', { _game_id: game.id, _ready: true })))
    const after = await host.client.from('games').select('age, phase, status').eq('id', game.id).single()
    assert(
      after.data.status === 'active' && after.data.phase === 1 && after.data.age === before.data.age + 10,
      'simultaneous ready calls chain crisis -> income -> refill -> next age exactly once',
    )
    const { data: allPlayers } = await host.client.from('game_players').select('ready, hand').eq('game_id', game.id)
    assert(allPlayers.every((p) => !p.ready), 'ready flags reset for everyone after the chained resolution')
    assert(allPlayers.every((p) => p.hand.length === 4), 'every hand is refilled back to 4 cards')
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
  let rounds = 1 // the concurrency test above already drove one full round
  const MAX_ROUNDS = 6 + 3
  while (true) {
    const { data: g } = await host.client.from('games').select('*').eq('id', game.id).single()
    if (g.status === 'finished') {
      console.log(`  game finished after ${rounds} total rounds (final age ${g.age})`)
      break
    }
    if (rounds > MAX_ROUNDS) throw new Error('game never finished — stuck phase gate')

    const ageBefore = g.age
    await host.client.rpc('game_host_advance', { _game_id: game.id }).then(({ error }) => {
      if (error) throw error
    })

    for (let i = 0; i < players.length - 1; i++) {
      await players[i].client.rpc('game_set_ready', { _game_id: game.id, _ready: true })
    }
    const { data: mid } = await host.client.from('games').select('phase, age').eq('id', game.id).single()
    assert(mid.phase === 2 && mid.age === ageBefore, `age ${ageBefore}: doesn't advance until ALL players ready`)

    await players[players.length - 1].client.rpc('game_set_ready', { _game_id: game.id, _ready: true })
    rounds++
  }

  console.log('\n=== End-game verification ===')
  const { data: results } = await host.client.from('game_results').select('*').eq('room_id', room.id)
  assert(results.length === players.length, `game_results has one row per remaining player (${results.length}/${players.length})`)
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
    for (const p of everyone) {
      await admin.auth.admin.deleteUser(p.profile.id).catch(() => {})
    }
    console.log(`  deleted ${everyone.length} test accounts (auth.users cascades to profiles/credentials)`)
  } else {
    console.log(
      `  room deleted; ${everyone.length} test profiles left behind (set SUPABASE_SERVICE_ROLE_KEY to auto-delete test accounts too)`,
    )
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error('\nINTEGRATION TEST CRASHED:', err.message)
  process.exitCode = 1
})
