// Client-side authentication composable
import type { AuthContext, LoginRequest } from '~/models/auth'

export const useAuth = () => {
  const user = useState<AuthContext | null>('auth.user', () => null)
  const token = useCookie('auth-token', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      // Update user state
      user.value = response.user
      
      // Token is automatically set by server via HTTP-only cookie
      // But we also store it in a readable cookie for client access
      token.value = response.accessToken

      return response
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear client state regardless of server response
      user.value = null
      token.value = null
      await navigateTo('/login')
    }
  }

  const validateToken = async () => {
    if (!token.value) {
      user.value = null
      return false
    }

    try {
      const response = await $fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (response.valid) {
        user.value = response.user
        return true
      } else {
        user.value = null
        token.value = null
        return false
      }
    } catch (error) {
      console.error('Token validation error:', error)
      user.value = null
      token.value = null
      return false
    }
  }

  const isAuthenticated = computed(() => !!user.value)
  
  const isSystemAdmin = computed(() => user.value?.userType === 'system_admin')
  
  const isClubAdmin = computed(() => user.value?.userType === 'club_admin')
  
  const isClubMember = computed(() => user.value?.userType === 'club_member')

  const hasPermission = (permission: string) => {
    if (!user.value) return false
    if (user.value.userType === 'system_admin') return true
    if (user.value.userType !== 'club_admin') return false
    
    return user.value.permissoes?.[permission as keyof typeof user.value.permissoes] || false
  }

  const canAccessClub = (clubeId?: string) => {
    if (!user.value) return false
    if (user.value.userType === 'system_admin') return true
    if (!clubeId) return true // Global resources
    
    return user.value.clubeId === clubeId
  }

  return {
    user: readonly(user),
    token: readonly(token),
    login,
    logout,
    validateToken,
    isAuthenticated,
    isSystemAdmin,
    isClubAdmin,
    isClubMember,
    hasPermission,
    canAccessClub
  }
}