import { Mensalidade } from '../../../models/mensalidade';

// This should be shared across all endpoint files in a real app
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
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID é obrigatório'
    });
  }

  // Validation
  if (!body.participanteId || !body.tipoPlano || !body.valor || !body.dataInicio || !body.dataFim) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Participante, tipo de plano, valor, data de início e data de fim são obrigatórios'
    });
  }

  const index = mensalidades.findIndex(m => m.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Mensalidade não encontrada'
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

  // Check for overlapping active subscription (excluding current record)
  const existingMensalidade = mensalidades.find(m => 
    m.participanteId === body.participanteId && 
    m.status === 'ativa' &&
    m.id !== id &&
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

  // Update the mensalidade
  mensalidades[index] = {
    ...mensalidades[index],
    ...body,
    id, // Ensure ID doesn't change
    valor: Number(body.valor)
  };

  return mensalidades[index];
});