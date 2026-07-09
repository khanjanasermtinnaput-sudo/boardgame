import { useState } from 'react'
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
      return 'Incorrect PIN.'
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    if (!username) {
      setError('Username is required.')
      return
    }
    if (!usernameValid) {
      setError('Usernames can be up to 10 letters, numbers, or underscores.')
      return
    }
    if (!pinValid) {
      setError('PIN must be exactly 4 digits.')
      return
    }

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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0F0F10] px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">NET WORTH ONLINE</h1>
          <p className="mt-1 text-sm text-gray-400">Financial Strategy Card Game</p>
        </div>

        <div className="rounded-2xl border border-[#2A2A2A] p-8">
          {remembered ? (
            <div className="flex flex-col items-center gap-4">
              <span className="text-sm text-gray-400">Welcome Back</span>
              <Avatar name={remembered} size="lg" color="rose" />
              <span className="text-lg font-semibold text-white">{remembered}</span>

              <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-4">
                <PinInput value={pin} onChange={setPin} label="Enter your PIN" autoFocus />
                {error && <p className="text-sm text-[#DC2626]">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting} loading={submitting}>
                  Sign In
                </Button>
                <button type="button" onClick={handleSwitchAccount} className="text-sm text-gray-400 hover:text-gray-200">
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
              {error && <p className="text-sm text-[#DC2626]">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting} loading={submitting}>
                Sign In
              </Button>
              <p className="text-center text-xs text-gray-400">
                New here? Just enter a username and PIN — your account is created automatically.
              </p>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">© 2026 Net Worth Online</p>
      </div>
    </div>
  )
}
