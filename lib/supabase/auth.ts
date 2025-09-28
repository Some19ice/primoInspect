import { supabase } from './client'
import { Database } from './types'

type Profile = Database['public']['Tables']['profiles']['Row']

export class SupabaseAuthService {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  async signUp(email: string, password: string, metadata: { name: string; role?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name,
          role: metadata.role || 'INSPECTOR'
        }
      }
    })
    return { data, error }
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }

  async getProfile(userId?: string): Promise<{ profile: Profile | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      return { profile: null, error: 'No user found' }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single()

    return { profile, error }
  }

  async updateProfile(updates: Partial<Omit<Profile, 'id' | 'created_at'>>) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'No user found' }
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    return { data, error }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Reset password
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { data, error }
  }

  // Update password
  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: password
    })
    return { data, error }
  }

  // Role-based redirect after login
  getRoleBasedRedirect(role: string): string {
    switch (role) {
      case 'EXECUTIVE':
        return '/dashboard/executive'
      case 'PROJECT_MANAGER':
        return '/dashboard/manager'
      case 'INSPECTOR':
        return '/dashboard/inspector'
      default:
        return '/dashboard/inspector'
    }
  }

  // Check if user has required role
  async hasRole(requiredRole: string): Promise<boolean> {
    const { profile } = await this.getProfile()
    if (!profile) return false

    const roleHierarchy: Record<string, string[]> = {
      'EXECUTIVE': ['EXECUTIVE'],
      'PROJECT_MANAGER': ['PROJECT_MANAGER', 'INSPECTOR'],
      'INSPECTOR': ['INSPECTOR']
    }

    return roleHierarchy[profile.role]?.includes(requiredRole) || false
  }

  // Check if user can access project 
  async canAccessProject(projectId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: membership } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    return !!membership
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService()
