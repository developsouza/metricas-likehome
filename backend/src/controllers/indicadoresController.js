const { db } = require('../database');

function listar(req, res) {
  const { departamento, tipo } = req.query;
  let sql = 'SELECT * FROM indicadores WHERE ativo = 1';
  const params = [];
  if (departamento) { sql += ' AND departamento = ?'; params.push(departamento); }
  if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
  sql += ' ORDER BY departamento, tipo DESC, nome';
  res.json(db.prepare(sql).all(...params));
}

function criar(req, res) {
  const { departamento, tipo, nome, descricao, unidade_medida, meta_padrao } = req.body;
  if (!departamento || !tipo || !nome) return res.status(400).json({ error: 'Departamento, tipo e nome são obrigatórios' });
  const result = db.prepare('INSERT INTO indicadores (departamento, tipo, nome, descricao, unidade_medida, meta_padrao) VALUES (?, ?, ?, ?, ?, ?)')
    .run(departamento, tipo, nome, descricao, unidade_medida || 'unidade', meta_padrao || null);
  res.status(201).json({ id: result.lastInsertRowid });
}

function atualizar(req, res) {
  const { nome, descricao, unidade_medida, meta_padrao, ativo } = req.body;
  const ind = db.prepare('SELECT * FROM indicadores WHERE id = ?').get(req.params.id);
  if (!ind) return res.status(404).json({ error: 'Indicador não encontrado' });
  db.prepare('UPDATE indicadores SET nome=?, descricao=?, unidade_medida=?, meta_padrao=?, ativo=? WHERE id=?')
    .run(nome || ind.nome, descricao ?? ind.descricao, unidade_medida || ind.unidade_medida, meta_padrao ?? ind.meta_padrao, ativo !== undefined ? ativo : ind.ativo, req.params.id);
  res.json({ message: 'Indicador atualizado' });
}

module.exports = { listar, criar, atualizar };
