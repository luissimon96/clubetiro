import { z } from 'zod'

// CNPJ validation helper
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/

// CEP validation helper  
const cepRegex = /^\d{5}-?\d{3}$/

// Phone validation helper
const phoneRegex = /^(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[0-9]{4}-?[0-9]{4}$/

// Clube creation/update schema
export const clubeSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo')
    .trim(),
  cnpj: z
    .string()
    .regex(cnpjRegex, 'CNPJ inválido (use formato XX.XXX.XXX/XXXX-XX ou XXXXXXXXXXXXXX)')
    .transform((val) => val.replace(/\D/g, '')), // Remove formatting
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  telefone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  endereco: z.object({
    logradouro: z.string().min(5, 'Logradouro muito curto').max(200, 'Logradouro muito longo'),
    numero: z.string().min(1, 'Número é obrigatório').max(20, 'Número muito longo'),
    complemento: z.string().max(100, 'Complemento muito longo').optional().or(z.literal('')),
    bairro: z.string().min(2, 'Bairro muito curto').max(100, 'Bairro muito longo'),
    cidade: z.string().min(2, 'Cidade muito curta').max(100, 'Cidade muito longa'),
    estado: z.string().length(2, 'Estado deve ter 2 caracteres').toUpperCase(),
    cep: z.string().regex(cepRegex, 'CEP inválido (use formato XXXXX-XXX)').transform((val) => val.replace('-', ''))
  }).optional(),
  configuracoes: z.object({
    permite_nao_associados: z.boolean().default(true),
    taxa_inscricao_evento: z.number().min(0, 'Taxa não pode ser negativa').optional(),
    limite_associados: z.number().int().min(1, 'Deve permitir pelo menos 1 associado').optional(),
    modalidades_ativas: z.array(z.enum(['pistola', 'carabina', 'skeet', 'trap', 'ipsc'])).default(['pistola'])
  }).optional(),
  ativo: z.boolean().default(true)
})

// Clube query filters
export const clubeQuerySchema = z.object({
  ativo: z.boolean().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2).optional(),
  modalidade: z.enum(['pistola', 'carabina', 'skeet', 'trap', 'ipsc']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().optional()
})

// Clube update schema (all fields optional)
export const clubeUpdateSchema = clubeSchema.partial()

// Clube activation/deactivation
export const clubeStatusSchema = z.object({
  ativo: z.boolean()
})

// Type exports
export type ClubeCreateRequest = z.infer<typeof clubeSchema>
export type ClubeUpdateRequest = z.infer<typeof clubeUpdateSchema>
export type ClubeQueryParams = z.infer<typeof clubeQuerySchema>
export type ClubeStatusRequest = z.infer<typeof clubeStatusSchema>