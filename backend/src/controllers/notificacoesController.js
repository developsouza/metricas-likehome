const { db } = require("../database");

function listar(req, res) {
  const limite = Math.min(Math.max(Number(req.query.limite) || 30, 1), 100);
  const rows = db.prepare("SELECT * FROM notificacoes WHERE usuario_id=? ORDER BY criado_em DESC,id DESC LIMIT ?").all(req.user.id, limite);
  const naoLidas = db.prepare("SELECT COUNT(*) total FROM notificacoes WHERE usuario_id=? AND lida=0").get(req.user.id).total;
  res.json({ notificacoes: rows, nao_lidas: naoLidas });
}

function marcarLida(req, res) {
  const result = db.prepare("UPDATE notificacoes SET lida=1 WHERE id=? AND usuario_id=?").run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Notificação não encontrada" });
  res.json({ message: "Notificação marcada como lida" });
}

function marcarTodas(req, res) {
  db.prepare("UPDATE notificacoes SET lida=1 WHERE usuario_id=? AND lida=0").run(req.user.id);
  res.json({ message: "Notificações marcadas como lidas" });
}

module.exports = { listar, marcarLida, marcarTodas };
