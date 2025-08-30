import { z } from 'zod'

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  senha: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa')
})

// Register validation schema
export const registerSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .trim(),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  senha: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha muito longa')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    ),
  clube_id: z
    .string()
    .uuid('ID do clube inválido')
    .optional(),
  tipo: z
    .enum(['system_admin', 'club_admin', 'club_member'])
    .default('club_member')
})

// Password change schema
export const changePasswordSchema = z.object({
  senha_atual: z
    .string()
    .min(1, 'Senha atual é obrigatória'),
  senha_nova: z
    .string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha muito longa')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    ),
  confirmar_senha: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.senha_nova === data.confirmar_senha, {
  message: 'Senhas não coincidem',
  path: ['confirmar_senha']
})

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token é obrigatório')
})

// Type exports for use in API handlers
export type LoginRequest = z.infer<typeof loginSchema>
export type RegisterRequest = z.infer<typeof registerSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>