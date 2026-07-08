export function money(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(amount)).toLocaleString()}`
}
