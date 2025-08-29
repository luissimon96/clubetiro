export default defineEventHandler(async (event) => {
  const eventoId = getRouterParam(event, 'id')
  
  if (!eventoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID do evento é obrigatório'
    })
  }

  try {
    // Get database connection
    const db = await getDatabaseConnection()
    
    // Get participants with user data
    const query = `
      SELECT 
        p.evento_id,
        p.user_id as "userId",
        p.data_inscricao as "dataInscricao",
        u.id,
        u.nome,
        u.email,
        u.associado,
        u.telefone,
        u.status_associacao as "statusAssociacao"
      FROM participantes p
      JOIN users u ON p.user_id = u.id
      WHERE p.evento_id = $1
      ORDER BY p.data_inscricao DESC
    `
    
    const result = await db.query(query, [eventoId])
    
    // Transform data to include user object
    const participants = result.rows.map(row => ({
      eventoId: row.evento_id,
      userId: row.userId,
      dataInscricao: row.dataInscricao,
      user: {
        id: row.id,
        nome: row.nome,
        email: row.email,
        associado: row.associado,
        telefone: row.telefone,
        statusAssociacao: row.statusAssociacao
      }
    }))

    await db.end()
    return participants
    
  } catch (error) {
    console.error('Database error:', error)
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