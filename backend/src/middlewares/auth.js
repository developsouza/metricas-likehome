const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { jwtSecret } = require('../config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const match = typeof authHeader === 'string' && authHeader.match(/^Bearer\s+(\S+)$/i);
  const token = match && match[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    const user = db.prepare('SELECT id,nome,email,perfil,departamento FROM usuarios WHERE id=? AND ativo=1').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'Usuário inativo ou inexistente' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

function rolesMiddleware(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.user.perfil)) return res.status(403).json({ error: 'Sem permissão para este recurso' });
    next();
  };
}

module.exports = { authMiddleware, adminMiddleware, rolesMiddleware };
