const { z } = require('zod');

const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados de entrada inválidos',
          details: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensagem: err.message
          }))
        });
      }
      next(error);
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parâmetros de consulta inválidos',
          details: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensagem: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Schemas de validação comuns
const schemas = {
  user: {
    create: z.object({
      nome: z.string().min(2).max(100),
      email: z.string().email().max(150),
      senha: z.string().min(6).max(50),
      tipo: z.enum(['admin', 'comum']).optional()
    }),
    update: z.object({
      nome: z.string().min(2).max(100).optional(),
      email: z.string().email().max(150).optional(),
      tipo: z.enum(['admin', 'comum']).optional(),
      ativo: z.boolean().optional()
    }),
    login: z.object({
      email: z.string().email(),
      senha: z.string().min(1)
    })
  },
  evento: {
    create: z.object({
      nome: z.string().min(2).max(200),
      descricao: z.string().optional(),
      data_evento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
      hora_fim: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      local: z.string().max(200).optional(),
      max_participantes: z.number().int().positive().optional(),
      valor_inscricao: z.number().nonnegative().optional()
    }),
    update: z.object({
      nome: z.string().min(2).max(200).optional(),
      descricao: z.string().optional(),
      data_evento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      hora_inicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      hora_fim: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      local: z.string().max(200).optional(),
      max_participantes: z.number().int().positive().optional(),
      valor_inscricao: z.number().nonnegative().optional(),
      status: z.enum(['planejado', 'inscricoes_abertas', 'em_andamento', 'finalizado', 'cancelado']).optional()
    })
  }
};

module.exports = {
  validateBody,
  validateQuery,
  schemas
};