import type { ActionResult, AuctionKind, BoardSpace, GameState, MarketRegimeType, PlayerState } from './types'
import type { GameAction } from './actions'
import { BOARD, BOARD_SIZE } from '@/content/board'
import { BUSINESSES, BUSINESSES_BY_ID } from '@/content/businesses'
import { PROPERTIES, PROPERTIES_BY_ID } from '@/content/properties'
import { MARKET_REGIMES } from '@/content/marketRegimes'
import { rollDice, diceTotal, isDouble } from './dice'
import { drawRandomEventCard, applyEventCard } from './events'
import { applyMarketTick, tickMarketCountdown } from './market'
import { buyInvestment, sellInvestment } from './investments'
import { buyBusiness, upgradeBusiness, sellBusiness } from './businesses'
import { buyProperty, sellProperty } from './realEstate'
import { takeLoan, repayLoan } from './loans'
import { buyInsurance, cancelInsurance, mitigateLoss } from './insurance'
import { totalPassiveIncome, totalExpenses, netWorth } from './economy'
import { evaluateWinner } from './winConditions'

const EDUCATION_COST = 3000
const EDUCATION_SALARY_BOOST = 200
const BONUS_SPACE_AMOUNT = 400
const CHARITY_DONATION_RATE = 0.01
const TAX_RATE = 0.2
const AUCTION_DISCOUNT = 0.75
const ECONOMIC_CRISIS_LOSS_RATE = 0.03
const RANDOM_SPACE_PERCENT_SWING = 0.05
const RANDOM_SPACE_FLAT_AMOUNT = 300
const BANKRUPTCY_CASH_THRESHOLD = -2000
const MAX_DOUBLES_STREAK = 3

function appendLog(state: GameState, message: string): GameState['log'] {
  return [...state.log, { seq: state.log.length, message, timestamp: Date.now() }]
}

function getPlayer(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find((p) => p.id === playerId)
}

function playerName(state: GameState, playerId: string): string {
  return getPlayer(state, playerId)?.name ?? 'Player'
}

function netWorthOf(state: GameState, player: PlayerState): number {
  return netWorth(player, state.market, state.round)
}

function applyCashDelta(state: GameState, playerId: string, amount: number, message: string): GameState {
  const player = getPlayer(state, playerId)
  if (!player) return state
  const finalAmount = amount < 0 ? -mitigateLoss(player, -amount) : amount
  const players = state.players.map((p) => (p.id === playerId ? { ...p, cash: p.cash + finalAmount } : p))
  return { ...state, players, log: appendLog(state, message) }
}

function requireActionPhase(state: GameState): ActionResult<true> {
  if (state.phase !== 'action') return { ok: false, error: 'not_action_phase' }
  if (state.pendingEventCardId) return { ok: false, error: 'must_ack_event_card' }
  return { ok: true, value: true }
}

function withPlayerUpdate(
  state: GameState,
  actorId: string,
  fn: (player: PlayerState) => ActionResult<PlayerState>,
): ActionResult<GameState> {
  const gate = requireActionPhase(state)
  if (!gate.ok) return gate

  const player = getPlayer(state, actorId)
  if (!player) return { ok: false, error: 'player_not_found' }

  const result = fn(player)
  if (!result.ok) return result

  const players = state.players.map((p) => (p.id === actorId ? result.value : p))
  return { ok: true, value: { ...state, players } }
}

function resolveEconomicCrisis(state: GameState): GameState {
  const badRegimes: MarketRegimeType[] = ['bear', 'recession', 'crash']
  const regime = badRegimes[Math.floor(Math.random() * badRegimes.length)] ?? 'bear'
  const market = applyMarketTick(state.market, regime)

  const players = state.players.map((p) => {
    const loss = mitigateLoss(p, netWorth(p, market, state.round) * ECONOMIC_CRISIS_LOSS_RATE)
    return { ...p, cash: p.cash - loss }
  })

  const log = appendLog(
    { ...state, market },
    `Economic Crisis! The market shifts to ${MARKET_REGIMES[regime].name} and everyone takes a hit.`,
  )

  return { ...state, players, market, log }
}

