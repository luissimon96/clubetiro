import { Mensalidade } from '../../models/mensalidade';

let mensalidades: Mensalidade[] = [
  {
    id: '1',
    participanteId: '1',
    tipoPlano: 'mensal',
    valor: 150,
    dataInicio: '2025-08-01',
    dataFim: '2025-08-31',
    status: 'ativa'
  },
  {
    id: '2',
    participanteId: '2',
    tipoPlano: 'trimestral',
    valor: 400,
    dataInicio: '2025-08-01',
    dataFim: '2025-10-31',
    status: 'ativa'
  },
  {
    id: '3',
    participanteId: '1',
    tipoPlano: 'mensal',
    valor: 150,
    dataInicio: '2025-07-01',
    dataFim: '2025-07-31',
    status: 'inativa'
  }
];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  
  if (method === 'GET') {
    return mensalidades;
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    
    // Validation
    if (!body.participanteId || !body.tipoPlano || !body.valor || !body.dataInicio || !body.dataFim) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Participante, tipo de plano, valor, data de início e data de fim são obrigatórios'
      });
    }

    // Validate dates
    const dataInicio = new Date(body.dataInicio);
    const dataFim = new Date(body.dataFim);
    
    if (dataInicio >= dataFim) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Data de fim deve ser posterior à data de início'
      });
    }

    // Check for overlapping active subscription
    const existingMensalidade = mensalidades.find(m => 
      m.participanteId === body.participanteId && 
      m.status === 'ativa' &&
      (
        (new Date(body.dataInicio) <= new Date(m.dataFim) && new Date(body.dataFim) >= new Date(m.dataInicio))
      )
    );
    
    if (existingMensalidade) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Participante já possui mensalidade ativa no período especificado'
      });
    }

    const newMensalidade: Mensalidade = {
      id: crypto.randomUUID(),
      participanteId: body.participanteId,
      tipoPlano: body.tipoPlano,
      valor: Number(body.valor),
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      status: body.status || 'ativa'
    };
    
    mensalidades.push(newMensalidade);
    return newMensalidade;
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  });
});
