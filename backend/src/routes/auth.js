const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateBody, schemas } = require('../middleware/validation');
const { loginLimiter, createUserLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/login
router.post('/login', 
  loginLimiter,
  validateBody(schemas.user.login),
  authController.login
);

// POST /api/auth/register
router.post('/register',
  createUserLimiter,
  validateBody(schemas.user.create),
  authController.register
);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;