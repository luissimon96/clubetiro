import { z } from 'zod'

// CPF validation helper
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/

// Phone validation helper
const phoneRegex = /^(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[0-9]{4}-?[0-9]{4}$/

// Usuario creation schema
export const usuarioCreateSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  cpf: z
    .string()
    .regex(cpfRegex, 'CPF inválido (use formato XXX.XXX.XXX-XX ou XXXXXXXXXXX)')
    .transform((val) => val.replace(/\D/g, ''))
    .optional(),
  telefone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
  tipo: z
    .enum(['system_admin', 'club_admin', 'club_member'])
    .default('club_member'),
  clube_id: z
    .string()
    .uuid('ID do clube inválido')
    .optional(),
  permissoes: z
    .array(z.enum([
      'gerenciar_clube',
      'gerenciar_usuarios', 
      'gerenciar_eventos',
      'gerenciar_resultados',
      'ver_relatorios',
      'gerenciar_financeiro'
    ]))
    .default([]),
  endereco: z.object({
    logradouro: z.string().min(5, 'Logradouro muito curto').max(200),
    numero: z.string().min(1, 'Número é obrigatório').max(20),
    complemento: z.string().max(100).optional().or(z.literal('')),
    bairro: z.string().min(2, 'Bairro muito curto').max(100),
    cidade: z.string().min(2, 'Cidade muito curta').max(100),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres').toUpperCase(),
    cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').transform((val) => val.replace('-', ''))
  }).optional(),
  informacoes_tiro: z.object({
    categoria: z.enum(['iniciante', 'intermediario', 'avancado', 'expert']).default('iniciante'),
    modalidades_preferidas: z.array(z.enum(['pistola', 'carabina', 'skeet', 'trap', 'ipsc'])).default([]),
    numero_registro_federacao: z.string().optional(),
    clube_origem: z.string().optional()
  }).optional(),
  ativo: z.boolean().default(true)
})

// Usuario update schema (all fields optional except id)
export const usuarioUpdateSchema = usuarioCreateSchema.partial()

// Usuario query/filter schema
export const usuarioQuerySchema = z.object({
  tipo: z.enum(['system_admin', 'club_admin', 'club_member']).optional(),
  clube_id: z.string().uuid().optional(),
  ativo: z.boolean().optional(),
  categoria: z.enum(['iniciante', 'intermediario', 'avancado', 'expert']).optional(),
  modalidade: z.enum(['pistola', 'carabina', 'skeet', 'trap', 'ipsc']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().optional()
})

// Usuario status change
export const usuarioStatusSchema = z.object({
  ativo: z.boolean()
})

// Usuario permissions update
export const usuarioPermissionsSchema = z.object({
  permissoes: z.array(z.enum([
    'gerenciar_clube',
    'gerenciar_usuarios',
    'gerenciar_eventos', 
    'gerenciar_resultados',
    'ver_relatorios',
    'gerenciar_financeiro'
  ]))
})

// Type exports
export type UsuarioCreateRequest = z.infer<typeof usuarioCreateSchema>
export type UsuarioUpdateRequest = z.infer<typeof usuarioUpdateSchema>
export type UsuarioQueryParams = z.infer<typeof usuarioQuerySchema>
export type UsuarioStatusRequest = z.infer<typeof usuarioStatusSchema>
export type UsuarioPermissionsRequest = z.infer<typeof usuarioPermissionsSchema>