function resolveEventDraw(state: GameState, playerId: string, spaceType: 'event' | 'random'): GameState {
  if (spaceType === 'random') {
    const player = getPlayer(state, playerId)
    if (!player) return state
    const roll = Math.random()

    if (roll < 0.25) {
      return applyCashDelta(state, playerId, RANDOM_SPACE_FLAT_AMOUNT, `${player.name} finds a wildcard windfall of $${RANDOM_SPACE_FLAT_AMOUNT}.`)
    }
    if (roll < 0.5) {
      return applyCashDelta(state, playerId, -RANDOM_SPACE_FLAT_AMOUNT, `${player.name} hits a wildcard setback of -$${RANDOM_SPACE_FLAT_AMOUNT}.`)
    }
    if (roll < 0.75) {
      const amount = netWorthOf(state, player) * RANDOM_SPACE_PERCENT_SWING
      return applyCashDelta(state, playerId, amount, `${player.name} gets a wildcard boost of ${Math.round(RANDOM_SPACE_PERCENT_SWING * 100)}% net worth.`)
    }
    const amount = -netWorthOf(state, player) * RANDOM_SPACE_PERCENT_SWING
    return applyCashDelta(state, playerId, amount, `${player.name} suffers a wildcard loss of ${Math.round(RANDOM_SPACE_PERCENT_SWING * 100)}% net worth.`)
  }

  const player = getPlayer(state, playerId)
  if (!player) return state

  const card = drawRandomEventCard()
  const { player: nextPlayer, market: nextMarket } = applyEventCard(player, state.market, card, state.round)
  const players = state.players.map((p) => (p.id === playerId ? nextPlayer : p))
  const log = appendLog(state, `${player.name} draws "${card.title}": ${card.flavor}`)

  return { ...state, players, market: nextMarket, log, pendingEventCardId: card.id }
}

function resolveAuctionOffer(state: GameState, playerId: string): GameState {
  const businessCandidates = BUSINESSES.map((b) => ({
    kind: 'business' as AuctionKind,
    id: b.id,
    price: Math.round(b.purchasePrice * AUCTION_DISCOUNT),
  }))
  const propertyCandidates = PROPERTIES.map((p) => ({
    kind: 'property' as AuctionKind,
    id: p.id,
    price: Math.round(p.purchasePrice * AUCTION_DISCOUNT),
  }))
  const pool = [...businessCandidates, ...propertyCandidates]
  const offer = pool[Math.floor(Math.random() * pool.length)]
  if (!offer) return state

  const name = offer.kind === 'business' ? BUSINESSES_BY_ID.get(offer.id)?.name : PROPERTIES_BY_ID.get(offer.id)?.name
  const log = appendLog(state, `${playerName(state, playerId)} arrives at the Auction House — up for bid: ${name} at a 25% discount.`)

  return { ...state, pendingAuction: offer, log }
}

function handleBuyAuctionItem(state: GameState, actorId: string): ActionResult<GameState> {
  if (!state.pendingAuction) return { ok: false, error: 'no_auction_offer' }
  const player = getPlayer(state, actorId)
  if (!player) return { ok: false, error: 'player_not_found' }

  const offer = state.pendingAuction
  if (offer.price > player.cash) return { ok: false, error: 'insufficient_cash' }

  let updatedPlayer: PlayerState
  if (offer.kind === 'business') {
    if (player.businesses.some((b) => b.templateId === offer.id)) return { ok: false, error: 'already_owned' }
    updatedPlayer = {
      ...player,
      cash: player.cash - offer.price,
      businesses: [...player.businesses, { templateId: offer.id, level: 1, purchasePrice: offer.price }],
    }
  } else {
    updatedPlayer = {
      ...player,
      cash: player.cash - offer.price,
      properties: [
        ...player.properties,
        { id: crypto.randomUUID(), templateId: offer.id, purchasePrice: offer.price, purchaseRound: state.round },
      ],
    }
  }

  const players = state.players.map((p) => (p.id === actorId ? updatedPlayer : p))
  const log = appendLog(state, `${player.name} wins the auction.`)
  return { ok: true, value: { ...state, players, pendingAuction: undefined, log } }
}

