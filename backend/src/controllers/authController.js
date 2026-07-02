const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { jwtSecret, jwtExpiresIn } = require('../config');

function login(req, res) {
  const email = req.body.email?.trim().toLowerCase();
  const { senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  const user = db.prepare('SELECT id,nome,email,senha_hash,perfil,departamento FROM usuarios WHERE lower(email) = ? AND ativo = 1').get(email);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const ok = bcrypt.compareSync(senha, user.senha_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign(
    { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil, departamento: user.departamento },
    jwtSecret,
    { expiresIn: jwtExpiresIn, algorithm: 'HS256' }
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
