const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');

// Configuração do Redis para rate limiting
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = Redis.createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis rate limiter error:', err));
  redisClient.connect().catch(console.error);
}

// Rate limiter geral (100 requests por 15 minutos)
const generalLimiter = rateLimit({
  store: redisClient ? new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de requests por windowMs
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para login (5 tentativas por 15 minutos)
const loginLimiter = rateLimit({
  store: redisClient ? new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // limite de tentativas de login por windowMs
  skipSuccessfulRequests: true,
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para criação de usuários (3 por hora)
const createUserLimiter = rateLimit({
  store: redisClient ? new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }) : undefined,
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 usuários criados por hora por IP
  message: {
    error: 'Limite de criação de usuários excedido. Tente novamente em 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  loginLimiter,
  createUserLimiter
};