import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { PinInput } from '@/components/ui/PinInput'
import { Avatar } from '@/components/ui/Avatar'
import { authenticate, getRememberedUsername, switchAccount } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'

const USERNAME_RE = /^[A-Za-z0-9_]{1,10}$/
const PIN_RE = /^\d{4}$/

function friendlyError(message: string): string {
  switch (message) {
    case 'invalid_pin':
      return 'Incorrect PIN. Please try again.'
    case 'account_locked':
      return 'Too many incorrect PIN attempts. Please wait a bit before trying again.'
    case 'invalid_username':
      return 'Usernames can be up to 10 letters, numbers, or underscores.'
    case 'username_taken':
      return 'That username was just taken — try again.'
    case 'not_authenticated':
      return 'Session expired. Please refresh and try again.'
    case 'anonymous_disabled':
      return 'Sign-in is unavailable right now — anonymous auth is disabled on the server. Contact the site admin.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

interface Particle {
  left: string
  size: string
  drift: string
  duration: string
  delay: string
}

function useAuthParticles(count: number): Particle[] {
  return useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: `${(Math.random() * 100).toFixed(1)}%`,
        size: `${(2 + Math.random() * 3).toFixed(1)}px`,
        drift: `${(Math.random() * 40 - 20).toFixed(1)}px`,
        duration: `${(14 + Math.random() * 12).toFixed(1)}s`,
        delay: `${(-Math.random() * 20).toFixed(1)}s`,
      })),
    [count],
  )
}

export function LoginScreen() {
  const [remembered, setRemembered] = useState(getRememberedUsername())
  const [username, setUsername] = useState(remembered ?? '')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const setProfile = useAuthStore((s) => s.setProfile)
  const shouldReduceMotion = useReducedMotion()
  const particles = useAuthParticles(14)

  const usernameValid = USERNAME_RE.test(username)
  const pinValid = PIN_RE.test(pin)
  const canSubmit = usernameValid && pinValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await authenticate(username, pin)
      setProfile(result.profile)
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : 'unknown'))
      setPin('')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSwitchAccount() {
    void switchAccount()
    setRemembered(null)
    setUsername('')
    setPin('')
    setError(null)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="auth-orb-drift absolute -top-16 -left-16 h-72 w-72 rounded-full bg-emerald-glow opacity-30 blur-3xl" />
        <div
          className="auth-orb-drift absolute -right-20 -bottom-24 h-80 w-80 rounded-full bg-sky-glow opacity-25 blur-3xl"
          style={{ animationDuration: '22s', animationDelay: '-4s' }}
        />
        <div
          className="auth-orb-drift absolute top-[40%] right-[8%] h-52 w-52 rounded-full bg-gold-glow opacity-15 blur-3xl"
          style={{ animationDuration: '24s', animationDelay: '-9s' }}
        />
        {!shouldReduceMotion &&
          particles.map((p, i) => (
            <span
              key={i}
              className="auth-particle bg-emerald-glow"
              style={
                {
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  '--auth-drift': p.drift,
                  '--auth-dur': p.duration,
                  '--auth-delay': p.delay,
                } as React.CSSProperties
              }
            />
          ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div
            className="auth-logo-float mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-glow to-sky-glow shadow-[var(--shadow-glow-emerald)]"
            aria-hidden
          >
            <span className="font-display text-3xl font-bold text-surface-950">N</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-surface-50">Net Worth</h1>
          <p className="mt-1 text-sm text-surface-400">Build your empire. Outgrow the rest.</p>
        </div>

        <GlassCard className="p-7">
          {remembered ? (
            <div className="flex flex-col items-center gap-4">
              <span className="text-sm text-surface-400">Welcome Back</span>
              <Avatar name={remembered} size="lg" />
              <span className="text-lg font-semibold text-surface-50">{remembered}</span>

              <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4">
                <PinInput value={pin} onChange={setPin} label="Enter your PIN" autoFocus />
                {error && <p className="text-sm text-rose-glow">{error}</p>}
                <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Switch Account
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <TextInput
                label="Username"
                placeholder="Up to 10 characters"
                value={username}
                maxLength={10}
                autoFocus
                onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))}
              />
              <PinInput value={pin} onChange={setPin} label="4-Digit PIN" />
              {error && <p className="text-sm text-rose-glow">{error}</p>}
              <Button type="submit" className="w-full" disabled={!canSubmit} loading={submitting}>
                Continue
              </Button>
              <p className="text-center text-xs text-surface-400">
                New here? Just enter a username and PIN — your account is created automatically.
              </p>
            </form>
          )}
        </GlassCard>

        <p className="mt-6 text-center text-xs text-surface-500">© 2026 Net Worth</p>
      </motion.div>
    </div>
  )
}
