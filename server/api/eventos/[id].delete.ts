import { Evento } from '../../../models/evento';

// This should be shared across all endpoint files in a real app
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
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID é obrigatório'
    });
  }

  const index = eventos.findIndex(e => e.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Evento não encontrado'
    });
  }

  eventos.splice(index, 1);
  
  return { success: true };
});