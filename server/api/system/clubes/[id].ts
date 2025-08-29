// System Admin API for individual club management
import type { Clube, UpdateClubeRequest } from '~/models/clube'

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
    return await getClube(event, clubeId)
  } else if (method === 'PUT') {
    return await updateClube(event, clubeId)
  } else if (method === 'DELETE') {
    return await deleteClube(event, clubeId)
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  })
})

async function getClube(event: H3Event, clubeId: string) {
  try {
    const query = `
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
      WHERE id = $1
    `
    
    const result = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query, params: [clubeId] }
    }) as { rows: any[] }
    
    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Clube não encontrado'
      })
    }
    
    const clube = formatClubeFromDb(result.rows[0])
    
    // Get additional statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE clube_id = $1 AND tipo = 'club_admin') as club_admins,
        (SELECT COUNT(*) FROM users WHERE clube_id = $1 AND tipo = 'club_member') as club_members,
        (SELECT COUNT(*) FROM eventos WHERE clube_id = $1) as total_events,
        (SELECT SUM(valor) FROM clube_licencas WHERE clube_id = $1 AND status = 'pago') as total_paid
    `
    
    const statsResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: statsQuery, params: [clubeId] }
    }) as { rows: any[] }
    
    const stats = statsResult.rows[0]
    
    return {
      data: clube,
      stats: {
        clubAdmins: parseInt(stats.club_admins) || 0,
        clubMembers: parseInt(stats.club_members) || 0,
        totalEvents: parseInt(stats.total_events) || 0,
        totalPaid: parseFloat(stats.total_paid) || 0
      }
    }
    
  } catch (error) {
    console.error('Error fetching club:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar clube'
    })
  }
}

async function updateClube(event: H3Event, clubeId: string) {
  const body = await readBody(event) as UpdateClubeRequest
  
  // Build dynamic update query
  const updateFields: string[] = []
  const params: any[] = []
  let paramIndex = 1
  
  if (body.nome !== undefined) {
    updateFields.push(`nome = $${paramIndex++}`)
    params.push(body.nome)
  }
  
  if (body.cnpj !== undefined) {
    if (!validateCNPJ(body.cnpj)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'CNPJ inválido'
      })
    }
    updateFields.push(`cnpj = $${paramIndex++}`)
    params.push(formatCNPJ(body.cnpj))
  }
  
  if (body.cr !== undefined) {
    updateFields.push(`cr = $${paramIndex++}`)
    params.push(body.cr)
  }
  
  if (body.endereco !== undefined) {
    if (!validateCEP(body.endereco.cep)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'CEP inválido'
      })
    }
    updateFields.push(`endereco = $${paramIndex++}`)
    params.push(JSON.stringify(body.endereco))
  }
  
  if (body.contato !== undefined) {
    updateFields.push(`contato = $${paramIndex++}`)
    params.push(JSON.stringify(body.contato))
  }
  
  if (body.licenca !== undefined) {
    updateFields.push(`licenca = $${paramIndex++}`)
    params.push(JSON.stringify(body.licenca))
  }
  
  if (body.ativo !== undefined) {
    updateFields.push(`ativo = $${paramIndex++}`)
    params.push(body.ativo)
  }
  
  if (updateFields.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nenhum campo para atualizar'
    })
  }
  
  // Add club ID as last parameter
  params.push(clubeId)
  
  try {
    const query = `
      UPDATE clubes 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
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
      body: { query, params }
    }) as { rows: any[] }
    
    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Clube não encontrado'
      })
    }
    
    const clube = formatClubeFromDb(result.rows[0])
    
    return {
      success: true,
      data: clube,
      message: 'Clube atualizado com sucesso'
    }
    
  } catch (error: any) {
    console.error('Error updating club:', error)
    
    if (error.code === '23505') { // Unique constraint violation
      throw createError({
        statusCode: 400,
        statusMessage: 'CNPJ já cadastrado'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao atualizar clube'
    })
  }
}

async function deleteClube(event: H3Event, clubeId: string) {
  try {
    // Check if club has users or events
    const checkQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE clube_id = $1) as user_count,
        (SELECT COUNT(*) FROM eventos WHERE clube_id = $1) as event_count
    `
    
    const checkResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: checkQuery, params: [clubeId] }
    }) as { rows: any[] }
    
    const { user_count, event_count } = checkResult.rows[0]
    
    if (parseInt(user_count) > 0 || parseInt(event_count) > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Não é possível excluir clube com usuários ou eventos associados'
      })
    }
    
    // Delete club
    const deleteQuery = `
      DELETE FROM clubes WHERE id = $1
      RETURNING nome
    `
    
    const result = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: deleteQuery, params: [clubeId] }
    }) as { rows: any[] }
    
    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Clube não encontrado'
      })
    }
    
    return {
      success: true,
      message: `Clube "${result.rows[0].nome}" excluído com sucesso`
    }
    
  } catch (error) {
    console.error('Error deleting club:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao excluir clube'
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