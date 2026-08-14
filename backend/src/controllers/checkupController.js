const { db } = require("../database");

const SETORES = ["Precificação", "Tecnologia", "Marketing", "Atendimento", "Manutenção", "Financeiro", "Proprietário"];
const DEPARTAMENTO_SETOR = { Precificacao: "Precificação", Marketing: "Marketing", Atendimento: "Atendimento", Financeiro: "Financeiro", Comercial: "Proprietário" };
const GESTAO = new Set(["admin", "analise_gestao"]);

function classificacao(saude) {
    if (saude == null) return "Pendente";
    if (saude >= 90) return "Excelente";
    if (saude >= 75) return "Saudável";
    if (saude >= 60) return "Atenção";
    if (saude >= 40) return "Crítico";
    return "Urgente";
}

function podeResponder(user, setor) {
    return GESTAO.has(user.perfil) || DEPARTAMENTO_SETOR[user.departamento] === setor || (user.departamento === "Atendimento" && setor === "Manutenção");
}

function diagnosticoBase(id) {
    return db.prepare(`SELECT d.*, u.numero unidade_numero, e.nome empreendimento_nome, p.nome proprietario_nome,
        r.nome responsavel_geral_nome, c.nome criado_por_nome
      FROM checkup_diagnosticos d JOIN unidades u ON u.id=d.unidade_id
      JOIN empreendimentos e ON e.id=u.empreendimento_id LEFT JOIN proprietarios p ON p.id=u.proprietario_id
      LEFT JOIN usuarios r ON r.id=d.responsavel_geral_id JOIN usuarios c ON c.id=d.criado_por WHERE d.id=?`).get(id);
}

function atualizarConsolidado(id) {
    const setores = db.prepare("SELECT saude,status FROM checkup_setores WHERE diagnostico_id=?").all(id);
    const concluidos = setores.filter((s) => s.status === "Concluído" && s.saude != null);
    const preenchimento = Math.round((setores.filter((s) => s.status === "Concluído").length / SETORES.length) * 100);
    const saude = concluidos.length ? Math.round((concluidos.reduce((total, s) => total + Number(s.saude), 0) / concluidos.length) * 10) / 10 : null;
    db.prepare("UPDATE checkup_diagnosticos SET saude_geral=?,preenchimento=?,classificacao=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?")
        .run(saude, preenchimento, classificacao(saude), id);
}

function auditar(id, setor, userId, acao, anterior, novo) {
    db.prepare("INSERT INTO checkup_auditoria (diagnostico_id,setor,usuario_id,acao,valor_anterior,valor_novo) VALUES (?,?,?,?,?,?)")
        .run(id, setor || null, userId, acao, anterior == null ? null : String(anterior), novo == null ? null : String(novo));
}

function listar(req, res) {
    const periodo = req.query.periodo || new Date().toISOString().slice(0, 7);
    const busca = req.query.busca?.trim();
    let sql = `SELECT u.id unidade_id,u.numero unidade_numero,u.status unidade_status,e.nome empreendimento_nome,p.nome proprietario_nome,
      d.id diagnostico_id,d.periodo,d.status,d.saude_geral,d.preenchimento,d.classificacao,d.data_analise,r.nome responsavel_geral_nome,
      (SELECT COUNT(*) FROM checkup_planos_acao pa WHERE pa.diagnostico_id=d.id AND pa.status NOT IN ('Resolvido','Cancelado')) acoes_abertas
      FROM unidades u JOIN empreendimentos e ON e.id=u.empreendimento_id LEFT JOIN proprietarios p ON p.id=u.proprietario_id
      LEFT JOIN checkup_diagnosticos d ON d.unidade_id=u.id AND d.periodo=? LEFT JOIN usuarios r ON r.id=d.responsavel_geral_id WHERE 1=1`;
    const params = [periodo];
    if (busca) { sql += " AND (e.nome LIKE ? OR u.numero LIKE ? OR p.nome LIKE ?)"; const termo = `%${busca}%`; params.push(termo, termo, termo); }
    sql += " ORDER BY e.nome,u.numero";
    res.json(db.prepare(sql).all(...params));
}

function responsaveis(_req, res) {
    res.json(db.prepare("SELECT id,nome,departamento,perfil FROM usuarios WHERE ativo=1 ORDER BY nome").all());
}

