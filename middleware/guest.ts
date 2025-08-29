// Guest middleware - redirects authenticated users away from login/register pages
export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('auth-token')
  
  // If user is already authenticated, redirect to appropriate dashboard
  if (token.value) {
    // Try to get user info from state if available
    const user = useState('auth.user')
    
    if (user.value) {
      // Redirect based on user type
      if (user.value.userType === 'system_admin') {
        return navigateTo('/system/dashboard')
      } else if (user.value.userType === 'club_admin') {
        return navigateTo('/club/dashboard')
      } else {
        return navigateTo('/dashboard')
      }
    } else {
      // If we have token but no user info, redirect to a generic dashboard
      return navigateTo('/dashboard')
    }
  }
  
  // If no token, allow access to guest pages (login, register)
})