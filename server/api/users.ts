// Club-aware users API with hierarchical access control
import type { User } from '../../models/user'
import type { CreateUserRequest, AuthContext } from '../../models/auth'
import { requireClubAccess, requirePermissions, hashPassword } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Require authentication and club access
  const user = await requireClubAccess(event)
  
  const method = getMethod(event)
  
  if (method === 'GET') {
    return await getUsers(event, user)
  } else if (method === 'POST') {
    // Only club admins with permission can create users
    if (user.userType === 'club_admin') {
      requirePermissions(user, ['gerenciarMembros'])
    }
    return await createUser(event, user)
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  })
})

async function getUsers(event: H3Event, user: AuthContext): Promise<Omit<User, 'senha'>[]> {
  try {
    const query = getQuery(event)
    
    let sqlQuery = `
      SELECT 
        u.id, u.nome, u.email, u.tipo, 
        u.data_cadastro as "dataCadastro", 
        u.ultimo_login as "ultimoLogin", 
        u.ativo,
        u.clube_id as "clubeId",
        u.numero_registro as "numeroRegistro",
        u.permissoes,
        u.associado, 
        u.telefone, 
        u.data_associacao as "dataAssociacao", 
        u.status_associacao as "statusAssociacao",
        c.nome as "clubeNome"
      FROM users u
      LEFT JOIN clubes c ON u.clube_id = c.id
      WHERE u.ativo = true
    `
    
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    // Data isolation: system admins see all, club users see only their club's users
    if (user.userType === 'system_admin') {
      // System admin can see all users, optionally filter by club
      if (query.clubeId) {
        conditions.push(`u.clube_id = $${paramIndex++}`)
        params.push(query.clubeId)
      }
    } else {
      // Club users can only see users from their club
      conditions.push(`u.clube_id = $${paramIndex++}`)
      params.push(user.clubeId)
    }
    
    // Additional filters
    if (query.tipo) {
      conditions.push(`u.tipo = $${paramIndex++}`)
      params.push(query.tipo)
    }
    
    if (query.associado !== undefined) {
      conditions.push(`u.associado = $${paramIndex++}`)
      params.push(query.associado === 'true')
    }
    
    if (query.statusAssociacao) {
      conditions.push(`u.status_associacao = $${paramIndex++}`)
      params.push(query.statusAssociacao)
    }
    
    if (conditions.length > 0) {
      sqlQuery += ` AND ${conditions.join(' AND ')}`
    }
    
    sqlQuery += ` ORDER BY u.nome ASC`
    
    const db = await getDatabaseConnection()
    try {
      const result = await db.query(sqlQuery, params)
      return result.rows.map(row => ({
        ...row,
        senha: '', // Never return password
        associado: row.associado || false,
        statusAssociacao: row.statusAssociacao || 'ativo',
        clube: row.clubeNome ? { nome: row.clubeNome } : undefined
      }))
    } finally {
      await db.end()
    }
    
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar usuários'
    })
  }
}

async function createUser(event: H3Event, currentUser: AuthContext): Promise<Omit<User, 'senha'>> {
  const userData = await readBody(event) as CreateUserRequest
  
  // Validation
  if (!userData.nome || !userData.email || !userData.senha) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome, email e senha são obrigatórios'
    })
  }
  
  // Validate user type based on current user's permissions
  if (currentUser.userType === 'club_admin') {
    // Club admins can only create club_member users
    if (userData.tipo && userData.tipo !== 'club_member') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Administradores de clube só podem criar membros'
      })
    }
    userData.tipo = 'club_member'
    userData.clubeId = currentUser.clubeId // Force same club
  } else if (currentUser.userType === 'system_admin') {
    // System admin can create any type of user
    if (userData.tipo && ['club_admin', 'club_member'].includes(userData.tipo) && !userData.clubeId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuários de clube devem ter um clube vinculado'
      })
    }
  }
  
  try {
    const db = await getDatabaseConnection()
    
    try {
      // Hash password
      const hashedPassword = await hashPassword(userData.senha)
      
      // Set default permissions for club admin
      const permissoes = userData.tipo === 'club_admin' 
        ? userData.permissoes || {
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
          associado, telefone, data_associacao, status_associacao
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING 
          id, nome, email, tipo, 
          data_cadastro as "dataCadastro", 
          clube_id as "clubeId",
          numero_registro as "numeroRegistro",
          permissoes,
          associado, telefone, 
          data_associacao as "dataAssociacao", 
          status_associacao as "statusAssociacao",
          ativo
      `
      
      const values = [
        userData.nome,
        userData.email.toLowerCase(),
        hashedPassword,
        userData.tipo || 'club_member',
        userData.clubeId || null,
        userData.numeroRegistro || null,
        permissoes ? JSON.stringify(permissoes) : null,
        userData.associado || false,
        userData.telefone || null,
        userData.dataAssociacao || null,
        userData.statusAssociacao || 'ativo'
      ]
      
      const result = await db.query(query, values)
      
      return {
        ...result.rows[0],
        senha: '', // Never return password
        associado: result.rows[0].associado || false,
        statusAssociacao: result.rows[0].statusAssociacao || 'ativo'
      }
      
    } finally {
      await db.end()
    }
    
  } catch (error: any) {
    console.error('Error creating user:', error)
    
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

async function getDatabaseConnection() {
  const { Client } = await import('pg')
  const client = new Client({
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'clube_tiro_db',
    user: process.env.DB_USER || 'clube_tiro_user',
    password: process.env.DB_PASSWORD || 'clube_tiro_pass'
  })
  await client.connect()
  return client
}