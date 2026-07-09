import { describe, expect, it } from 'vitest'
import { tileRingPositions } from '../board'

describe('tileRingPositions', () => {
  it('returns an empty array for zero or negative count', () => {
    expect(tileRingPositions(0)).toEqual([])
    expect(tileRingPositions(-1)).toEqual([])
  })

  it('returns exactly `count` positions', () => {
    expect(tileRingPositions(12)).toHaveLength(12)
  })

  it('places the first tile at the top of the ring', () => {
    const [first] = tileRingPositions(4)
    expect(first.x).toBeCloseTo(0)
    expect(first.y).toBeCloseTo(-1)
  })

  it('spaces tiles evenly around the ring (4 tiles at top/right/bottom/left)', () => {
    const [top, right, bottom, left] = tileRingPositions(4)
    expect(top).toEqual({ x: expect.closeTo(0), y: expect.closeTo(-1) })
    expect(right.x).toBeCloseTo(1)
    expect(right.y).toBeCloseTo(0)
    expect(bottom.x).toBeCloseTo(0)
    expect(bottom.y).toBeCloseTo(1)
    expect(left.x).toBeCloseTo(-1)
    expect(left.y).toBeCloseTo(0)
  })

  it('scales with radius', () => {
    const [unit] = tileRingPositions(4, 1)
    const [scaled] = tileRingPositions(4, 2)
    expect(scaled.x).toBeCloseTo(unit.x * 2)
    expect(scaled.y).toBeCloseTo(unit.y * 2)
  })
})
