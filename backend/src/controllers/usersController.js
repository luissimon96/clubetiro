const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// Listar usuários
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { tipo, ativo, search } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (tipo) {
      whereConditions.push(`tipo = $${paramIndex++}`);
      queryParams.push(tipo);
    }

    if (ativo !== undefined) {
      whereConditions.push(`ativo = $${paramIndex++}`);
      queryParams.push(ativo === 'true');
    }

    if (search) {
      whereConditions.push(`(nome ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Buscar usuários
    const usersQuery = `
      SELECT id, nome, email, tipo, data_cadastro, ultimo_login, ativo
      FROM users
      ${whereClause}
      ORDER BY nome
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(usersQuery, queryParams);

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2)); // Remove limit e offset

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar usuário por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, nome, email, tipo, data_cadastro, ultimo_login, ativo 
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar usuário
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, tipo, ativo } = req.body;

    // Verificar se usuário existe
    const existingUser = await pool.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se email foi alterado, verificar se não está em uso
    if (email && email !== existingUser.rows[0].email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), id]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email já está em uso' });
      }
    }

    // Construir query de update dinâmica
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nome) {
      updates.push(`nome = $${paramIndex++}`);
      values.push(nome);
    }

    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email.toLowerCase());
    }

    if (tipo) {
      updates.push(`tipo = $${paramIndex++}`);
      values.push(tipo);
    }

    if (ativo !== undefined) {
      updates.push(`ativo = $${paramIndex++}`);
      values.push(ativo);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, nome, email, tipo, data_cadastro, ultimo_login, ativo, updated_at
    `;

    const result = await pool.query(updateQuery, values);

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Alterar senha
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    // Verificar se é o próprio usuário ou admin
    if (req.user.id !== id && req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    // Se não for admin, verificar senha atual
    if (req.user.tipo !== 'admin') {
      const userResult = await pool.query('SELECT senha_hash FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const validPassword = await bcrypt.compare(senhaAtual, userResult.rows[0].senha_hash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }
    }

    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(novaSenha, saltRounds);

    // Atualizar senha
    await pool.query(
      'UPDATE users SET senha_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );

    // Invalidar todas as sessões do usuário
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);

    res.json({ message: 'Senha alterada com sucesso. Faça login novamente.' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Desativar usuário (soft delete)
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir desativar o próprio usuário
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Não é possível desativar sua própria conta' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET ativo = false, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, nome, email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Invalidar todas as sessões do usuário
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);

    res.json({
      message: 'Usuário desativado com sucesso',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  deactivateUser
};