const jwt = require('jsonwebtoken');
const { db } = require('../database');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
