import { Evento } from '../../models/evento';

let eventos: Evento[] = [
  {
    id: '1',
    nome: 'Campeonato de Precisão',
    data: '2025-09-15',
    local: 'Estande Principal',
    descricao: 'Competição de precisão com pistola calibre .22',
    status: 'aberto',
    participantes: [],
    resultados: [],
    criadoPor: 'admin'
  },
  {
    id: '2',
    nome: 'Treinamento Básico',
    data: '2025-09-20',
    local: 'Estande de Treinamento',
    descricao: 'Sessão de treinamento para iniciantes',
    status: 'aberto',
    participantes: [],
    resultados: [],
    criadoPor: 'admin'
  }
];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  
  if (method === 'GET') {
    return eventos;
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    
    // Validation
    if (!body.nome || !body.data || !body.local) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome, data e local são obrigatórios'
      });
    }

    const newEvento: Evento = {
      id: crypto.randomUUID(),
      nome: body.nome,
      data: body.data,
      local: body.local,
      descricao: body.descricao || '',
      status: body.status || 'aberto',
      participantes: [],
      resultados: [],
      criadoPor: body.criadoPor || 'admin'
    };
    
    eventos.push(newEvento);
    return newEvento;
  }
  
  if (method === 'PUT') {
    const body = await readBody(event);
    const idx = eventos.findIndex(e => e.id === body.id);
    
    if (idx === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Evento não encontrado'
      });
    }
    
    eventos[idx] = { ...eventos[idx], ...body };
    return eventos[idx];
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  });
});
