const { db } = require('../database');

function listar(req, res) {
  const rows = db.prepare('SELECT * FROM proprietarios ORDER BY nome').all();
  res.json(rows);
}

function criar(req, res) {
  const { nome, cpf_cnpj, email, telefone } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  const result = db.prepare('INSERT INTO proprietarios (nome, cpf_cnpj, email, telefone) VALUES (?, ?, ?, ?)').run(nome, cpf_cnpj, email, telefone);
  res.status(201).json({ id: result.lastInsertRowid, nome, cpf_cnpj, email, telefone });
}

function atualizar(req, res) {
  const { nome, cpf_cnpj, email, telefone } = req.body;
  const p = db.prepare('SELECT * FROM proprietarios WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Proprietário não encontrado' });
  db.prepare('UPDATE proprietarios SET nome=?, cpf_cnpj=?, email=?, telefone=? WHERE id=?')
    .run(nome || p.nome, cpf_cnpj ?? p.cpf_cnpj, email ?? p.email, telefone ?? p.telefone, req.params.id);
  res.json({ message: 'Proprietário atualizado' });
}

function remover(req, res) {
  db.prepare('DELETE FROM proprietarios WHERE id = ?').run(req.params.id);
  res.json({ message: 'Proprietário removido' });
}

module.exports = { listar, criar, atualizar, remover };
