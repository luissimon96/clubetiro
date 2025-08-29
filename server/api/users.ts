import { User } from '../../models/user';
import crypto from 'crypto';
import { getUserStore } from '../utils/userStore';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const url = getRouterParam(event, '_');
  
  if (method === 'GET') {
    const users = getUserStore();
    return users.map(user => ({ ...user, senha: undefined })); // Don't send passwords
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    // Hash password in real implementation
    const newUser: User = { 
      ...body, 
      id: crypto.randomUUID(), 
      dataCadastro: new Date().toISOString(),
      tipo: body.tipo || 'comum'
    };
    const users = getUserStore();
    users.push(newUser);
    return { ...newUser, senha: undefined }; // Don't send password back
  }
  
  // PUT and DELETE are now handled by dynamic routes
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  });
});