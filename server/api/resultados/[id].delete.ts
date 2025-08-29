import { Resultado } from '../../../models/resultado';

// This should be shared across all endpoint files in a real app
let resultados: Resultado[] = [
  {
    id: '1',
    eventoId: '1',
    participanteId: '1',
    pontuacao: 95,
    ranking: 1,
    observacoes: 'Excelente desempenho'
  },
  {
    id: '2',
    eventoId: '1',
    participanteId: '2',
    pontuacao: 88,
    ranking: 2,
    observacoes: 'Bom resultado'
  },
  {
    id: '3',
    eventoId: '2',
    participanteId: '1',
    pontuacao: 92,
    ranking: 1,
    observacoes: 'Consistência mantida'
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

  const index = resultados.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Resultado não encontrado'
    });
  }

  resultados.splice(index, 1);
  
  return { success: true };
});