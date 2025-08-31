// Club-aware participants API with hierarchical access control
import { requireClubAccess, requirePermissions } from '~/server/utils/auth'
import type { AuthContext } from '~/models/auth'
import { validateBody, validateQuery } from '~/utils/validation'
import { z } from 'zod'

// Validation schemas
const ParticipanteCreateSchema = z.object({
  eventoId: z.string().uuid('ID do evento deve ser um UUID válido'),
  userId: z.string().uuid('ID do usuário deve ser um UUID válido'),
  status: z.enum(['inscrito', 'presente', 'ausente', 'cancelado']).optional(),
  valorPago: z.number().min(0, 'Valor pago deve ser positivo').optional(),
  observacoes: z.string().optional()
})

const ParticipanteQuerySchema = z.object({
  eventoId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(['inscrito', 'presente', 'ausente', 'cancelado']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  clubeId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  // Require authentication and club access
  const user = await requireClubAccess(event)
  
  const method = getMethod(event)
  
  if (method === 'GET') {
    return await getParticipantes(event, user)
  } else if (method === 'POST') {
    // Only club admins can manage participants
    requirePermissions(user, ['gerenciarEventos'])
    return await createParticipante(event, user)
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  })
})

async function getParticipantes(event: H3Event, user: AuthContext) {
  try {
    const query = await validateQuery(event, ParticipanteQuerySchema)
    
    let sqlQuery = `
      SELECT 
        p.id,
        p.evento_id as eventoId,
        p.user_id as userId,
        p.data_inscricao as dataInscricao,
        p.status,
        p.valor_pago as valorPago,
        p.data_pagamento as dataPagamento,
        p.observacoes,
        p.created_at as dataCriacao,
        e.nome as eventoNome,
        e.data_evento as eventoData,
        e.clube_id as eventoClube,
        u.nome as participanteNome,
        u.email as participanteEmail,
        u.telefone as participanteTelefone
      FROM participantes p
      INNER JOIN eventos e ON p.evento_id = e.id
      INNER JOIN users u ON p.user_id = u.id
    `
    
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    // Data isolation: system admins see all, club users see only their club's participants
    if (user.userType === 'system_admin') {
      // System admin can see all participants, optionally filter by club
      if (query.clubeId) {
        conditions.push(`e.clube_id = $${paramIndex++}`)
        params.push(query.clubeId)
      }
    } else {
      // Club users can only see their club's participants
      conditions.push(`(e.clube_id = $${paramIndex++} OR e.clube_id IS NULL)`)
      params.push(user.clubeId)
    }
    
    // Additional filters
    if (query.eventoId) {
      conditions.push(`p.evento_id = $${paramIndex++}`)
      params.push(query.eventoId)
    }
    
    if (query.userId) {
      conditions.push(`p.user_id = $${paramIndex++}`)
      params.push(query.userId)
    }
    
    if (query.status) {
      conditions.push(`p.status = $${paramIndex++}`)
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
    
    sqlQuery += ` ORDER BY e.data_evento DESC, u.nome ASC`
    
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
    console.error('Error fetching participants:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar participantes'
    })
  }
}

async function createParticipante(event: H3Event, user: AuthContext) {
  const body = await validateBody(event, ParticipanteCreateSchema)
  
  try {
    const db = await getDatabaseConnection()
    
    try {
      // First verify that the event exists and user has access to it
      const eventCheckQuery = `
        SELECT id, clube_id FROM eventos 
        WHERE id = $1 
        ${user.userType !== 'system_admin' ? 'AND (clube_id = $2 OR clube_id IS NULL)' : ''}
      `
      const eventCheckParams = user.userType !== 'system_admin' 
        ? [body.eventoId, user.clubeId]
        : [body.eventoId]
        
      const eventResult = await db.query(eventCheckQuery, eventCheckParams)
      if (eventResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Evento não encontrado'
        })
      }
      
      // Check if user exists and has access
      const userCheckQuery = `
        SELECT id, nome FROM users 
        WHERE id = $1 
        ${user.userType !== 'system_admin' ? 'AND (clube_id = $2 OR clube_id IS NULL)' : ''}
      `
      const userCheckParams = user.userType !== 'system_admin'
        ? [body.userId, user.clubeId]
        : [body.userId]
        
      const userResult = await db.query(userCheckQuery, userCheckParams)
      if (userResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Usuário não encontrado'
        })
      }
      
      // Create participant (will fail if already exists due to unique constraint)
      const insertQuery = `
        INSERT INTO participantes (
          evento_id, user_id, status, valor_pago, observacoes
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING 
          id,
          evento_id as eventoId,
          user_id as userId,
          data_inscricao as dataInscricao,
          status,
          valor_pago as valorPago,
          observacoes,
          created_at as dataCriacao
      `
      
      const values = [
        body.eventoId,
        body.userId,
        body.status || 'inscrito',
        body.valorPago || 0,
        body.observacoes || null
      ]
      
      const result = await db.query(insertQuery, values)
      
      return {
        success: true,
        data: result.rows[0],
        message: 'Participante inscrito com sucesso'
      }
      
    } finally {
      await db.end()
    }
    
  } catch (error: any) {
    console.error('Error creating participant:', error)
    
    // Handle unique constraint violation (participant already exists)
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Participante já inscrito neste evento'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao inscrever participante'
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