const { db } = require('../database');

function listar(req, res) {
  const { competencia, departamento, indicador_id } = req.query;
  let sql = `
    SELECT l.*, i.nome as indicador_nome, i.departamento, i.tipo, i.unidade_medida,
      u.nome as usuario_nome
    FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    JOIN usuarios u ON u.id = l.usuario_id
    WHERE 1=1
  `;
  const params = [];
  if (competencia) { sql += ' AND l.competencia = ?'; params.push(competencia); }
  if (departamento) { sql += ' AND i.departamento = ?'; params.push(departamento); }
  if (indicador_id) { sql += ' AND l.indicador_id = ?'; params.push(indicador_id); }
  sql += ' ORDER BY i.departamento, i.tipo DESC, i.nome';
  res.json(db.prepare(sql).all(...params));
}

function criar(req, res) {
  const { indicador_id, competencia, valor_realizado, meta, observacao } = req.body;
  if (!indicador_id || !competencia || valor_realizado === undefined) {
    return res.status(400).json({ error: 'Indicador, competência e valor são obrigatórios' });
  }

  // Verifica se já existe lançamento para este indicador/competência
  const existe = db.prepare('SELECT id FROM lancamentos_indicadores WHERE indicador_id = ? AND competencia = ?').get(indicador_id, competencia);
  if (existe) {
    return res.status(409).json({ error: 'Já existe lançamento para este indicador nesta competência. Use PUT para atualizar.' });
  }

  const result = db.prepare(`
    INSERT INTO lancamentos_indicadores (indicador_id, competencia, valor_realizado, meta, observacao, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(indicador_id, competencia, valor_realizado, meta || null, observacao || null, req.user.id);

  res.status(201).json({ id: result.lastInsertRowid });
}

function atualizar(req, res) {
  const { valor_realizado, meta, observacao } = req.body;
  const lanc = db.prepare('SELECT * FROM lancamentos_indicadores WHERE id = ?').get(req.params.id);
  if (!lanc) return res.status(404).json({ error: 'Lançamento não encontrado' });

  // Usuário comum só pode editar seus próprios lançamentos
  if (req.user.perfil !== 'admin' && lanc.usuario_id !== req.user.id) {
    return res.status(403).json({ error: 'Sem permissão para editar este lançamento' });
  }

  db.prepare('UPDATE lancamentos_indicadores SET valor_realizado=?, meta=?, observacao=? WHERE id=?')
    .run(valor_realizado ?? lanc.valor_realizado, meta ?? lanc.meta, observacao ?? lanc.observacao, req.params.id);
  res.json({ message: 'Lançamento atualizado' });
}

function remover(req, res) {
  if (req.user.perfil !== 'admin') return res.status(403).json({ error: 'Sem permissão' });
  db.prepare('DELETE FROM lancamentos_indicadores WHERE id = ?').run(req.params.id);
  res.json({ message: 'Lançamento removido' });
}

function historico(req, res) {
  const { indicador_id, meses } = req.query;
  if (!indicador_id) return res.status(400).json({ error: 'indicador_id obrigatório' });
  const limit = parseInt(meses) || 12;
  const rows = db.prepare(`
    SELECT competencia, valor_realizado, meta FROM lancamentos_indicadores
    WHERE indicador_id = ? ORDER BY competencia DESC LIMIT ?
  `).all(indicador_id, limit);
  res.json(rows.reverse());
}

module.exports = { listar, criar, atualizar, remover, historico };