function criar(req, res) {
    const { unidade_id, periodo, responsavel_geral_id, data_analise } = req.body;
    if (!unidade_id || !/^\d{4}-\d{2}$/.test(periodo || "")) return res.status(400).json({ error: "Unidade e período são obrigatórios." });
    const existente = db.prepare("SELECT id FROM checkup_diagnosticos WHERE unidade_id=? AND periodo=?").get(unidade_id, periodo);
    if (existente) return res.json({ id: existente.id });
    db.exec("BEGIN");
    try {
        const result = db.prepare("INSERT INTO checkup_diagnosticos (unidade_id,periodo,responsavel_geral_id,data_analise,criado_por,classificacao) VALUES (?,?,?,?,?,'Pendente')")
            .run(unidade_id, periodo, responsavel_geral_id || req.user.id, data_analise || new Date().toISOString().slice(0, 10), req.user.id);
        const id = Number(result.lastInsertRowid);
        const inserir = db.prepare("INSERT INTO checkup_setores (diagnostico_id,setor) VALUES (?,?)");
        SETORES.forEach((setor) => inserir.run(id, setor));
        auditar(id, null, req.user.id, "Diagnóstico criado", null, periodo);
        db.exec("COMMIT"); res.status(201).json({ id });
    } catch (error) { db.exec("ROLLBACK"); throw error; }
}

function buscar(req, res) {
    const diagnostico = diagnosticoBase(req.params.id);
    if (!diagnostico) return res.status(404).json({ error: "Checkup não encontrado." });
    const setores = db.prepare(`SELECT s.*,u.nome responsavel_nome FROM checkup_setores s LEFT JOIN usuarios u ON u.id=s.responsavel_id WHERE s.diagnostico_id=? ORDER BY s.id`).all(diagnostico.id)
        .map((s) => ({ ...s, respostas: JSON.parse(s.respostas_json || "{}"), pode_responder: podeResponder(req.user, s.setor) && diagnostico.status !== "Concluído" }));
    const acoes = db.prepare(`SELECT a.*,u.nome responsavel_nome,c.nome criado_por_nome FROM checkup_planos_acao a LEFT JOIN usuarios u ON u.id=a.responsavel_id JOIN usuarios c ON c.id=a.criado_por WHERE a.diagnostico_id=? ORDER BY CASE a.prioridade WHEN 'Crítica' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Média' THEN 3 ELSE 4 END,a.prazo`).all(diagnostico.id);
    const historico = db.prepare("SELECT h.*,u.nome usuario_nome FROM checkup_auditoria h JOIN usuarios u ON u.id=h.usuario_id WHERE h.diagnostico_id=? ORDER BY h.id DESC").all(diagnostico.id);
    const evolucao = db.prepare("SELECT periodo,saude_geral,preenchimento,classificacao FROM checkup_historico WHERE unidade_id=? ORDER BY periodo").all(diagnostico.unidade_id);
    res.json({ ...diagnostico, setores, acoes, historico, evolucao, pode_gerenciar: GESTAO.has(req.user.perfil) });
}

function salvarSetor(req, res) {
    const diagnostico = diagnosticoBase(req.params.id); const setor = decodeURIComponent(req.params.setor);
    if (!diagnostico || !SETORES.includes(setor)) return res.status(404).json({ error: "Diagnóstico ou setor não encontrado." });
    if (diagnostico.status === "Concluído") return res.status(409).json({ error: "O diagnóstico concluído não pode ser alterado." });
    if (!podeResponder(req.user, setor)) return res.status(403).json({ error: "Seu perfil não pode responder por este setor." });
    const atual = db.prepare("SELECT * FROM checkup_setores WHERE diagnostico_id=? AND setor=?").get(diagnostico.id, setor);
    const respostas = JSON.stringify(req.body.respostas || {}); const saude = req.body.saude == null ? null : Math.max(0, Math.min(100, Number(req.body.saude) || 0));
    const status = req.body.concluir ? "Concluído" : Object.keys(req.body.respostas || {}).length ? "Em preenchimento" : "Pendente";
    db.prepare("UPDATE checkup_setores SET respostas_json=?,saude=?,status=?,responsavel_id=?,atualizado_em=CURRENT_TIMESTAMP WHERE diagnostico_id=? AND setor=?")
        .run(respostas, saude, status, req.user.id, diagnostico.id, setor);
    auditar(diagnostico.id, setor, req.user.id, status === "Concluído" ? "Setor concluído" : "Respostas atualizadas", atual.respostas_json, respostas);
    atualizarConsolidado(diagnostico.id); res.json({ message: "Setor salvo." });
}

