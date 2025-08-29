import { User } from '../../../models/user';
import { getUserStore } from '../../utils/userStore';

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
  if (!body.nome || !body.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nome e email são obrigatórios'
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

  // Update the user (excluding password if empty)
  const updateData = { ...body };
  if (!updateData.senha) {
    delete updateData.senha;
  }
  
  users[index] = {
    ...users[index],
    ...updateData,
    id // Ensure ID doesn't change
  };

  // Return user without password
  const { senha, ...userWithoutPassword } = users[index];
  return userWithoutPassword;
});