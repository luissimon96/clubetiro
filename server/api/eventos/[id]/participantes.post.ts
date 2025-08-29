export default defineEventHandler(async (event) => {
  const eventoId = getRouterParam(event, 'id')
  
  if (!eventoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do evento é obrigatório'
    })
  }

  const body = await readBody(event)
  
  if (!body.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do usuário é obrigatório'
    })
  }

  try {
    // Get database connection
    const db = await getDatabaseConnection()
    
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [body.userId])
    if (userCheck.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Usuário não encontrado'
      })
    }
    
    // Check if event exists
    const eventCheck = await db.query('SELECT id FROM eventos WHERE id = $1', [eventoId])
    if (eventCheck.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Evento não encontrado'
      })
    }
    
    // Check if user is already registered for this event
    const participantCheck = await db.query(
      'SELECT * FROM participantes WHERE evento_id = $1 AND user_id = $2',
      [eventoId, body.userId]
    )
    
    if (participantCheck.rows.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Usuário já está inscrito neste evento'
      })
    }
    
    // Add participant
    const insertQuery = `
      INSERT INTO participantes (evento_id, user_id, data_inscricao)
      VALUES ($1, $2, NOW())
    `
    
    await db.query(insertQuery, [eventoId, body.userId])
    
    await db.end()
    
    return {
      message: 'Participante adicionado com sucesso',
      eventoId,
      userId: body.userId
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