function atualizar(req, res) {
    const atual = diagnosticoBase(req.params.id); if (!atual) return res.status(404).json({ error: "Checkup não encontrado." });
    if (!GESTAO.has(req.user.perfil) || atual.status === "Concluído") return res.status(403).json({ error: "Sem permissão para alterar o parecer." });
    const { status, responsavel_geral_id, parecer, recomendacoes, prioridades_proximo_periodo } = req.body;
    const novoStatus = ["Em elaboração","Aguardando setores","Em análise"].includes(status) ? status : atual.status;
    db.prepare("UPDATE checkup_diagnosticos SET status=?,responsavel_geral_id=?,parecer=?,recomendacoes=?,prioridades_proximo_periodo=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?")
        .run(novoStatus, responsavel_geral_id || null, parecer || null, recomendacoes || null, prioridades_proximo_periodo || null, atual.id);
    auditar(atual.id, null, req.user.id, "Dados gerais atualizados", atual.status, novoStatus); res.json({ message: "Checkup atualizado." });
}

function criarAcao(req, res) {
    const diagnostico = diagnosticoBase(req.params.id); if (!diagnostico) return res.status(404).json({ error: "Checkup não encontrado." });
    const b = req.body; if (!b.titulo?.trim() || !SETORES.includes(b.setor)) return res.status(400).json({ error: "Título e setor são obrigatórios." });
    const result = db.prepare(`INSERT INTO checkup_planos_acao (diagnostico_id,setor,titulo,descricao,problema_relacionado,prioridade,responsavel_id,prazo,status,observacoes,criado_por) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .run(diagnostico.id,b.setor,b.titulo.trim(),b.descricao || null,b.problema_relacionado || null,b.prioridade || "Média",b.responsavel_id || null,b.prazo || null,b.status || "Pendente",b.observacoes || null,req.user.id);
    auditar(diagnostico.id,b.setor,req.user.id,"Plano de ação criado",null,b.titulo); res.status(201).json({ id: Number(result.lastInsertRowid) });
}

function atualizarAcao(req, res) {
    const acao = db.prepare("SELECT * FROM checkup_planos_acao WHERE id=? AND diagnostico_id=?").get(req.params.acaoId, req.params.id);
    if (!acao) return res.status(404).json({ error: "Plano de ação não encontrado." }); const b = { ...acao, ...req.body };
    db.prepare("UPDATE checkup_planos_acao SET titulo=?,descricao=?,problema_relacionado=?,prioridade=?,responsavel_id=?,prazo=?,status=?,observacoes=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?")
        .run(b.titulo,b.descricao || null,b.problema_relacionado || null,b.prioridade,b.responsavel_id || null,b.prazo || null,b.status,b.observacoes || null,acao.id);
    auditar(acao.diagnostico_id,acao.setor,req.user.id,"Plano de ação atualizado",acao.status,b.status); res.json({ message: "Plano de ação atualizado." });
}

function concluir(req, res) {
    const diagnostico = diagnosticoBase(req.params.id); if (!diagnostico) return res.status(404).json({ error: "Checkup não encontrado." });
    if (!GESTAO.has(req.user.perfil)) return res.status(403).json({ error: "Somente gestão pode concluir o diagnóstico." });
    atualizarConsolidado(diagnostico.id); const atualizado = diagnosticoBase(diagnostico.id);
    if (atualizado.preenchimento < 100) return res.status(409).json({ error: "Todos os setores precisam estar concluídos." });
    const setores = db.prepare("SELECT setor,saude,status,respostas_json FROM checkup_setores WHERE diagnostico_id=?").all(diagnostico.id);
    const acoes = db.prepare("SELECT * FROM checkup_planos_acao WHERE diagnostico_id=?").all(diagnostico.id);
    const snapshot = JSON.stringify({ diagnostico: atualizado, setores, acoes });
    db.exec("BEGIN"); try {
        db.prepare("UPDATE checkup_diagnosticos SET status='Concluído',concluido_em=CURRENT_TIMESTAMP,atualizado_em=CURRENT_TIMESTAMP WHERE id=?").run(diagnostico.id);
        db.prepare("INSERT OR REPLACE INTO checkup_historico (diagnostico_id,unidade_id,periodo,saude_geral,preenchimento,classificacao,snapshot_json) VALUES (?,?,?,?,?,?,?)")
            .run(diagnostico.id,diagnostico.unidade_id,diagnostico.periodo,atualizado.saude_geral,atualizado.preenchimento,atualizado.classificacao,snapshot);
        auditar(diagnostico.id,null,req.user.id,"Diagnóstico concluído",diagnostico.status,"Concluído"); db.exec("COMMIT"); res.json({ message: "Diagnóstico concluído." });
    } catch (error) { db.exec("ROLLBACK"); throw error; }
}

module.exports = { listar, responsaveis, criar, buscar, salvarSetor, atualizar, criarAcao, atualizarAcao, concluir };
