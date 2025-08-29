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
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID é obrigatório'
    });
  }

  const index = mensalidades.findIndex(m => m.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Mensalidade não encontrada'
    });
  }

  mensalidades.splice(index, 1);
  
  return { success: true };
});