import type { ActionResult, MarketState, PlayerState } from './types'
import { PROPERTIES_BY_ID } from '@/content/properties'
import { propertyCurrentValue } from './economy'

const SELL_FRICTION = 0.92

export function buyProperty(player: PlayerState, templateId: string, currentRound: number): ActionResult<PlayerState> {
  const template = PROPERTIES_BY_ID.get(templateId)
  if (!template) return { ok: false, error: 'unknown_property' }
  if (template.purchasePrice > player.cash) return { ok: false, error: 'insufficient_cash' }

  return {
    ok: true,
    value: {
      ...player,
      cash: player.cash - template.purchasePrice,
      properties: [
        ...player.properties,
        { id: crypto.randomUUID(), templateId, purchasePrice: template.purchasePrice, purchaseRound: currentRound },
      ],
    },
  }
}

export function sellProperty(
  player: PlayerState,
  ownedId: string,
  market: MarketState,
  currentRound: number,
): ActionResult<PlayerState> {
  const index = player.properties.findIndex((p) => p.id === ownedId)
  if (index === -1) return { ok: false, error: 'not_owned' }
  const owned = player.properties[index]
  if (!owned) return { ok: false, error: 'not_owned' }

  const salePrice = propertyCurrentValue(owned.templateId, owned.purchaseRound, market, currentRound) * SELL_FRICTION
  const properties = [...player.properties.slice(0, index), ...player.properties.slice(index + 1)]

  return { ok: true, value: { ...player, cash: player.cash + salePrice, properties } }
}
