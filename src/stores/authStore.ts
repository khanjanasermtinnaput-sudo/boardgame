import { create } from 'zustand'
import type { Profile } from '@/lib/auth'

export type AuthStatus = 'loading' | 'signed_out' | 'authenticated'

interface AuthState {
  status: AuthStatus
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  setStatus: (status: AuthStatus) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  profile: null,
  setProfile: (profile) => set({ profile, status: profile ? 'authenticated' : 'signed_out' }),
  setStatus: (status) => set({ status }),
}))
