const { db } = require("../database");
const { DEPARTAMENTOS, STATUS_ATIVIDADE, PRIORIDADES_ATIVIDADE } = require("../constants");

const ESTRATEGICOS = new Set(["admin", "analise_gestao"]);
const CAMPOS_EDITAVEIS = ["titulo", "descricao", "status", "prioridade", "responsavel_id", "prazo"];

function atividadeBase(id) {
  return db.prepare(`
    SELECT a.*, c.nome criado_por_nome, r.nome responsavel_nome, u.nome atualizado_por_nome,
      CASE WHEN a.prazo IS NOT NULL AND datetime(a.prazo) < datetime('now') AND a.status NOT IN ('Concluído','Cancelado') THEN 1 ELSE 0 END atrasada
    FROM atividades a
    JOIN usuarios c ON c.id = a.criado_por
    LEFT JOIN usuarios r ON r.id = a.responsavel_id
    LEFT JOIN usuarios u ON u.id = a.atualizado_por
    WHERE a.id = ? AND a.excluida_em IS NULL
  `).get(id);
}

function podeVer(user, atividade) {
  return atividade && (ESTRATEGICOS.has(user.perfil) || atividade.departamento === user.departamento);
}

function podeEditar(user, atividade) {
  return user.perfil === "admin" || (user.perfil === "usuario" && atividade.departamento === user.departamento);
}

function registrarHistorico(atividadeId, usuarioId, acao, campo = null, anterior = null, novo = null) {
  db.prepare(`INSERT INTO atividades_historico (atividade_id,usuario_id,acao,campo,valor_anterior,valor_novo) VALUES (?,?,?,?,?,?)`)
    .run(atividadeId, usuarioId, acao, campo, anterior == null ? null : String(anterior), novo == null ? null : String(novo));
}

function destinatarios(atividade, autorId, incluirDepartamento = false) {
  const ids = new Set([atividade.criado_por, atividade.responsavel_id]);
  let sql = "SELECT id FROM usuarios WHERE ativo = 1 AND perfil IN ('admin','analise_gestao')";
  const params = [];
  if (incluirDepartamento) { sql += " OR (ativo = 1 AND departamento = ?)"; params.push(atividade.departamento); }
  db.prepare(sql).all(...params).forEach((u) => ids.add(u.id));
  ids.delete(null); ids.delete(undefined); ids.delete(autorId);
  return [...ids];
}

function notificar(atividade, autorId, tipo, titulo, mensagem, incluirDepartamento = false) {
  const stmt = db.prepare(`INSERT INTO notificacoes (usuario_id,tipo,titulo,mensagem,referencia_tipo,referencia_id) VALUES (?,?,?,?,?,?)`);
  destinatarios(atividade, autorId, incluirDepartamento).forEach((id) => stmt.run(id, tipo, titulo, mensagem, "atividade", atividade.id));
}

function gerarNotificacoesAtraso(user) {
  let sql = `SELECT * FROM atividades WHERE excluida_em IS NULL AND prazo IS NOT NULL
    AND datetime(prazo)<datetime('now') AND status NOT IN ('Concluído','Cancelado')`;
  const params = [];
  if (!ESTRATEGICOS.has(user.perfil)) { sql += " AND departamento=?"; params.push(user.departamento); }
  const existe = db.prepare("SELECT 1 FROM notificacoes WHERE usuario_id=? AND tipo='atividade_atrasada' AND referencia_tipo='atividade' AND referencia_id=?");
  const inserir = db.prepare("INSERT INTO notificacoes (usuario_id,tipo,titulo,mensagem,referencia_tipo,referencia_id) VALUES (?,'atividade_atrasada','Atividade atrasada',?,'atividade',?)");
  for (const atividade of db.prepare(sql).all(...params)) {
    for (const id of destinatarios(atividade, null, true)) {
      if (!existe.get(id, atividade.id)) inserir.run(id, `“${atividade.titulo}” ultrapassou o prazo.`, atividade.id);
    }
  }
}