function resolveSpace(state: GameState, space: BoardSpace, playerId: string): GameState {
  switch (space.type) {
    case 'payday':
      return { ...state, log: appendLog(state, `${playerName(state, playerId)} lands on Payday Plaza.`) }
    case 'salary': {
      const player = getPlayer(state, playerId)
      if (!player) return state
      return applyCashDelta(state, playerId, player.salary, `${player.name} lands on Bonus Payday and collects an extra $${player.salary.toFixed(0)}.`)
    }
    case 'tax': {
      const player = getPlayer(state, playerId)
      if (!player) return state
      const tax = Math.round(totalPassiveIncome(player, state.market) * TAX_RATE)
      return applyCashDelta(state, playerId, -tax, `${player.name} pays $${tax.toFixed(0)} in income tax.`)
    }
    case 'bonus':
      return applyCashDelta(state, playerId, BONUS_SPACE_AMOUNT, `${playerName(state, playerId)} lands on Lucky Break and collects a $${BONUS_SPACE_AMOUNT} bonus.`)
    case 'charity': {
      const player = getPlayer(state, playerId)
      if (!player) return state
      const donation = Math.round(netWorthOf(state, player) * CHARITY_DONATION_RATE)
      return applyCashDelta(state, playerId, -donation, `${player.name} donates $${donation.toFixed(0)} to charity.`)
    }
    case 'vacation': {
      const players = state.players.map((p) => (p.id === playerId ? { ...p, skipTurns: p.skipTurns + 1 } : p))
      const log = appendLog(state, `${playerName(state, playerId)} heads off on vacation and will skip their next turn.`)
      return { ...state, players, log }
    }
    case 'market': {
      const market = applyMarketTick(state.market)
      const log = appendLog(state, `The market bell rings — conditions shift to ${MARKET_REGIMES[market.regime].name}.`)
      return { ...state, market, log }
    }
    case 'economic_crisis':
      return resolveEconomicCrisis(state)
    case 'event':
    case 'random':
      return resolveEventDraw(state, playerId, space.type)
    case 'auction':
      return resolveAuctionOffer(state, playerId)
    case 'investment':
    case 'business':
    case 'real_estate':
    case 'loan':
    case 'insurance':
    case 'education':
      return { ...state, log: appendLog(state, `${playerName(state, playerId)} visits ${space.name}.`) }
    default:
      return state
  }
}

function handleRollDice(state: GameState): ActionResult<GameState> {
  if (state.phase !== 'rolling') return { ok: false, error: 'not_rolling_phase' }

  const currentPlayer = state.players[state.turnIndex]
  if (!currentPlayer) return { ok: false, error: 'no_current_player' }

  const roll = rollDice()
  const total = diceTotal(roll)
  const rawNewPosition = currentPlayer.position + total
  const newPosition = rawNewPosition % BOARD_SIZE
  const passedPayday = rawNewPosition >= BOARD_SIZE

  let players = state.players.map((p) => (p.id === currentPlayer.id ? { ...p, position: newPosition } : p))
  let log = appendLog(state, `${currentPlayer.name} rolled ${roll[0]} + ${roll[1]} = ${total}.`)

  if (passedPayday) {
    const mover = players.find((p) => p.id === currentPlayer.id)
    if (mover) {
      const income = totalPassiveIncome(mover, state.market)
      const expenses = totalExpenses(mover)
      players = players.map((p) => (p.id === currentPlayer.id ? { ...p, cash: p.cash + income - expenses } : p))
      log = [
        ...log,
        {
          seq: log.length,
          message: `${currentPlayer.name} collects payday: +$${income.toFixed(0)} income, -$${expenses.toFixed(0)} expenses.`,
          timestamp: Date.now(),
        },
      ]
    }
  }

  const space = BOARD[newPosition]
  let nextState: GameState = {
    ...state,
    players,
    log,
    lastRoll: roll,
    doublesStreak: isDouble(roll) ? state.doublesStreak + 1 : 0,
    phase: 'action',
  }

  if (space) {
    nextState = resolveSpace(nextState, space, currentPlayer.id)
  }

  return { ok: true, value: nextState }
}

function handleAckEventCard(state: GameState): ActionResult<GameState> {
  if (!state.pendingEventCardId) return { ok: false, error: 'no_pending_card' }
  return { ok: true, value: { ...state, pendingEventCardId: undefined } }
}

function checkBankruptcy(state: GameState, playerId: string): PlayerState[] {
  return state.players.map((p) => {
    if (p.id !== playerId || p.bankrupt) return p
    return p.cash < BANKRUPTCY_CASH_THRESHOLD ? { ...p, bankrupt: true } : p
  })
}

function findNextActivePlayerIndex(players: PlayerState[], fromIndex: number): number {
  const n = players.length
  for (let step = 1; step <= n; step++) {
    const idx = (fromIndex + step) % n
    const candidate = players[idx]
    if (candidate && !candidate.bankrupt) return idx
  }
  return fromIndex
}

