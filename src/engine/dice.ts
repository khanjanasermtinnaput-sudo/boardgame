// Two dice, rendered as 3D-animated dice in the UI (see components/Dice3D).
// Rolling doubles grants an extra turn (see reducer.ts END_TURN handling).
export type DiceRoll = [number, number]

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

export function rollDice(): DiceRoll {
  return [rollDie(), rollDie()]
}

export function diceTotal(roll: DiceRoll): number {
  return roll[0] + roll[1]
}

export function isDouble(roll: DiceRoll): boolean {
  return roll[0] === roll[1]
}
