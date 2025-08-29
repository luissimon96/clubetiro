// Club-aware events API with hierarchical access control
import { requireClubAccess, requirePermissions } from '~/server/utils/auth'
import type { AuthContext } from '~/models/auth'

export default defineEventHandler(async (event) => {
  // Require authentication and club access
  const user = await requireClubAccess(event)
  
  const method = getMethod(event)
  
  if (method === 'GET') {
    return await getEventos(event, user)
  } else if (method === 'POST') {
    // Only club admins can create events
    requirePermissions(user, ['gerenciarEventos'])
    return await createEvento(event, user)
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  })
})

async function getEventos(event: H3Event, user: AuthContext) {
  try {
    const query = getQuery(event)
    
    let sqlQuery = `
      SELECT 
        e.id,
        e.nome,
        e.descricao,
        e.data_evento as data,
        e.hora_inicio,
        e.hora_fim,
        e.local,
        e.max_participantes as maxParticipantes,
        e.valor_inscricao as valorInscricao,
        e.status,
        e.criado_por as criadoPor,
        e.clube_id as clubeId,
        e.created_at as dataCriacao,
        (SELECT COUNT(*) FROM participantes WHERE evento_id = e.id) as totalParticipantes
      FROM eventos e
    `
    
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    // Data isolation: system admins see all, club users see only their club's events
    if (user.userType === 'system_admin') {
      // System admin can see all events, optionally filter by club
      if (query.clubeId) {
        conditions.push(`e.clube_id = $${paramIndex++}`)
        params.push(query.clubeId)
      }
    } else {
      // Club users can only see their club's events
      conditions.push(`(e.clube_id = $${paramIndex++} OR e.clube_id IS NULL)`)
      params.push(user.clubeId)
    }
    
    // Additional filters
    if (query.status) {
      conditions.push(`e.status = $${paramIndex++}`)
      params.push(query.status)
    }
    
    if (query.dataInicio) {
      conditions.push(`e.data_evento >= $${paramIndex++}`)
      params.push(query.dataInicio)
    }
    
    if (query.dataFim) {
      conditions.push(`e.data_evento <= $${paramIndex++}`)
      params.push(query.dataFim)
    }
    
    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`
    }
    
    sqlQuery += ` ORDER BY e.data_evento DESC`
    
    const db = await getDatabaseConnection()
    try {
      const result = await db.query(sqlQuery, params)
      return {
        data: result.rows,
        total: result.rows.length
      }
    } finally {
      await db.end()
    }
    
  } catch (error) {
    console.error('Error fetching events:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar eventos'
    })
  }
}

async function createEvento(event: H3Event, user: AuthContext) {
  const body = await readBody(event)
  
  // Validation
  if (!body.nome || !body.data || !body.local) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome, data e local são obrigatórios'
    })
  }
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.data)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data deve estar no formato YYYY-MM-DD'
    })
  }
  
  try {
    const db = await getDatabaseConnection()
    
    try {
      const query = `
        INSERT INTO eventos (
          nome, descricao, data_evento, hora_inicio, hora_fim, local,
          max_participantes, valor_inscricao, status, criado_por, clube_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING 
          id,
          nome,
          descricao,
          data_evento as data,
          hora_inicio,
          hora_fim,
          local,
          max_participantes as maxParticipantes,
          valor_inscricao as valorInscricao,
          status,
          criado_por as criadoPor,
          clube_id as clubeId,
          created_at as dataCriacao
      `
      
      const values = [
        body.nome,
        body.descricao || null,
        body.data,
        body.horaInicio || null,
        body.horaFim || null,
        body.local,
        body.maxParticipantes || null,
        body.valorInscricao || 0,
        body.status || 'planejado',
        user.userId,
        user.userType === 'system_admin' ? body.clubeId || null : user.clubeId
      ]
      
      const result = await db.query(query, values)
      
      return {
        success: true,
        data: result.rows[0],
        message: 'Evento criado com sucesso'
      }
      
    } finally {
      await db.end()
    }
    
  } catch (error: any) {
    console.error('Error creating event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar evento'
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
