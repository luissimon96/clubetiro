import { User } from '../../models/user';
import crypto from 'crypto';

let users: User[] = [];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  const url = getRouterParam(event, '_');
  
  if (method === 'GET') {
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
    users.push(newUser);
    return { ...newUser, senha: undefined }; // Don't send password back
  }
  
  if (method === 'PUT') {
    const body = await readBody(event);
    const idx = users.findIndex(u => u.id === body.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...body };
      return { ...users[idx], senha: undefined };
    }
    return { error: 'User not found' };
  }
  
  if (method === 'DELETE') {
    const id = url; // ID comes from URL parameter
    users = users.filter(u => u.id !== id);
    return { success: true };
  }
});