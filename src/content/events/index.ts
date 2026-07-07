import type { EventCard } from '@/engine/types'
import { POSITIVE_EVENTS } from './positive'
import { NEGATIVE_EVENTS } from './negative'
import { NEUTRAL_EVENTS } from './neutral'
import { ECONOMIC_EVENTS } from './economic'
import { BUSINESS_EVENTS } from './business'
import { FAMILY_EVENTS } from './family'
import { HEALTH_EVENTS } from './health'
import { INVESTMENT_EVENTS } from './investment'
import { TAX_EVENTS } from './tax'

export const EVENT_CARDS: EventCard[] = [
  ...POSITIVE_EVENTS,
  ...NEGATIVE_EVENTS,
  ...NEUTRAL_EVENTS,
  ...ECONOMIC_EVENTS,
  ...BUSINESS_EVENTS,
  ...FAMILY_EVENTS,
  ...HEALTH_EVENTS,
  ...INVESTMENT_EVENTS,
  ...TAX_EVENTS,
]

export const EVENT_CARDS_BY_ID = new Map(EVENT_CARDS.map((card) => [card.id, card]))
