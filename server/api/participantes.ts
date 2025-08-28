import { Participante } from '../../models/participante';

let participantes: Participante[] = [];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  if (method === 'GET') {
    return participantes;
  }
  if (method === 'POST') {
    const body = await readBody(event);
    const newParticipante: Participante = { ...body, id: crypto.randomUUID(), eventosInscritos: [] };
    participantes.push(newParticipante);
    return newParticipante;
  }
  if (method === 'PUT') {
    const body = await readBody(event);
    const idx = participantes.findIndex(p => p.id === body.id);
    if (idx !== -1) {
      participantes[idx] = { ...participantes[idx], ...body };
      return participantes[idx];
    }
    return { error: 'Participante not found' };
  }
  if (method === 'DELETE') {
    const { id } = await readBody(event);
    participantes = participantes.filter(p => p.id !== id);
    return { success: true };
  }
});
