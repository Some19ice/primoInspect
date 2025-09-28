'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabaseAuth } from '@/lib/supabase/auth'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session } = await supabaseAuth.getSession()
        
        if (mounted) {
          if (session?.user) {
            const { profile } = await supabaseAuth.getProfile()
            setAuthState({
              user: session.user,
              profile,
              session,
              loading: false,
            })
          } else {
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
            })
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
          })
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabaseAuth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.id)

        if (session?.user) {
          const { profile } = await supabaseAuth.getProfile()
          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    return supabaseAuth.signIn(email, password)
  }

  const signOut = async () => {
    const result = await supabaseAuth.signOut()
    // State will be updated by auth state change listener
    return result
  }

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => {
    const result = await supabaseAuth.updateProfile(updates)
    if (result.data) {
      setAuthState(prev => ({
        ...prev,
        profile: result.data as Profile,
      }))
    }
    return result
  }

  // Check if user has role
  const hasRole = (requiredRole: string): boolean => {
    if (!authState.profile) return false

    const roleHierarchy: Record<string, string[]> = {
      'EXECUTIVE': ['EXECUTIVE'],
      'PROJECT_MANAGER': ['PROJECT_MANAGER', 'INSPECTOR'],
      'INSPECTOR': ['INSPECTOR']
    }

    return roleHierarchy[authState.profile.role]?.includes(requiredRole) || 
           authState.profile.role === requiredRole
  }

  return {
    ...authState,
    isAuthenticated: !!authState.session,
    signIn,
    signOut,
    updateProfile,
    hasRole,
  }
}