function listar(req, res) {
  gerarNotificacoesAtraso(req.user);
  let sql = `SELECT a.*, c.nome criado_por_nome, r.nome responsavel_nome,
    CASE WHEN a.prazo IS NOT NULL AND datetime(a.prazo) < datetime('now') AND a.status NOT IN ('Concluído','Cancelado') THEN 1 ELSE 0 END atrasada,
    (SELECT COUNT(*) FROM atividades_comentarios ac WHERE ac.atividade_id=a.id) comentarios_total
    FROM atividades a JOIN usuarios c ON c.id=a.criado_por LEFT JOIN usuarios r ON r.id=a.responsavel_id WHERE a.excluida_em IS NULL`;
  const params = [];
  if (!ESTRATEGICOS.has(req.user.perfil)) { sql += " AND a.departamento=?"; params.push(req.user.departamento); }
  const filtros = [
    ["departamento", "a.departamento"], ["status", "a.status"], ["prioridade", "a.prioridade"],
    ["responsavel_id", "a.responsavel_id"], ["criado_por", "a.criado_por"]
  ];
  for (const [query, campo] of filtros) if (req.query[query]) { sql += ` AND ${campo}=?`; params.push(req.query[query]); }
  if (req.query.inicio) { sql += " AND date(a.criado_em)>=date(?)"; params.push(req.query.inicio); }
  if (req.query.fim) { sql += " AND date(a.criado_em)<=date(?)"; params.push(req.query.fim); }
  if (req.query.atrasadas === "1") sql += " AND a.prazo IS NOT NULL AND datetime(a.prazo)<datetime('now') AND a.status NOT IN ('Concluído','Cancelado')";
  if (req.query.sem_atualizacao_dias) { sql += " AND datetime(COALESCE(a.atualizado_em,a.criado_em))<=datetime('now', ?)"; params.push(`-${Number(req.query.sem_atualizacao_dias) || 7} days`); }
  sql += " ORDER BY CASE a.prioridade WHEN 'Urgente' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Média' THEN 3 ELSE 4 END, COALESCE(a.prazo,'9999-12-31'), a.id DESC";
  res.json(db.prepare(sql).all(...params));
}

function buscar(req, res) {
  const atividade = atividadeBase(req.params.id);
  if (!podeVer(req.user, atividade)) return res.status(404).json({ error: "Atividade não encontrada" });
  res.json(atividade);
}

