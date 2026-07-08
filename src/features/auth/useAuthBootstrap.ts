import { useEffect } from 'react'
import { fetchOwnProfile } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'

// Bounds how long the app can sit on the loading splash. Without this, a
// bootstrap call that never settles (hung fetch, dead network) leaves the
// user on an indefinite spinner with no way to reach the login form.
const BOOTSTRAP_TIMEOUT_MS = 8000

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('bootstrap_timeout')), ms))
}

export function useAuthBootstrap(): void {
  const setProfile = useAuthStore((s) => s.setProfile)
  const setStatus = useAuthStore((s) => s.setStatus)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setStatus('loading')
      try {
        await Promise.race([
          (async () => {
            const profile = await fetchOwnProfile()
            if (!cancelled) setProfile(profile)
          })(),
          timeout(BOOTSTRAP_TIMEOUT_MS),
        ])
      } catch {
        if (!cancelled) setProfile(null)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [setProfile, setStatus])
}
