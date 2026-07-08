import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuthStore } from '@/stores/authStore'
import { switchAccount } from '@/lib/auth'

export function SettingsScreen() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)

  async function handleSwitchAccount() {
    await switchAccount()
    setProfile(null)
    navigate('/home')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-surface-50">Settings</h1>
        <Button variant="secondary" size="sm" onClick={() => navigate('/home')}>
          Back
        </Button>
      </header>

      <GlassCard className="flex flex-col gap-4 p-6">
        <div>
          <p className="text-sm text-surface-400">Signed in as</p>
          <p className="font-medium text-surface-50">{profile?.username}</p>
        </div>
        <div className="border-t border-white/10 pt-4">
          <p className="mb-2 text-sm text-surface-400">
            Switching accounts signs you out of this device. You can log back in with any username and PIN at any
            time.
          </p>
          <Button variant="danger" onClick={handleSwitchAccount}>
            Switch Account
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