function handleEndTurn(state: GameState): ActionResult<GameState> {
  if (state.phase !== 'action') return { ok: false, error: 'not_action_phase' }
  if (state.pendingEventCardId) return { ok: false, error: 'must_ack_event_card' }
  if (state.pendingAuction) return { ok: false, error: 'must_resolve_auction' }

  const currentPlayer = state.players[state.turnIndex]
  if (!currentPlayer) return { ok: false, error: 'no_current_player' }

  let players = checkBankruptcy(state, currentPlayer.id)
  const grantsExtraTurn = state.lastRoll ? isDouble(state.lastRoll) && state.doublesStreak < MAX_DOUBLES_STREAK : false

  let nextTurnIndex = state.turnIndex
  let round = state.round
  let market = state.market

  if (!grantsExtraTurn) {
    nextTurnIndex = findNextActivePlayerIndex(players, state.turnIndex)
    if (nextTurnIndex <= state.turnIndex) {
      round += 1
      market = tickMarketCountdown(market)
    }

    let guard = 0
    while (players[nextTurnIndex] && players[nextTurnIndex]!.skipTurns > 0 && guard < players.length) {
      guard += 1
      players = players.map((p, i) => (i === nextTurnIndex ? { ...p, skipTurns: p.skipTurns - 1 } : p))
      const advanced = findNextActivePlayerIndex(players, nextTurnIndex)
      if (advanced <= nextTurnIndex) {
        round += 1
        market = tickMarketCountdown(market)
      }
      nextTurnIndex = advanced
    }
  }

  let nextState: GameState = {
    ...state,
    players,
    market,
    round,
    turnIndex: nextTurnIndex,
    phase: 'rolling',
    lastRoll: grantsExtraTurn ? state.lastRoll : undefined,
    doublesStreak: grantsExtraTurn ? state.doublesStreak : 0,
    pendingAuction: undefined,
  }

  const winnerId = evaluateWinner(nextState)
  if (winnerId) {
    nextState = { ...nextState, phase: 'ended', winnerId, log: appendLog(nextState, `${playerName(nextState, winnerId)} wins the game!`) }
  }

  return { ok: true, value: nextState }
}

export function applyGameAction(state: GameState, actorId: string, action: GameAction): ActionResult<GameState> {
  if (state.phase === 'ended') return { ok: false, error: 'game_ended' }

  const currentPlayer = state.players[state.turnIndex]
  if (!currentPlayer) return { ok: false, error: 'no_current_player' }
  if (currentPlayer.id !== actorId) return { ok: false, error: 'not_your_turn' }

  switch (action.type) {
    case 'ROLL_DICE':
      return handleRollDice(state)
    case 'ACK_EVENT_CARD':
      return handleAckEventCard(state)
    case 'BUY_INVESTMENT':
      return withPlayerUpdate(state, actorId, (p) => buyInvestment(p, action.instrumentId, action.quantity, state.market))
    case 'SELL_INVESTMENT':
      return withPlayerUpdate(state, actorId, (p) => sellInvestment(p, action.instrumentId, action.quantity, state.market))
    case 'BUY_BUSINESS':
      return withPlayerUpdate(state, actorId, (p) => buyBusiness(p, action.templateId))
    case 'UPGRADE_BUSINESS':
      return withPlayerUpdate(state, actorId, (p) => upgradeBusiness(p, action.templateId))
    case 'SELL_BUSINESS':
      return withPlayerUpdate(state, actorId, (p) => sellBusiness(p, action.templateId))
    case 'BUY_PROPERTY':
      return withPlayerUpdate(state, actorId, (p) => buyProperty(p, action.templateId, state.round))
    case 'SELL_PROPERTY':
      return withPlayerUpdate(state, actorId, (p) => sellProperty(p, action.ownedId, state.market, state.round))
    case 'TAKE_LOAN':
      return withPlayerUpdate(state, actorId, (p) => takeLoan(p, action.amount, state.market.interestRate))
    case 'REPAY_LOAN':
      return withPlayerUpdate(state, actorId, (p) => repayLoan(p, action.loanId, action.amount))
    case 'BUY_INSURANCE':
      return withPlayerUpdate(state, actorId, (p) => ({ ok: true, value: buyInsurance(p) }))
    case 'CANCEL_INSURANCE':
      return withPlayerUpdate(state, actorId, (p) => ({ ok: true, value: cancelInsurance(p) }))
    case 'BUY_EDUCATION':
      return withPlayerUpdate(state, actorId, (p) => {
        if (p.educated) return { ok: false, error: 'already_educated' }
        if (EDUCATION_COST > p.cash) return { ok: false, error: 'insufficient_cash' }
        return {
          ok: true,
          value: { ...p, cash: p.cash - EDUCATION_COST, salary: p.salary + EDUCATION_SALARY_BOOST, educated: true },
        }
      })
    case 'BUY_AUCTION_ITEM':
      return handleBuyAuctionItem(state, actorId)
    case 'END_TURN':
      return handleEndTurn(state)
    default:
      return { ok: false, error: 'unknown_action' }
  }
}
