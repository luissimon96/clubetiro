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
  const body = await readBody(event);
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID é obrigatório'
    });
  }

  // Validation
  if (!body.eventoId || !body.participanteId || body.pontuacao === undefined || body.ranking === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Evento, participante, pontuação e ranking são obrigatórios'
    });
  }

  const index = resultados.findIndex(r => r.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Resultado não encontrado'
    });
  }

  // Check if resultado already exists for this participant in this event (excluding current record)
  const existingResultado = resultados.find(r => 
    r.eventoId === body.eventoId && 
    r.participanteId === body.participanteId && 
    r.id !== id
  );
  
  if (existingResultado) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Já existe um resultado para este participante neste evento'
    });
  }

  // Update the resultado
  resultados[index] = {
    ...resultados[index],
    ...body,
    id, // Ensure ID doesn't change
    pontuacao: Number(body.pontuacao),
    ranking: Number(body.ranking)
  };

  return resultados[index];
});