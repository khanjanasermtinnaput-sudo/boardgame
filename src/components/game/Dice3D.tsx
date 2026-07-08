import { motion } from 'framer-motion'

const SIZE = 56
const HALF = SIZE / 2

// Rotating the cube by these amounts brings the named face to point at the
// viewer (the classic CSS 3D dice technique: each face sits on one side of a
// cube via rotate+translateZ, and showing a given pip value means rotating
// the whole cube by that face's inverse transform).
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: 0, y: -90 },
  5: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
}

const PIP_PATTERNS: Record<number, boolean[]> = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true],
}

function Face({ value, transform }: { value: number; transform: string }) {
  return (
    <div
      className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 rounded-lg border border-white/20 bg-surface-50 p-2"
      style={{ transform }}
    >
      {PIP_PATTERNS[value]?.map((filled, i) => (
        <span key={i} className={`m-auto h-2 w-2 rounded-full ${filled ? 'bg-surface-900' : ''}`} />
      ))}
    </div>
  )
}

interface Dice3DProps {
  value: number
  rolling: boolean
}

export function Dice3D({ value, rolling }: Dice3DProps) {
  const target = FACE_ROTATIONS[value] ?? FACE_ROTATIONS[1]!
  const extraSpin = rolling ? 720 : 0

  return (
    <div style={{ perspective: 300 }} className="h-14 w-14">
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateX: target.x + extraSpin, rotateY: target.y + extraSpin }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        <Face value={1} transform={`translateZ(${HALF}px)`} />
        <Face value={6} transform={`rotateY(180deg) translateZ(${HALF}px)`} />
        <Face value={2} transform={`rotateY(90deg) translateZ(${HALF}px)`} />
        <Face value={5} transform={`rotateY(-90deg) translateZ(${HALF}px)`} />
        <Face value={3} transform={`rotateX(90deg) translateZ(${HALF}px)`} />
        <Face value={4} transform={`rotateX(-90deg) translateZ(${HALF}px)`} />
      </motion.div>
    </div>
  )
}
