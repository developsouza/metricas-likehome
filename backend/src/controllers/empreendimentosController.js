const { db } = require('../database');

function listar(req, res) {
  const rows = db.prepare(`
    SELECT e.*, 
      (SELECT COUNT(*) FROM unidades u WHERE u.empreendimento_id = e.id) as total_unidades,
      (SELECT COUNT(*) FROM unidades u WHERE u.empreendimento_id = e.id AND u.status = 'Ativo') as unidades_ativas
    FROM empreendimentos e ORDER BY e.nome
  `).all();
  res.json(rows);
}

function buscar(req, res) {
  const row = db.prepare('SELECT * FROM empreendimentos WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Empreendimento não encontrado' });
  res.json(row);
}

function criar(req, res) {
  const { nome, endereco, cidade, estado } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  const result = db.prepare('INSERT INTO empreendimentos (nome, endereco, cidade, estado) VALUES (?, ?, ?, ?)').run(nome, endereco, cidade, estado);
  res.status(201).json({ id: result.lastInsertRowid, nome, endereco, cidade, estado });
}

function atualizar(req, res) {
  const { nome, endereco, cidade, estado, ativo } = req.body;
  const emp = db.prepare('SELECT * FROM empreendimentos WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Empreendimento não encontrado' });
  db.prepare('UPDATE empreendimentos SET nome=?, endereco=?, cidade=?, estado=?, ativo=? WHERE id=?')
    .run(nome || emp.nome, endereco ?? emp.endereco, cidade ?? emp.cidade, estado ?? emp.estado, ativo !== undefined ? ativo : emp.ativo, req.params.id);
  res.json({ message: 'Empreendimento atualizado' });
}

function remover(req, res) {
  db.prepare('UPDATE empreendimentos SET ativo = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Empreendimento desativado' });
}

module.exports = { listar, buscar, criar, atualizar, remover };
