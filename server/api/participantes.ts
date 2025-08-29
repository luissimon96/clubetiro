import { Participante } from '../../models/participante';

let participantes: Participante[] = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-9999',
    associado: true,
    eventosInscritos: ['1']
  },
  {
    id: '2',
    nome: 'Maria Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 88888-8888',
    associado: false,
    eventosInscritos: []
  }
];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  
  if (method === 'GET') {
    return participantes;
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    
    // Validation
    if (!body.nome || !body.email || !body.telefone) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nome, email e telefone são obrigatórios'
      });
    }

    // Check for duplicate email
    const existingParticipante = participantes.find(p => p.email === body.email);
    if (existingParticipante) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email já está sendo usado por outro participante'
      });
    }

    const newParticipante: Participante = {
      id: crypto.randomUUID(),
      nome: body.nome,
      email: body.email,
      telefone: body.telefone,
      associado: body.associado || false,
      eventosInscritos: []
    };
    
    participantes.push(newParticipante);
    return newParticipante;
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Método não permitido'
  });
});
