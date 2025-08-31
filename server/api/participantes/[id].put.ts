// Update participant endpoint
import { requireClubAccess, requirePermissions } from '~/server/utils/auth'
import { validateBody, validateParams } from '~/utils/validation'
import { z } from 'zod'

const ParamsSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido')
})

const UpdateSchema = z.object({
  status: z.enum(['inscrito', 'presente', 'ausente', 'cancelado']).optional(),
  valorPago: z.number().min(0, 'Valor pago deve ser positivo').optional(),
  dataPagamento: z.string().datetime().optional(),
  observacoes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  // Require authentication and permissions
  const user = await requireClubAccess(event)
  requirePermissions(user, ['gerenciarEventos'])
  
  const params = validateParams(event, ParamsSchema)
  const body = await validateBody(event, UpdateSchema)
  
  try {
    const db = await getDatabaseConnection()
    
    try {
      // First verify that the participant exists and user has access to it
      const checkQuery = `
        SELECT p.id, p.evento_id, p.user_id, e.clube_id
        FROM participantes p
        INNER JOIN eventos e ON p.evento_id = e.id
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
      
      // Build update query dynamically
      const updateFields: string[] = []
      const updateValues: any[] = []
      let paramIndex = 1
      
      if (body.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`)
        updateValues.push(body.status)
      }
      
      if (body.valorPago !== undefined) {
        updateFields.push(`valor_pago = $${paramIndex++}`)
        updateValues.push(body.valorPago)
      }
      
      if (body.dataPagamento !== undefined) {
        updateFields.push(`data_pagamento = $${paramIndex++}`)
        updateValues.push(body.dataPagamento)
      }
      
      if (body.observacoes !== undefined) {
        updateFields.push(`observacoes = $${paramIndex++}`)
        updateValues.push(body.observacoes)
      }
      
      if (updateFields.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Nenhum campo fornecido para atualização'
        })
      }
      
      // Add updated_at field
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      
      // Add participant ID to params
      updateValues.push(params.id)
      
      const updateQuery = `
        UPDATE participantes 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id,
          evento_id as eventoId,
          user_id as userId,
          data_inscricao as dataInscricao,
          status,
          valor_pago as valorPago,
          data_pagamento as dataPagamento,
          observacoes,
          updated_at as dataAtualizacao
      `
      
      const result = await db.query(updateQuery, updateValues)
      
      return {
        success: true,
        data: result.rows[0],
        message: 'Participante atualizado com sucesso'
      }
      
    } finally {
      await db.end()
    }
    
  } catch (error: any) {
    console.error('Error updating participant:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao atualizar participante'
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