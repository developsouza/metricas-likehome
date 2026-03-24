const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1').get(email);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const ok = bcrypt.compareSync(senha, user.senha_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign(
    { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, departamento: user.departamento },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    usuario: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, departamento: user.departamento }
  });
}

function me(req, res) {
  const user = db.prepare('SELECT id, nome, email, perfil, departamento FROM usuarios WHERE id = ?').get(req.user.id);
  res.json(user);
}

module.exports = { login, me };
