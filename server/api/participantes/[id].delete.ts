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
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID é obrigatório'
    });
  }

  const index = participantes.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Participante não encontrado'
    });
  }

  participantes.splice(index, 1);
  
  return { success: true };
});