import { Mensalidade } from '../../models/mensalidade';

let mensalidades: Mensalidade[] = [];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  if (method === 'GET') {
    return mensalidades;
  }
  if (method === 'POST') {
    const body = await readBody(event);
    const newMensalidade: Mensalidade = { ...body, id: crypto.randomUUID() };
    mensalidades.push(newMensalidade);
    return newMensalidade;
  }
  if (method === 'PUT') {
    const body = await readBody(event);
    const idx = mensalidades.findIndex(m => m.id === body.id);
    if (idx !== -1) {
      mensalidades[idx] = { ...mensalidades[idx], ...body };
      return mensalidades[idx];
    }
    return { error: 'Mensalidade not found' };
  }
  if (method === 'DELETE') {
    const { id } = await readBody(event);
    mensalidades = mensalidades.filter(m => m.id !== id);
    return { success: true };
  }
});
