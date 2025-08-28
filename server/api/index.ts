// Rotas CRUD principais do sistema de clube de tiro
// Exemplo de uso: /api/users, /api/eventos, /api/participantes, /api/resultados, /api/mensalidades
// Cada rota já implementa GET, POST, PUT, DELETE em arquivos separados.
export default defineEventHandler(() => {
  return {
    message: 'API do Clube de Tiro disponível. Use as rotas /api/users, /api/eventos, /api/participantes, /api/resultados, /api/mensalidades.'
  }
});
