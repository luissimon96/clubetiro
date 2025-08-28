const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const crypto = require('crypto');

// Gerar tokens JWT
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Login
const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Buscar usuário no banco
    const result = await pool.query(
      'SELECT id, nome, email, senha_hash, tipo, ativo FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];

    if (!user.ativo) {
      return res.status(401).json({ error: 'Conta desativada. Contate o administrador.' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gerar tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Salvar refresh token no banco
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at, user_agent, ip_address) 
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
      [user.id, refreshTokenHash, req.headers['user-agent'], req.ip]
    );

    // Atualizar último login
    await pool.query(
      'UPDATE users SET ultimo_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Registro de usuário
const register = async (req, res) => {
  try {
    const { nome, email, senha, tipo = 'comum' } = req.body;

    // Verificar se email já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    // Inserir usuário
    const result = await pool.query(
      `INSERT INTO users (nome, email, senha_hash, tipo) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, nome, email, tipo, data_cadastro`,
      [nome, email.toLowerCase(), hashedPassword, tipo]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
        tipo: newUser.tipo,
        dataCadastro: newUser.data_cadastro
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    // Verificar o token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar se o token existe no banco e não expirou
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const sessionResult = await pool.query(
      'SELECT user_id FROM user_sessions WHERE refresh_token = $1 AND expires_at > NOW()',
      [refreshTokenHash]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    // Gerar novos tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    // Atualizar refresh token no banco
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await pool.query(
      'UPDATE user_sessions SET refresh_token = $1, expires_at = NOW() + INTERVAL \'7 days\', last_used_at = NOW() WHERE refresh_token = $2',
      [newRefreshTokenHash, refreshTokenHash]
    );

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }
    console.error('Erro no refresh token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await pool.query(
        'DELETE FROM user_sessions WHERE refresh_token = $1',
        [refreshTokenHash]
      );
    }

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  logout
};