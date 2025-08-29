// Middleware to ensure users can only access their own club's data
export default defineNuxtRouteMiddleware((to) => {
  const user = useState('auth.user')
  
  if (!user.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuário não autenticado'
    })
  }
  
  // System admins have access to everything
  if (user.value.userType === 'system_admin') {
    return
  }
  
  // Club users must have a clubeId
  if (['club_admin', 'club_member'].includes(user.value.userType) && !user.value.clubeId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Usuário não está vinculado a nenhum clube'
    })
  }
  
  // Extract clubeId from route params if present
  const routeClubId = to.params.clubId as string
  
  if (routeClubId && user.value.clubeId !== routeClubId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acesso negado. Você só pode acessar dados do seu clube.'
    })
  }
})