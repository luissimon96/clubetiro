import { Resultado } from '../../models/resultado';

let resultados: Resultado[] = [];

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  if (method === 'GET') {
    return resultados;
  }
  if (method === 'POST') {
    const body = await readBody(event);
    const newResultado: Resultado = { ...body, id: crypto.randomUUID() };
    resultados.push(newResultado);
    return newResultado;
  }
  if (method === 'PUT') {
    const body = await readBody(event);
    const idx = resultados.findIndex(r => r.id === body.id);
    if (idx !== -1) {
      resultados[idx] = { ...resultados[idx], ...body };
      return resultados[idx];
    }
    return { error: 'Resultado not found' };
  }
  if (method === 'DELETE') {
    const { id } = await readBody(event);
    resultados = resultados.filter(r => r.id !== id);
    return { success: true };
  }
});
