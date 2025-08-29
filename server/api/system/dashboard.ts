// System Admin Dashboard API
import type { ClubeStats } from '~/models/clube'

export default defineEventHandler(async (event) => {
  // Ensure only system admins can access
  const user = await requireSystemAdmin(event)
  
  try {
    // Get comprehensive system statistics
    const statsQuery = `
      SELECT 
        -- Club statistics
        (SELECT COUNT(*) FROM clubes WHERE ativo = true) as clubes_ativos,
        (SELECT COUNT(*) FROM clubes WHERE ativo = false) as clubes_inativos,
        (SELECT COUNT(*) FROM clubes WHERE licenca->>'status' = 'ativa') as licencas_ativas,
        (SELECT COUNT(*) FROM clubes WHERE licenca->>'status' = 'suspensa') as licencas_suspensas,
        (SELECT COUNT(*) FROM clubes WHERE licenca->>'status' = 'pendente') as licencas_pendentes,
        
        -- User statistics
        (SELECT COUNT(*) FROM users WHERE tipo = 'club_admin' AND ativo = true) as club_admins,
        (SELECT COUNT(*) FROM users WHERE tipo = 'club_member' AND ativo = true) as club_members,
        (SELECT COUNT(*) FROM users WHERE ativo = true) as total_users,
        
        -- Event statistics
        (SELECT COUNT(*) FROM eventos) as total_events,
        (SELECT COUNT(*) FROM eventos WHERE data_evento >= CURRENT_DATE - INTERVAL '30 days') as events_last_30_days,
        (SELECT COUNT(*) FROM participantes) as total_participations,
        
        -- Financial statistics
        (SELECT COALESCE(SUM((licenca->>'valorMensal')::decimal), 0) FROM clubes WHERE licenca->>'status' = 'ativa') as receita_mensal_total,
        (SELECT COUNT(*) FROM clube_licencas WHERE data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND status = 'pendente') as licencas_vencendo_30_dias,
        (SELECT COALESCE(SUM(valor), 0) FROM clube_licencas WHERE status = 'pago' AND EXTRACT(MONTH FROM data_pagamento) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM data_pagamento) = EXTRACT(YEAR FROM CURRENT_DATE)) as receita_mes_atual
    `
    
    const statsResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: statsQuery, params: [] }
    }) as { rows: any[] }
    
    const stats = statsResult.rows[0]
    
    // Get recent clubs
    const recentClubesQuery = `
      SELECT 
        id,
        nome,
        cnpj,
        licenca->>'status' as licenca_status,
        licenca->>'plano' as plano,
        created_at as "dataCadastro"
      FROM clubes 
      ORDER BY created_at DESC 
      LIMIT 10
    `
    
    const recentClubesResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: recentClubesQuery, params: [] }
    }) as { rows: any[] }
    
    // Get clubs by plan distribution
    const planoDistributionQuery = `
      SELECT 
        licenca->>'plano' as plano,
        COUNT(*) as count
      FROM clubes 
      WHERE ativo = true
      GROUP BY licenca->>'plano'
    `
    
    const planoDistributionResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: planoDistributionQuery, params: [] }
    }) as { rows: any[] }
    
    // Get monthly revenue trend (last 6 months)
    const revenueTrendQuery = `
      SELECT 
        TO_CHAR(data_pagamento, 'YYYY-MM') as mes,
        SUM(valor) as receita
      FROM clube_licencas 
      WHERE status = 'pago' 
        AND data_pagamento >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(data_pagamento, 'YYYY-MM')
      ORDER BY mes ASC
    `
    
    const revenueTrendResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: revenueTrendQuery, params: [] }
    }) as { rows: any[] }
    
    // Get clubs with overdue licenses
    const overdueQuery = `
      SELECT 
        c.id,
        c.nome,
        c.cnpj,
        c.licenca->>'dataVencimento' as data_vencimento,
        c.contato->>'email' as email_contato
      FROM clubes c
      WHERE (c.licenca->>'dataVencimento')::date < CURRENT_DATE
        AND c.licenca->>'status' IN ('ativa', 'pendente')
      ORDER BY (c.licenca->>'dataVencimento')::date ASC
      LIMIT 20
    `
    
    const overdueResult = await $fetch('/api/db/query', {
      method: 'POST',
      body: { query: overdueQuery, params: [] }
    }) as { rows: any[] }
    
    return {
      stats: {
        clubes: {
          total: parseInt(stats.clubes_ativos) + parseInt(stats.clubes_inativos),
          ativos: parseInt(stats.clubes_ativos),
          inativos: parseInt(stats.clubes_inativos)
        },
        licencas: {
          ativas: parseInt(stats.licencas_ativas),
          suspensas: parseInt(stats.licencas_suspensas),
          pendentes: parseInt(stats.licencas_pendentes),
          vencendoEm30Dias: parseInt(stats.licencas_vencendo_30_dias)
        },
        usuarios: {
          clubAdmins: parseInt(stats.club_admins),
          clubMembers: parseInt(stats.club_members),
          total: parseInt(stats.total_users)
        },
        eventos: {
          total: parseInt(stats.total_events),
          ultimos30Dias: parseInt(stats.events_last_30_days),
          totalParticipacoes: parseInt(stats.total_participations)
        },
        financeiro: {
          receitaMensalTotal: parseFloat(stats.receita_mensal_total),
          receitaMesAtual: parseFloat(stats.receita_mes_atual),
          licencasVencendoEm30Dias: parseInt(stats.licencas_vencendo_30_dias)
        }
      },
      recentClubes: recentClubesResult.rows,
      planoDistribution: planoDistributionResult.rows.reduce((acc, row) => {
        acc[row.plano] = parseInt(row.count)
        return acc
      }, {} as Record<string, number>),
      revenueTrend: revenueTrendResult.rows.map(row => ({
        mes: row.mes,
        receita: parseFloat(row.receita)
      })),
      clubesComLicencaVencida: overdueResult.rows
    }
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar estatísticas do sistema'
    })
  }
})