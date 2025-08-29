// System Admin API for managing club users
import type { User, ClubAdmin, ClubMember } from '~/models/user'
import type { CreateUserRequest } from '~/models/auth'

export default defineEventHandler(async (event) => {
  // Ensure only system admins can access
  const user = await requireSystemAdmin(event)
  
  const clubeId = getRouterParam(event, 'id')
  if (!clubeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do clube é obrigatório'
    })
  }
  
  const method = getMethod(event)
  
  if (method === 'GET') {
    return await getClubeUsers(event, clubeId)
  } else if (method === 'POST') {
    return await createClubeUser(event, clubeId)
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  })
})

async function getClubeUsers(event: H3Event, clubeId: string) {
  const query = getQuery(event)
  const tipo = query.tipo as string
  
  try {
    // Verify club exists
    const clubQuery = `SELECT id FROM clubes WHERE id = $1`
    const clubResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: clubQuery, params: [clubeId] }
    }) as { rows: any[] }
    
    if (clubResult.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Clube não encontrado'
      })
    }
    
    // Build query with optional type filter
    let userQuery = `
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.tipo,
        u.clube_id as "clubeId",
        u.numero_registro as "numeroRegistro",
        u.permissoes,
        u.associado,
        u.telefone,
        u.data_associacao as "dataAssociacao",
        u.status_associacao as "statusAssociacao",
        u.data_cadastro as "dataCadastro",
        u.ultimo_login as "ultimoLogin",
        u.ativo
      FROM users u
      WHERE u.clube_id = $1
    `
    
    const params = [clubeId]
    
    if (tipo && ['club_admin', 'club_member'].includes(tipo)) {
      userQuery += ` AND u.tipo = $2`
      params.push(tipo)
    }
    
    userQuery += ` ORDER BY u.nome ASC`
    
    const result = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: userQuery, params }
    }) as { rows: any[] }
    
    const users = result.rows.map(formatUserFromDb)
    
    // Get user statistics
    const statsQuery = `
      SELECT 
        tipo,
        COUNT(*) as count
      FROM users 
      WHERE clube_id = $1 AND ativo = true
      GROUP BY tipo
    `
    
    const statsResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: statsQuery, params: [clubeId] }
    }) as { rows: any[] }
    
    const stats = statsResult.rows.reduce((acc, row) => {
      acc[row.tipo] = parseInt(row.count)
      return acc
    }, {} as Record<string, number>)
    
    return {
      data: users,
      stats: {
        club_admin: stats.club_admin || 0,
        club_member: stats.club_member || 0,
        total: users.length
      }
    }
    
  } catch (error) {
    console.error('Error fetching club users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar usuários do clube'
    })
  }
}

async function createClubeUser(event: H3Event, clubeId: string) {
  const body = await readBody(event) as CreateUserRequest & { clubeId: string }
  
  // Validate required fields
  if (!body.nome || !body.email || !body.senha || !body.tipo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome, email, senha e tipo são obrigatórios'
    })
  }
  
  // Validate user type for club users
  if (!['club_admin', 'club_member'].includes(body.tipo)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tipo de usuário deve ser club_admin ou club_member'
    })
  }
  
  // Verify club exists
  const clubQuery = `SELECT id FROM clubes WHERE id = $1 AND ativo = true`
  const clubResult = await $fetch('/api/db/query', {
    method: 'POST',
    body: { query: clubQuery, params: [clubeId] }
  }) as { rows: any[] }
  
  if (clubResult.rows.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Clube não encontrado ou inativo'
    })
  }
  
  try {
    // Hash password
    const hashedPassword = await hashPassword(body.senha)
    
    // Set default permissions for club admin
    const permissoes = body.tipo === 'club_admin' 
      ? body.permissoes || {
          gerenciarEventos: true,
          gerenciarMembros: true,
          gerenciarResultados: true,
          visualizarRelatorios: true,
          gerenciarPagamentos: false
        }
      : null
    
    const query = `
      INSERT INTO users (
        nome, email, senha_hash, tipo, clube_id, numero_registro, permissoes,
        telefone, associado, status_associacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id,
        nome,
        email,
        tipo,
        clube_id as "clubeId",
        numero_registro as "numeroRegistro",
        permissoes,
        associado,
        telefone,
        data_associacao as "dataAssociacao",
        status_associacao as "statusAssociacao",
        data_cadastro as "dataCadastro",
        ultimo_login as "ultimoLogin",
        ativo
    `
    
    const result = await $fetch('/api/db/query', {
      method: 'POST',
      body: {
        query,
        params: [
          body.nome,
          body.email.toLowerCase(),
          hashedPassword,
          body.tipo,
          clubeId,
          body.numeroRegistro || null,
          permissoes ? JSON.stringify(permissoes) : null,
          body.telefone || null,
          body.associado || false,
          body.statusAssociacao || 'ativo'
        ]
      }
    }) as { rows: any[] }
    
    const newUser = formatUserFromDb(result.rows[0])
    
    return {
      success: true,
      data: newUser,
      message: 'Usuário criado com sucesso'
    }
    
  } catch (error: any) {
    console.error('Error creating club user:', error)
    
    if (error.code === '23505') { // Unique constraint violation
      throw createError({
        statusCode: 400,
        statusMessage: 'Email já cadastrado'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar usuário'
    })
  }
}

// Helper function to format database result to User interface
function formatUserFromDb(row: any): User {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    senha: '', // Never return password hash
    tipo: row.tipo,
    dataCadastro: row.dataCadastro,
    ultimoLogin: row.ultimoLogin,
    ativo: row.ativo,
    clubeId: row.clubeId,
    numeroRegistro: row.numeroRegistro,
    permissoes: row.permissoes,
    associado: row.associado,
    telefone: row.telefone,
    dataAssociacao: row.dataAssociacao,
    statusAssociacao: row.statusAssociacao
  }
}