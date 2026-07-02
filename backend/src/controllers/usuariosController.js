const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { PERFIS, DEPARTAMENTOS_USUARIO } = require('../constants');

function validar(perfil, departamento) {
  if (!PERFIS.includes(perfil)) return 'Perfil inválido';
  if (departamento && !DEPARTAMENTOS_USUARIO.includes(departamento)) return 'Departamento inválido';
  if (perfil === 'usuario' && !departamento) return 'Departamento é obrigatório para usuários';
  return null;
}

function listar(req, res) {
  const rows = db.prepare('SELECT id, nome, email, perfil, departamento, ativo, criado_em FROM usuarios ORDER BY nome').all();
  res.json(rows);
}

function buscar(req, res) {
  const row = db.prepare('SELECT id, nome, email, perfil, departamento, ativo FROM usuarios WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(row);
}

function criar(req, res) {
  const { nome, email, senha, perfil, departamento } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) return res.status(409).json({ error: 'Email já cadastrado' });

  const perfilFinal = perfil || 'usuario';
  const erro = validar(perfilFinal, departamento);
  if (erro) return res.status(400).json({ error: erro });

  const hash = bcrypt.hashSync(senha, 10);
  const result = db.prepare(
    'INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento) VALUES (?, ?, ?, ?, ?)'
  ).run(nome, email, hash, perfilFinal, departamento || null);

  res.status(201).json({ id: Number(result.lastInsertRowid), nome, email, perfil: perfilFinal, departamento });
}

function atualizar(req, res) {
  const { nome, email, perfil, departamento, ativo, senha } = req.body;
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const perfilFinal = perfil || user.perfil;
  const departamentoFinal = departamento === '' ? null : (departamento ?? user.departamento);
  const erro = validar(perfilFinal, departamentoFinal);
  if (erro) return res.status(400).json({ error: erro });

  const hash = senha ? bcrypt.hashSync(senha, 10) : user.senha_hash;

  db.prepare(
    'UPDATE usuarios SET nome=?, email=?, senha_hash=?, perfil=?, departamento=?, ativo=? WHERE id=?'
  ).run(nome || user.nome, email || user.email, hash, perfilFinal, departamentoFinal, ativo !== undefined ? ativo : user.ativo, req.params.id);

  res.json({ message: 'Usuário atualizado' });
}

function remover(req, res) {
  db.prepare('UPDATE usuarios SET ativo = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Usuário desativado' });
}

module.exports = { listar, buscar, criar, atualizar, remover };
