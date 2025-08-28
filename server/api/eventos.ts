import { Evento } from '../../models/evento';

let eventos: Evento[] = [];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  if (method === 'GET') {
    return eventos;
  }
  if (method === 'POST') {
    const body = await readBody(event);
    const newEvento: Evento = { ...body, id: crypto.randomUUID(), participantes: [], resultados: [] };
    eventos.push(newEvento);
    return newEvento;
  }
  if (method === 'PUT') {
    const body = await readBody(event);
    const idx = eventos.findIndex(e => e.id === body.id);
    if (idx !== -1) {
      eventos[idx] = { ...eventos[idx], ...body };
      return eventos[idx];
    }
    return { error: 'Evento not found' };
  }
  if (method === 'DELETE') {
    const { id } = await readBody(event);
    eventos = eventos.filter(e => e.id !== id);
    return { success: true };
  }
});