function criar(req, res) {
  const { titulo, descricao, status = "A Fazer", prioridade = "Média", responsavel_id, prazo } = req.body;
  if (req.user.perfil === "analise_gestao") return res.status(403).json({ error: "Este perfil acompanha e comenta atividades, mas não as cadastra" });
  const departamento = req.user.perfil === "admin" ? req.body.departamento : req.user.departamento;
  if (!titulo?.trim() || !departamento) return res.status(400).json({ error: "Título e departamento são obrigatórios" });
  if (!DEPARTAMENTOS.includes(departamento) || !STATUS_ATIVIDADE.includes(status) || !PRIORIDADES_ATIVIDADE.includes(prioridade)) return res.status(400).json({ error: "Departamento, status ou prioridade inválido" });
  if (responsavel_id) {
    const responsavel = db.prepare("SELECT id FROM usuarios WHERE id=? AND ativo=1 AND departamento=?").get(responsavel_id, departamento);
    if (!responsavel) return res.status(400).json({ error: "Responsável inválido para o departamento" });
  }
  db.exec("BEGIN");
  try {
    const result = db.prepare(`INSERT INTO atividades (departamento,titulo,descricao,status,prioridade,responsavel_id,criado_por,prazo) VALUES (?,?,?,?,?,?,?,?)`)
      .run(departamento, titulo.trim(), descricao?.trim() || null, status, prioridade, responsavel_id || null, req.user.id, prazo || null);
    const id = Number(result.lastInsertRowid);
    registrarHistorico(id, req.user.id, "criação", null, null, titulo.trim());
    const atividade = atividadeBase(id);
    notificar(atividade, req.user.id, "atividade_criada", "Nova atividade", `${req.user.nome} criou “${atividade.titulo}” em ${departamento}.`, true);
    db.exec("COMMIT");
    res.status(201).json(atividade);
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

function atualizar(req, res) {
  const atual = atividadeBase(req.params.id);
  if (!podeVer(req.user, atual)) return res.status(404).json({ error: "Atividade não encontrada" });
  if (!podeEditar(req.user, atual)) return res.status(403).json({ error: "Sem permissão para alterar esta atividade" });
  const novo = { ...atual };
  for (const campo of CAMPOS_EDITAVEIS) if (Object.hasOwn(req.body, campo)) novo[campo] = req.body[campo] === "" ? null : req.body[campo];
  if (!novo.titulo?.trim() || !STATUS_ATIVIDADE.includes(novo.status) || !PRIORIDADES_ATIVIDADE.includes(novo.prioridade)) return res.status(400).json({ error: "Título, status ou prioridade inválido" });
  if (novo.responsavel_id) {
    const responsavel = db.prepare("SELECT id FROM usuarios WHERE id=? AND ativo=1 AND departamento=?").get(novo.responsavel_id, atual.departamento);
    if (!responsavel) return res.status(400).json({ error: "Responsável inválido para o departamento" });
  }
  const alterados = CAMPOS_EDITAVEIS.filter((c) => String(atual[c] ?? "") !== String(novo[c] ?? ""));
  if (!alterados.length) return res.json(atual);
  db.exec("BEGIN");
  try {
    db.prepare(`UPDATE atividades SET titulo=?,descricao=?,status=?,prioridade=?,responsavel_id=?,prazo=?,atualizado_por=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?`)
      .run(novo.titulo.trim(), novo.descricao, novo.status, novo.prioridade, novo.responsavel_id, novo.prazo, req.user.id, atual.id);
    alterados.forEach((campo) => registrarHistorico(atual.id, req.user.id, `alteração de ${campo}`, campo, atual[campo], novo[campo]));
    const atividade = atividadeBase(atual.id);
    const tipo = alterados.includes("status") ? (novo.status === "Concluído" ? "atividade_concluida" : "status_alterado") : alterados.includes("responsavel_id") ? "responsavel_alterado" : "atividade_atualizada";
    notificar(atividade, req.user.id, tipo, "Atividade atualizada", `${req.user.nome} atualizou “${atividade.titulo}”.`);
    db.exec("COMMIT");
    res.json(atividade);
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

function remover(req, res) {
  const atividade = atividadeBase(req.params.id);
  if (!atividade) return res.status(404).json({ error: "Atividade não encontrada" });
  if (req.user.perfil !== "admin") return res.status(403).json({ error: "Somente administradores podem excluir atividades" });
  db.prepare("UPDATE atividades SET excluida_em=CURRENT_TIMESTAMP,atualizado_por=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id, atividade.id);
  registrarHistorico(atividade.id, req.user.id, "exclusão");
  res.json({ message: "Atividade excluída" });
}

function comentarios(req, res) {
  const atividade = atividadeBase(req.params.id);
  if (!podeVer(req.user, atividade)) return res.status(404).json({ error: "Atividade não encontrada" });
  res.json(db.prepare(`SELECT c.*,u.nome usuario_nome FROM atividades_comentarios c JOIN usuarios u ON u.id=c.usuario_id WHERE c.atividade_id=? ORDER BY c.criado_em,c.id`).all(atividade.id));
}

function comentar(req, res) {
  const atividade = atividadeBase(req.params.id);
  if (!podeVer(req.user, atividade)) return res.status(404).json({ error: "Atividade não encontrada" });
  const texto = req.body.comentario?.trim();
  if (!texto) return res.status(400).json({ error: "Comentário é obrigatório" });
  db.exec("BEGIN");
  try {
    const result = db.prepare("INSERT INTO atividades_comentarios (atividade_id,usuario_id,comentario) VALUES (?,?,?)").run(atividade.id, req.user.id, texto);
    registrarHistorico(atividade.id, req.user.id, "comentário");
    notificar(atividade, req.user.id, "comentario_criado", "Novo comentário", `${req.user.nome} comentou em “${atividade.titulo}”.`);
    const comentario = db.prepare(`SELECT c.*,u.nome usuario_nome FROM atividades_comentarios c JOIN usuarios u ON u.id=c.usuario_id WHERE c.id=?`).get(result.lastInsertRowid);
    db.exec("COMMIT");
    res.status(201).json(comentario);
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

function historico(req, res) {
  const atividade = atividadeBase(req.params.id);
  if (!podeVer(req.user, atividade)) return res.status(404).json({ error: "Atividade não encontrada" });
  res.json(db.prepare(`SELECT h.*,u.nome usuario_nome FROM atividades_historico h JOIN usuarios u ON u.id=h.usuario_id WHERE h.atividade_id=? ORDER BY h.criado_em DESC,h.id DESC`).all(atividade.id));
}

function responsaveis(req, res) {
  const departamento = ESTRATEGICOS.has(req.user.perfil) ? req.query.departamento : req.user.departamento;
  if (!departamento || !DEPARTAMENTOS.includes(departamento)) return res.status(400).json({ error: "Departamento inválido" });
  res.json(db.prepare("SELECT id,nome,departamento FROM usuarios WHERE ativo=1 AND departamento=? ORDER BY nome").all(departamento));
}

module.exports = { listar, buscar, criar, atualizar, remover, comentarios, comentar, historico, responsaveis };
