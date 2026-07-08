import { useEffect } from 'react'
import { ensureAnonymousSession, fetchOwnProfile } from '@/lib/auth'
import { useAuthStore } from '@/stores/authStore'

export function useAuthBootstrap(): void {
  const setProfile = useAuthStore((s) => s.setProfile)
  const setStatus = useAuthStore((s) => s.setStatus)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setStatus('loading')
      try {
        await ensureAnonymousSession()
        const profile = await fetchOwnProfile()
        if (!cancelled) setProfile(profile)
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
