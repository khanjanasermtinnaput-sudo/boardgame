import { Suspense, lazy } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap'
import { useAuthStore } from '@/stores/authStore'
import { LoginScreen } from '@/features/auth/LoginScreen'

const HomeScreen = lazy(() => import('@/features/home/HomeScreen').then((m) => ({ default: m.HomeScreen })))
const ProfileScreen = lazy(() => import('@/features/profile/ProfileScreen').then((m) => ({ default: m.ProfileScreen })))
const LeaderboardScreen = lazy(() =>
  import('@/features/leaderboard/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen })),
)
const SettingsScreen = lazy(() => import('@/features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })))
const PlayScreen = lazy(() => import('@/features/room/PlayScreen').then((m) => ({ default: m.PlayScreen })))
const LobbyScreen = lazy(() => import('@/features/room/LobbyScreen').then((m) => ({ default: m.LobbyScreen })))
const GameScreen = lazy(() => import('@/features/game/GameScreen').then((m) => ({ default: m.GameScreen })))

function LoadingSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-[color:var(--color-text-muted)]">Loading Net Worth…</p>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') return <LoadingSplash />
  if (status === 'signed_out') return <LoginScreen />
  return <>{children}</>
}

function App() {
  useAuthBootstrap()

  return (
    <HashRouter>
      <RequireAuth>
        <Suspense fallback={<LoadingSplash />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/play" element={<PlayScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/room/:roomId/lobby" element={<LobbyScreen />} />
            <Route path="/room/:roomId/game" element={<GameScreen />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </RequireAuth>
    </HashRouter>
  )
}

export default App
