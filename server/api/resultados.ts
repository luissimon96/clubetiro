import { Resultado } from '../../models/resultado';

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
  const method = event.node.req.method;
  
  if (method === 'GET') {
    return resultados;
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    
    // Validation
    if (!body.eventoId || !body.participanteId || body.pontuacao === undefined || body.ranking === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Evento, participante, pontuação e ranking são obrigatórios'
      });
    }

    // Check if resultado already exists for this participant in this event
    const existingResultado = resultados.find(r => 
      r.eventoId === body.eventoId && r.participanteId === body.participanteId
    );
    
    if (existingResultado) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Já existe um resultado para este participante neste evento'
      });
    }

    const newResultado: Resultado = {
      id: crypto.randomUUID(),
      eventoId: body.eventoId,
      participanteId: body.participanteId,
      pontuacao: Number(body.pontuacao),
      ranking: Number(body.ranking),
      observacoes: body.observacoes || ''
    };
    
    resultados.push(newResultado);
    return newResultado;
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  });
});
