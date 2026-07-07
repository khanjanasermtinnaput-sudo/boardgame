import type { ActionResult, PlayerState } from './types'
import { BUSINESSES_BY_ID } from '@/content/businesses'
import { businessCurrentValue } from './economy'

const SELL_FRICTION = 0.85

export function buyBusiness(player: PlayerState, templateId: string): ActionResult<PlayerState> {
  const template = BUSINESSES_BY_ID.get(templateId)
  if (!template) return { ok: false, error: 'unknown_business' }
  if (player.businesses.some((b) => b.templateId === templateId)) {
    return { ok: false, error: 'already_owned' }
  }
  if (template.purchasePrice > player.cash) return { ok: false, error: 'insufficient_cash' }

  return {
    ok: true,
    value: {
      ...player,
      cash: player.cash - template.purchasePrice,
      businesses: [...player.businesses, { templateId, level: 1, purchasePrice: template.purchasePrice }],
    },
  }
}

export function upgradeBusiness(player: PlayerState, templateId: string): ActionResult<PlayerState> {
  const template = BUSINESSES_BY_ID.get(templateId)
  const owned = player.businesses.find((b) => b.templateId === templateId)
  if (!template || !owned) return { ok: false, error: 'not_owned' }
  if (owned.level >= template.maxLevel) return { ok: false, error: 'max_level' }
  if (template.upgradeCost > player.cash) return { ok: false, error: 'insufficient_cash' }

  return {
    ok: true,
    value: {
      ...player,
      cash: player.cash - template.upgradeCost,
      businesses: player.businesses.map((b) =>
        b.templateId === templateId ? { ...b, level: b.level + 1 } : b,
      ),
    },
  }
}

export function sellBusiness(player: PlayerState, templateId: string): ActionResult<PlayerState> {
  const owned = player.businesses.find((b) => b.templateId === templateId)
  if (!owned) return { ok: false, error: 'not_owned' }

  const salePrice = businessCurrentValue(templateId, owned.level) * SELL_FRICTION

  return {
    ok: true,
    value: {
      ...player,
      cash: player.cash + salePrice,
      businesses: player.businesses.filter((b) => b.templateId !== templateId),
    },
  }
}
