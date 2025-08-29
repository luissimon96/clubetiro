export default defineEventHandler(async (event) => {
  const eventoId = getRouterParam(event, 'id')
  const userId = getRouterParam(event, 'userId')
  
  if (!eventoId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do evento e ID do usuário são obrigatórios'
    })
  }

  try {
    // Get database connection
    const db = await getDatabaseConnection()
    
    // Check if participation exists
    const participantCheck = await db.query(
      'SELECT * FROM participantes WHERE evento_id = $1 AND user_id = $2',
      [eventoId, userId]
    )
    
    if (participantCheck.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Participação não encontrada'
      })
    }
    
    // Remove participant
    const deleteQuery = 'DELETE FROM participantes WHERE evento_id = $1 AND user_id = $2'
    await db.query(deleteQuery, [eventoId, userId])
    
    await db.end()
    
    return {
      message: 'Participante removido com sucesso',
      eventoId,
      userId
    }
    
  } catch (error: any) {
    console.error('Database error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})

async function getDatabaseConnection() {
  const { Client } = await import('pg')
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'clubetiro',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  })
  await client.connect()
  return client
}