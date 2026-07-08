import { useState } from 'react'
import { motion } from 'framer-motion'
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
    default:
      return 'Something went wrong. Please try again.'
  }
}

export function LoginScreen() {
  const [remembered, setRemembered] = useState(getRememberedUsername())
  const [username, setUsername] = useState(remembered ?? '')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const setProfile = useAuthStore((s) => s.setProfile)

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-surface-50">Net Worth</h1>
          <p className="mt-1 text-sm text-surface-400">Build your empire. Outgrow the rest.</p>
        </div>

        <GlassCard className="p-6">
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
      </motion.div>
    </div>
  )
}
