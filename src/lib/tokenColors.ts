// Matches the seat-assignment palette used by the create_room/join_room
// RPCs (supabase/migrations/0001_init.sql) — one color per seat, 10 total.
// These are flat identification swatches only (tell players apart at a
// glance), independent of the app's red brand accent.
export const TOKEN_COLOR_HEX: Record<string, string> = {
  emerald: '#10b981',
  gold: '#f59e0b',
  sky: '#38bdf8',
  rose: '#f43f5e',
  violet: '#a78bfa',
  amber: '#fbbf24',
  cyan: '#22d3ee',
  fuchsia: '#e879f9',
  lime: '#a3e635',
  orange: '#fb923c',
}

export function tokenColorHex(color: string | null | undefined): string {
  return (color && TOKEN_COLOR_HEX[color]) ?? TOKEN_COLOR_HEX.emerald!
}
