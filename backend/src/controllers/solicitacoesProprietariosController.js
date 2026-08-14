const { db } = require("../database");

const ATENDENTES = ["Jéssica", "Steffany"];
const STATUS = ["Em andamento", "Encerrado"];
const SATISFACOES = ["Muito satisfeito", "Satisfeito", "Insatisfeito", "Muito insatisfeito"];

function podeEditar(user) { return user.perfil !== "analise_gestao"; }
function validar(body) {
  if (!body.data_solicitacao || !ATENDENTES.includes(body.atendente) || !body.proprietario_id || !body.motivo?.trim() || !STATUS.includes(body.status || "Em andamento")) return "Preencha data, atendente, proprietário, motivo e status corretamente.";
  if (body.satisfacao && !SATISFACOES.includes(body.satisfacao)) return "Grau de satisfação inválido.";
}
function listar(req, res) {
  let sql = `SELECT s.*, p.nome proprietario_nome, u.numero unidade_numero, e.nome empreendimento_nome
    FROM solicitacoes_proprietarios s JOIN proprietarios p ON p.id=s.proprietario_id
    LEFT JOIN unidades u ON u.id=s.unidade_id LEFT JOIN empreendimentos e ON e.id=u.empreendimento_id WHERE 1=1`;
  const params = [];
  [["status","s.status"],["atendente","s.atendente"],["motivo","s.motivo"]].forEach(([q,c]) => { if (req.query[q]) { sql += ` AND ${c}=?`; params.push(req.query[q]); } });
  if (req.query.busca) { sql += " AND (p.nome LIKE ? OR e.nome LIKE ? OR u.numero LIKE ?)"; const busca = `%${req.query.busca}%`; params.push(busca,busca,busca); }
  sql += " ORDER BY s.data_solicitacao DESC, s.id DESC";
  res.json(db.prepare(sql).all(...params));
}
function criar(req, res) {
  if (!podeEditar(req.user)) return res.status(403).json({ error: "Perfil de análise possui acesso somente de consulta." });
  const erro = validar(req.body); if (erro) return res.status(400).json({ error: erro });
  const b = req.body;
  const result = db.prepare(`INSERT INTO solicitacoes_proprietarios (data_solicitacao,atendente,proprietario_id,unidade_id,motivo,respondido_em,status,satisfacao,descricao,criado_por) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(b.data_solicitacao,b.atendente,b.proprietario_id,b.unidade_id || null,b.motivo.trim(),b.respondido_em || null,b.status || "Em andamento",b.satisfacao || null,b.descricao?.trim() || null,req.user.id);
  res.status(201).json({ id: Number(result.lastInsertRowid) });
}
function atualizar(req, res) {
  if (!podeEditar(req.user)) return res.status(403).json({ error: "Perfil de análise possui acesso somente de consulta." });
  if (!db.prepare("SELECT id FROM solicitacoes_proprietarios WHERE id=?").get(req.params.id)) return res.status(404).json({ error: "Solicitação não encontrada." });
  const erro = validar(req.body); if (erro) return res.status(400).json({ error: erro }); const b = req.body;
  db.prepare(`UPDATE solicitacoes_proprietarios SET data_solicitacao=?,atendente=?,proprietario_id=?,unidade_id=?,motivo=?,respondido_em=?,status=?,satisfacao=?,descricao=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?`).run(b.data_solicitacao,b.atendente,b.proprietario_id,b.unidade_id || null,b.motivo.trim(),b.respondido_em || null,b.status,b.satisfacao || null,b.descricao?.trim() || null,req.params.id);
  res.json({ id: Number(req.params.id) });
}
module.exports = { listar, criar, atualizar };
