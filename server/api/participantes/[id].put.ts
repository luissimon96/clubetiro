import { Participante } from '../../../models/participante';

// This should be shared across all endpoint files in a real app
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
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID é obrigatório'
    });
  }

  // Validation
  if (!body.nome || !body.email || !body.telefone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome, email e telefone são obrigatórios'
    });
  }

  const index = participantes.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Participante não encontrado'
    });
  }

  // Check for duplicate email (excluding current participant)
  const existingParticipante = participantes.find(p => p.email === body.email && p.id !== id);
  if (existingParticipante) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email já está sendo usado por outro participante'
    });
  }

  // Update the participante
  participantes[index] = {
    ...participantes[index],
    ...body,
    id // Ensure ID doesn't change
  };

  return participantes[index];
});