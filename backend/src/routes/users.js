const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBody, validateQuery, schemas } = require('../middleware/validation');
const { z } = require('zod');

// Schemas específicos para users
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  tipo: z.enum(['admin', 'comum']).optional(),
  ativo: z.enum(['true', 'false']).optional(),
  search: z.string().max(100).optional()
});

const passwordChangeSchema = z.object({
  senhaAtual: z.string().min(1).optional(),
  novaSenha: z.string().min(6).max(50)
});

// GET /api/users - Listar usuários (apenas admin)
router.get('/',
  authenticateToken,
  requireAdmin,
  validateQuery(querySchema),
  usersController.getUsers
);

// GET /api/users/:id - Buscar usuário por ID (admin ou próprio usuário)
router.get('/:id',
  authenticateToken,
  usersController.getUserById
);

// PUT /api/users/:id - Atualizar usuário (admin ou próprio usuário)
router.put('/:id',
  authenticateToken,
  validateBody(schemas.user.update),
  usersController.updateUser
);

// PUT /api/users/:id/password - Alterar senha
router.put('/:id/password',
  authenticateToken,
  validateBody(passwordChangeSchema),
  usersController.changePassword
);

// DELETE /api/users/:id - Desativar usuário (apenas admin)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  usersController.deactivateUser
);

module.exports = router;