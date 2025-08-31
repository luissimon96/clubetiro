// Delete participant endpoint
import { requireClubAccess, requirePermissions } from '~/server/utils/auth'
import { validateParams } from '~/utils/validation'
import { z } from 'zod'

const ParamsSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
})

export default defineEventHandler(async (event) => {
  // Require authentication and permissions
  const user = await requireClubAccess(event)
  requirePermissions(user, ['gerenciarEventos'])
  
  const params = validateParams(event, ParamsSchema)
  
  try {
    const db = await getDatabaseConnection()
    
    try {
      // First verify that the participant exists and user has access to it
      const checkQuery = `
        SELECT 
          p.id, 
          p.evento_id, 
          p.user_id, 
          e.clube_id,
          e.nome as evento_nome,
          u.nome as user_nome
        FROM participantes p
        INNER JOIN eventos e ON p.evento_id = e.id
        INNER JOIN users u ON p.user_id = u.id
        WHERE p.id = $1 
        ${user.userType !== 'system_admin' ? 'AND (e.clube_id = $2 OR e.clube_id IS NULL)' : ''}
      `
      const checkParams = user.userType !== 'system_admin'
        ? [params.id, user.clubeId]
        : [params.id]
        
      const checkResult = await db.query(checkQuery, checkParams)
      if (checkResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Participante não encontrado'
        })
      }
      
      const participant = checkResult.rows[0]
      
      // Delete the participant
      const deleteQuery = 'DELETE FROM participantes WHERE id = $1 RETURNING id'
      const deleteResult = await db.query(deleteQuery, [params.id])
      
      if (deleteResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Participante não encontrado'
        })
      }
      
      return {
        success: true,
        data: {
          id: participant.id,
          eventoNome: participant.evento_nome,
          participanteNome: participant.user_nome
        },
        message: 'Participante removido com sucesso'
      }
      
    } finally {
      await db.end()
    }
    
  } catch (error: any) {
    console.error('Error deleting participant:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao remover participante'
    })
  }
})

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