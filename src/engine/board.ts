/** Pure layout helper for the cosmetic circular board — evenly spaces `count`
 * tiles around a ring, starting at the top and proceeding clockwise. Purely
 * visual: tile outcomes are freshly randomized each round server-side, not
 * tied to persistent per-tile state.
 */
export interface TilePosition {
  x: number
  y: number
}

export function tileRingPositions(count: number, radius = 1): TilePosition[] {
  if (count <= 0) return []
  const positions: TilePosition[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2
    positions.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) })
  }
  return positions
}
