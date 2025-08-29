// Middleware to ensure only system administrators can access certain routes
export default defineNuxtRouteMiddleware(() => {
  const user = useState('auth.user')
  
  if (!user.value || user.value.userType !== 'system_admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acesso negado. Apenas administradores do sistema podem acessar esta área.'
    })
  }
})