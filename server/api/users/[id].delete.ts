import { User } from '../../../models/user';
import { getUserStore } from '../../utils/userStore';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID é obrigatório'
    });
  }

  const users = getUserStore();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Usuário não encontrado'
    });
  }

  // Remove the user
  users.splice(index, 1);

  return { success: true };
});