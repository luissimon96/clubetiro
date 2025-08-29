// System Admin API for club management
import type { Clube, CreateClubeRequest, UpdateClubeRequest, ClubeListFilter } from '~/models/clube'
import { validateCNPJ, formatCNPJ, validateCEP } from '~/models/clube'
import { requireSystemAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Ensure only system admins can access
  const user = await requireSystemAdmin(event)
  
  const method = getMethod(event)
  
  if (method === 'GET') {
    return await getClubes(event)
  } else if (method === 'POST') {
    return await createClube(event)
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  })
})

async function getClubes(event: H3Event) {
  const query = getQuery(event) as ClubeListFilter
  
  // Build WHERE clause based on filters
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1
  
  if (query.ativo !== undefined) {
    conditions.push(`ativo = $${paramIndex++}`)
    params.push(query.ativo)
  }
  
  if (query.status) {
    conditions.push(`licenca->>'status' = $${paramIndex++}`)
    params.push(query.status)
  }
  
  if (query.plano) {
    conditions.push(`licenca->>'plano' = $${paramIndex++}`)
    params.push(query.plano)
  }
  
  if (query.search) {
    conditions.push(`(
      nome ILIKE $${paramIndex} OR 
      cnpj ILIKE $${paramIndex} OR 
      cr ILIKE $${paramIndex}
    )`)
    params.push(`%${query.search}%`)
    paramIndex++
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  
  // Pagination
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, parseInt(query.limit as string) || 20)
  const offset = (page - 1) * limit
  
  try {
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM clubes ${whereClause}
    `
    const countResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: countQuery, params }
    }) as { rows: [{ total: string }] }
    
    const total = parseInt(countResult.rows[0].total)
    
    // Get paginated results
    const dataQuery = `
      SELECT 
        id,
        nome,
        cnpj,
        cr,
        endereco,
        contato,
        licenca,
        stripe_customer_id,
        created_at as "dataCadastro",
        updated_at as "dataAtualizacao",
        ativo
      FROM clubes 
      ${whereClause}
      ORDER BY nome ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    
    const dataResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { 
        query: dataQuery, 
        params: [...params, limit, offset] 
      }
    }) as { rows: any[] }
    
    const clubes = dataResult.rows.map(formatClubeFromDb)
    
    return {
      data: clubes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
    
  } catch (error) {
    console.error('Error fetching clubs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar clubes'
    })
  }
}

async function createClube(event: H3Event) {
  const body = await readBody(event) as CreateClubeRequest
  
  // Validate required fields
  if (!body.nome || !body.cnpj || !body.cr || !body.endereco || !body.contato || !body.licenca) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todos os campos obrigatórios devem ser preenchidos'
    })
  }
  
  // Validate CNPJ format
  if (!validateCNPJ(body.cnpj)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CNPJ inválido'
    })
  }
  
  // Validate CEP format
  if (!validateCEP(body.endereco.cep)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CEP inválido'
    })
  }
  
  try {
    const licenca = {
      ...body.licenca,
      status: 'pendente' as const
    }
    
    const query = `
      INSERT INTO clubes (
        nome, cnpj, cr, endereco, contato, licenca
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        nome,
        cnpj,
        cr,
        endereco,
        contato,
        licenca,
        stripe_customer_id,
        created_at as "dataCadastro",
        updated_at as "dataAtualizacao",
        ativo
    `
    
    const result = await $fetch('/api/db/query', {
      method: 'POST',
      body: {
        query,
        params: [
          body.nome,
          formatCNPJ(body.cnpj),
          body.cr,
          JSON.stringify(body.endereco),
          JSON.stringify(body.contato),
          JSON.stringify(licenca)
        ]
      }
    }) as { rows: any[] }
    
    const clube = formatClubeFromDb(result.rows[0])
    
    return {
      success: true,
      data: clube,
      message: 'Clube criado com sucesso'
    }
    
  } catch (error: any) {
    console.error('Error creating club:', error)
    
    if (error.code === '23505') { // Unique constraint violation
      throw createError({
        statusCode: 400,
        statusMessage: 'CNPJ já cadastrado'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar clube'
    })
  }
}

// Helper function to format database result to Clube interface
function formatClubeFromDb(row: any): Clube {
  return {
    id: row.id,
    nome: row.nome,
    cnpj: row.cnpj,
    cr: row.cr,
    endereco: row.endereco,
    contato: row.contato,
    licenca: row.licenca,
    stripeCustomerId: row.stripe_customer_id,
    dataCadastro: row.dataCadastro,
    dataAtualizacao: row.dataAtualizacao,
    ativo: row.ativo
  }
}