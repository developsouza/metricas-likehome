const { db } = require("../database");

function listar(req, res) {
    const { status, empreendimento_id, responsavel_id } = req.query;
    let sql = `
    SELECT u.*, 
      e.nome as empreendimento_nome,
      p.nome as proprietario_nome, p.telefone as proprietario_telefone,
      us.nome as responsavel_nome
    FROM unidades u
    LEFT JOIN empreendimentos e ON e.id = u.empreendimento_id
    LEFT JOIN proprietarios p ON p.id = u.proprietario_id
    LEFT JOIN usuarios us ON us.id = u.responsavel_id
    WHERE 1=1
  `;
    const params = [];
    if (status) {
        sql += " AND u.status = ?";
        params.push(status);
    }
    if (empreendimento_id) {
        sql += " AND u.empreendimento_id = ?";
        params.push(empreendimento_id);
    }
    if (responsavel_id) {
        sql += " AND u.responsavel_id = ?";
        params.push(responsavel_id);
    }
    sql += " ORDER BY e.nome, u.numero";

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
}

function buscar(req, res) {
    const row = db
        .prepare(
            `
    SELECT u.*, e.nome as empreendimento_nome, p.nome as proprietario_nome, us.nome as responsavel_nome
    FROM unidades u
    LEFT JOIN empreendimentos e ON e.id = u.empreendimento_id
    LEFT JOIN proprietarios p ON p.id = u.proprietario_id
    LEFT JOIN usuarios us ON us.id = u.responsavel_id
    WHERE u.id = ?
  `,
        )
        .get(req.params.id);
    if (!row) return res.status(404).json({ error: "Unidade não encontrada" });

    const historico = db
        .prepare(
            `
    SELECT h.*, us.nome as usuario_nome FROM historico_status_unidade h
    LEFT JOIN usuarios us ON us.id = h.usuario_id
    WHERE h.unidade_id = ? ORDER BY h.criado_em DESC
  `,
        )
        .all(req.params.id);

    res.json({ ...row, historico });
}

function criar(req, res) {
    const {
        empreendimento_id,
        numero,
        tipo,
        status,
        proprietario_id,
        responsavel_id,
        observacoes,
        data_prospeccao,
        data_reuniao,
        data_fechamento,
        data_integracao,
        data_ativacao,
        data_baixa,
        comissao_adm,
        bpo,
        taxa_enxoval,
        nome_indicacao,
        status_pagamento_indicacao,
    } = req.body;

    if (!empreendimento_id || !numero) return res.status(400).json({ error: "Empreendimento e número são obrigatórios" });

    const result = db
        .prepare(
            `
    INSERT INTO unidades (empreendimento_id, numero, tipo, status, proprietario_id, responsavel_id, observacoes,
      data_prospeccao, data_reuniao, data_fechamento, data_integracao, data_ativacao, data_baixa,
      comissao_adm, bpo, taxa_enxoval, nome_indicacao, status_pagamento_indicacao, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `,
        )
        .run(
            empreendimento_id,
            numero,
            tipo,
            status || "Prospeccao",
            proprietario_id || null,
            responsavel_id || null,
            observacoes || null,
            data_prospeccao || null,
            data_reuniao || null,
            data_fechamento || null,
            data_integracao || null,
            data_ativacao || null,
            data_baixa || null,
            comissao_adm != null ? Number(comissao_adm) : null,
            bpo || null,
            taxa_enxoval || null,
            nome_indicacao || null,
            status_pagamento_indicacao || null,
        );

    // Registra histórico
    db.prepare(`INSERT INTO historico_status_unidade (unidade_id, status_novo, data_mudanca, usuario_id) VALUES (?, ?, date('now'), ?)`).run(
        result.lastInsertRowid,
        status || "Prospeccao",
        req.user.id,
    );

    res.status(201).json({ id: result.lastInsertRowid });
}

function atualizar(req, res) {
    const unidade = db.prepare("SELECT * FROM unidades WHERE id = ?").get(req.params.id);
    if (!unidade) return res.status(404).json({ error: "Unidade não encontrada" });

    const {
        empreendimento_id,
        numero,
        tipo,
        status,
        proprietario_id,
        responsavel_id,
        observacoes,
        data_prospeccao,
        data_reuniao,
        data_fechamento,
        data_integracao,
        data_ativacao,
        data_baixa,
        comissao_adm,
        bpo,
        taxa_enxoval,
        nome_indicacao,
        status_pagamento_indicacao,
    } = req.body;

    const novoStatus = status || unidade.status;
    const statusMudou = novoStatus !== unidade.status;

    // Converte string vazia para null nos campos opcionais de FK e datas
    const toNull = (v, fallback) => (v !== undefined ? (v === "" ? null : v) : fallback);
    const toNullNum = (v, fallback) => (v !== undefined ? (v === "" || v === null ? null : Number(v)) : fallback);

    db.prepare(
        `
    UPDATE unidades SET empreendimento_id=?, numero=?, tipo=?, status=?, proprietario_id=?, responsavel_id=?, observacoes=?,
      data_prospeccao=?, data_reuniao=?, data_fechamento=?, data_integracao=?, data_ativacao=?, data_baixa=?,
      comissao_adm=?, bpo=?, taxa_enxoval=?, nome_indicacao=?, status_pagamento_indicacao=?,
      atualizado_em=CURRENT_TIMESTAMP
    WHERE id=?
  `,
    ).run(
        empreendimento_id || unidade.empreendimento_id,
        numero || unidade.numero,
        toNull(tipo, unidade.tipo),
        novoStatus,
        toNull(proprietario_id, unidade.proprietario_id),
        toNull(responsavel_id, unidade.responsavel_id),
        toNull(observacoes, unidade.observacoes),
        toNull(data_prospeccao, unidade.data_prospeccao),
        toNull(data_reuniao, unidade.data_reuniao),
        toNull(data_fechamento, unidade.data_fechamento),
        toNull(data_integracao, unidade.data_integracao),
        toNull(data_ativacao, unidade.data_ativacao),
        toNull(data_baixa, unidade.data_baixa),
        toNullNum(comissao_adm, unidade.comissao_adm),
        toNull(bpo, unidade.bpo),
        toNull(taxa_enxoval, unidade.taxa_enxoval),
        toNull(nome_indicacao, unidade.nome_indicacao),
        toNull(status_pagamento_indicacao, unidade.status_pagamento_indicacao),
        req.params.id,
    );

    if (statusMudou) {
        db.prepare(
            `INSERT INTO historico_status_unidade (unidade_id, status_anterior, status_novo, data_mudanca, usuario_id) VALUES (?, ?, ?, date('now'), ?)`,
        ).run(req.params.id, unidade.status, novoStatus, req.user.id);
    }

    res.json({ message: "Unidade atualizada" });
}

function remover(req, res) {
    db.prepare("DELETE FROM unidades WHERE id = ?").run(req.params.id);
    res.json({ message: "Unidade removida" });
}

function resumoPipeline(req, res) {
    const stats = db
        .prepare(
            `
    SELECT status, COUNT(*) as total FROM unidades GROUP BY status
  `,
        )
        .all();
    res.json(stats);
}

module.exports = { listar, buscar, criar, atualizar, remover, resumoPipeline };
