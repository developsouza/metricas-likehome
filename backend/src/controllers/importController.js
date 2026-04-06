const { db } = require("../database");

// ─── SCHEMAS ESPERADOS ────────────────────────────────────────────────────────

const SCHEMA_PORTFOLIO = {
    required: ["Empreendimento", "Unidade", "Status da unidade"],
    optional: [
        "Proprietario",
        "Data de Contrato",
        "Data de Ativação",
        "Data de Saida",
        "Comissao - Adm",
        "BPO",
        "Taxa - Enxoval",
        "Nome da Indicação",
        "Status - Pagamento Indicação",
        "Responsável",
        "Observação",
    ],
    description: "Portfólio comercial (empreendimentos, proprietários e unidades)",
};

const SCHEMA_LANCAMENTOS = {
    required: ["competencia", "departamento", "indicador", "valor_realizado"],
    optional: ["meta", "observacao"],
    description: "Lançamento de indicadores por departamento",
    exemplo: [
        "competencia;departamento;indicador;valor_realizado;meta;observacao",
        "2026-03;Comercial;Crescimento líquido de unidades;8;5;Mês de alta captação",
        "2026-03;Marketing;Leads qualificados de proprietários por mês;25;20;",
    ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseCSV(buffer) {
    const text = buffer
        .toString("utf-8")
        .replace(/^\uFEFF/, "")
        .trim();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };

    // Detecta separador (; ou ,) pelo maior número de ocorrências nas primeiras linhas
    const sample = lines.slice(0, Math.min(6, lines.length)).join("\n");
    const sep = (sample.match(/;/g) || []).length >= (sample.match(/,/g) || []).length ? ";" : ",";

    // Auto-detecta a linha de cabeçalho real — pula linhas de metadados do relatório
    // (ex.: "RELATÓRIO DETALHADO;;..." que aparecem nas primeiras linhas do CSV exportado do Excel)
    // Procura a primeira linha cuja primeira coluna seja uma chave conhecida do esquema
    const CHAVES_CABECALHO = ["empreendimento", "competencia", "competência"];
    let headerIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const primeiraCol = normHeader(lines[i].split(sep)[0]);
        if (CHAVES_CABECALHO.includes(primeiraCol)) {
            headerIdx = i;
            break;
        }
    }

    const headers = lines[headerIdx].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const rows = lines.slice(headerIdx + 1).map((line) => line.split(sep).map((v) => v.trim().replace(/^["']|["']$/g, "")));

    return { headers, rows, sep };
}

function parseDate(s) {
    if (!s || !s.trim() || s.trim() === "-") return null;
    const t = s.trim();
    // Formato ISO: AAAA-MM-DD (ex.: exportação Excel em alguns idiomas)
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    // Formato DD/MM/AAAA
    const parts = t.split("/");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const year = parseInt(y, 10);
    if (!y || y.length < 4 || year > 2100 || year < 1900) return null;
    return `${y.substring(0, 4)}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function mapStatus(s) {
    const t = (s || "").trim();
    if (t === "Ativo") return "Ativo";
    if (t === "Inativo") return "Baixa";
    if (t === "Em Integração") return "Integracao";
    if (t.toLowerCase().startsWith("pendente")) return "Fechamento";
    return "Ativo";
}

function parseComissao(s) {
    if (!s || !s.trim()) return null;
    const v = parseFloat(s.replace("%", "").trim());
    return isNaN(v) ? null : v;
}

// Normaliza cabeçalho CSV para match flexível (remove espaços extras, acento, case)
function normHeader(s) {
    return (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function findCol(headers, candidates) {
    for (const c of candidates) {
        const idx = headers.findIndex((h) => normHeader(h) === normHeader(c));
        if (idx >= 0) return idx;
    }
    return -1;
}

// ─── VALIDAR CSV ──────────────────────────────────────────────────────────────

function validar(req, res) {
    if (!req.file) return res.status(400).json({ error: "Arquivo CSV não enviado" });

    const tipo = req.body.tipo; // "portfolio" | "lancamentos"
    const { headers } = parseCSV(req.file.buffer);

    if (!headers.length) return res.status(400).json({ error: "CSV vazio ou sem cabeçalho" });

    const schema = tipo === "lancamentos" ? SCHEMA_LANCAMENTOS : SCHEMA_PORTFOLIO;

    const faltando = schema.required.filter((col) => findCol(headers, [col]) < 0);
    const encontradas = schema.required.filter((col) => findCol(headers, [col]) >= 0);
    const opcionaisEncontradas = (schema.optional || []).filter((col) => findCol(headers, [col]) >= 0);

    return res.json({
        valido: faltando.length === 0,
        tipo,
        descricao: schema.descricao || schema.description,
        headers_encontrados: headers,
        colunas_obrigatorias: { encontradas, faltando },
        colunas_opcionais_encontradas: opcionaisEncontradas,
        ...(faltando.length > 0 && {
            mensagem_erro: `${faltando.length} coluna(s) obrigatória(s) não encontrada(s): ${faltando.join(", ")}. Verifique o cabeçalho do CSV e entre em contato com o desenvolvimento para ajustar o mapeamento se necessário.`,
            exemplo: schema.exemplo || null,
        }),
    });
}

// ─── IMPORTAR PORTFÓLIO (empreendimentos + proprietários + unidades) ──────────

function importarPortfolio(file, usuarioId) {
    const { headers, rows } = parseCSV(file.buffer);

    // Mapeamento de colunas (aceita variações de nome)
    const col = {
        emp: findCol(headers, ["Empreendimento"]),
        unid: findCol(headers, ["Unidade"]),
        prop: findCol(headers, ["Proprietario", "Proprietário"]),
        dataContrato: findCol(headers, ["Data de Contrato", "DataContrato", "Data Entrada", "Data de Entrada"]),
        dataAtiv: findCol(headers, ["Data de Ativação", "Data de Ativacao", "DataAtivacao"]),
        dataSaida: findCol(headers, ["Data de Saida", "Data de Saída", "DataSaida", "Data Saída", "Data Saida"]),
        status: findCol(headers, ["Status da unidade", "Status"]),
        comissao: findCol(headers, ["Comissao - Adm", "Comissao-Adm", "Comissão - Adm", "Comissao"]),
        bpo: findCol(headers, ["BPO"]),
        enxoval: findCol(headers, ["Taxa - Enxoval", "Taxa-Enxoval", "Taxa Enxoval"]),
        nomeInd: findCol(headers, ["Nome da Indicação", "Nome da Indicacao"]),
        statusInd: findCol(headers, ["Status - Pagamento Indicação", "Status-Pagamento Indicação", "Status Pagamento Indicacao"]),
        resp: findCol(headers, ["Responsável", "Responsavel"]),
        obs: findCol(headers, ["Observação", "Observacao"]),
    };

    // Resolver duplicatas do CSV: quando a mesma unidade aparece mais de uma vez
    // (ex.: unidade que saiu e voltou), mantém o contrato de maior prioridade
    const STATUS_PRIORITY_IMPORT = { Ativo: 5, Integracao: 4, Fechamento: 3, Reuniao: 2, Prospeccao: 1, Baixa: 0 };
    const bestRowsMap = new Map(); // "empNome|numero" → row de maior prioridade
    for (const r of rows) {
        const empNome = col.emp >= 0 ? (r[col.emp] || "").trim() : "";
        const unidNum = col.unid >= 0 ? (r[col.unid] || "").trim() : "";
        if (!empNome || !unidNum) continue;
        const statusStr = col.status >= 0 ? r[col.status] || "Ativo" : "Ativo";
        const status = mapStatus(statusStr);
        const key = `${empNome}|${unidNum}`;
        if (!bestRowsMap.has(key)) {
            bestRowsMap.set(key, r);
        } else {
            const prev = bestRowsMap.get(key);
            const prevStatus = mapStatus(col.status >= 0 ? prev[col.status] || "Ativo" : "Ativo");
            const prevPrio = STATUS_PRIORITY_IMPORT[prevStatus] ?? -1;
            const newPrio = STATUS_PRIORITY_IMPORT[status] ?? -1;
            if (newPrio > prevPrio) {
                bestRowsMap.set(key, r);
            } else if (newPrio === prevPrio) {
                // Prefere contrato mais recente: data_fechamento tem prioridade sobre data_ativacao
                const prevDate = (col.dataContrato >= 0 ? prev[col.dataContrato] : "") || (col.dataAtiv >= 0 ? prev[col.dataAtiv] : "") || "";
                const newDate = (col.dataContrato >= 0 ? r[col.dataContrato] : "") || (col.dataAtiv >= 0 ? r[col.dataAtiv] : "") || "";
                if (newDate > prevDate) bestRowsMap.set(key, r);
            }
        }
    }
    const rowsUnicos = [...bestRowsMap.values()];

    // Carregar dados existentes em memória para evitar duplicatas
    const respMap = {};
    db.prepare("SELECT id, nome FROM usuarios")
        .all()
        .forEach((u) => {
            respMap[u.nome.trim()] = u.id;
            respMap[u.nome.split(" ")[0].trim()] = u.id;
        });

    const empMap = new Map();
    db.prepare("SELECT id, nome FROM empreendimentos")
        .all()
        .forEach((e) => empMap.set(e.nome.trim(), e.id));

    const propMap = new Map();
    db.prepare("SELECT id, nome FROM proprietarios")
        .all()
        .forEach((p) => propMap.set(p.nome.trim(), p.id));

    // Mapa de unidades existentes: "empId|numero" → objeto com id e campos para comparar
    const unidMap = new Map();
    db.prepare(
        `
        SELECT id, empreendimento_id, numero, status, proprietario_id, responsavel_id, observacoes,
               data_fechamento, data_ativacao, data_baixa, comissao_adm, bpo, taxa_enxoval,
               nome_indicacao, status_pagamento_indicacao
        FROM unidades
    `,
    )
        .all()
        .forEach((u) => unidMap.set(`${u.empreendimento_id}|${u.numero}`, u));

    // Statements preparados fora do loop
    const stmtInsertEmp = db.prepare(`INSERT INTO empreendimentos (nome, cidade, estado) VALUES (?, ?, ?)`);
    const stmtInsertProp = db.prepare(`INSERT INTO proprietarios (nome) VALUES (?)`);
    const stmtInsertUnid = db.prepare(`
        INSERT INTO unidades (
            empreendimento_id, numero, status,
            proprietario_id, responsavel_id, observacoes,
            data_fechamento, data_ativacao, data_baixa,
            comissao_adm, bpo, taxa_enxoval,
            nome_indicacao, status_pagamento_indicacao, atualizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const stmtInsertHist = db.prepare(`
        INSERT INTO historico_status_unidade (unidade_id, status_novo, data_mudanca, usuario_id)
        VALUES (?, ?, date('now'), ?)
    `);
    const stmtUpdateUnid = db.prepare(`
        UPDATE unidades SET
            status = ?, proprietario_id = ?, responsavel_id = ?, observacoes = ?,
            data_fechamento = ?, data_ativacao = ?, data_baixa = ?,
            comissao_adm = ?, bpo = ?, taxa_enxoval = ?,
            nome_indicacao = ?, status_pagamento_indicacao = ?,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    const result = { empreendimentos: 0, proprietarios: 0, unidades: 0, atualizadas: 0, ignoradas: 0, erros: [] };

    db.exec("BEGIN");
    try {
        for (let i = 0; i < rowsUnicos.length; i++) {
            const r = rowsUnicos[i];
            const empNome = col.emp >= 0 ? (r[col.emp] || "").trim() : "";
            const unidNum = col.unid >= 0 ? (r[col.unid] || "").trim() : "";

            if (!empNome || !unidNum) continue;

            // Empreendimento — cria se não existir (verificado pelo mapa em memória)
            if (!empMap.has(empNome)) {
                const res = stmtInsertEmp.run(empNome, "João Pessoa", "PB");
                empMap.set(empNome, res.lastInsertRowid);
                result.empreendimentos++;
            }

            const empId = empMap.get(empNome);
            if (!empId) {
                result.erros.push(`Linha ${i + 2}: empreendimento '${empNome}' não pôde ser criado`);
                continue;
            }

            // Proprietário — cria se não existir
            const propNome = col.prop >= 0 ? (r[col.prop] || "").trim() : "";
            let propId = null;
            if (propNome && propNome !== "-") {
                if (!propMap.has(propNome)) {
                    const res = stmtInsertProp.run(propNome);
                    propMap.set(propNome, res.lastInsertRowid);
                    result.proprietarios++;
                }
                propId = propMap.get(propNome) || null;
            }

            // Responsável
            const respNome = col.resp >= 0 ? (r[col.resp] || "").trim() : "";
            const respId = respNome ? respMap[respNome] || null : null;

            const statusStr = col.status >= 0 ? r[col.status] || "Ativo" : "Ativo";
            const dataContrato = col.dataContrato >= 0 ? parseDate(r[col.dataContrato]) : null;
            const dataAtiv = col.dataAtiv >= 0 ? parseDate(r[col.dataAtiv]) : null;
            const dataSaida = col.dataSaida >= 0 ? parseDate(r[col.dataSaida]) : null;
            const comissao = col.comissao >= 0 ? parseComissao(r[col.comissao]) : null;
            const obs = col.obs >= 0 ? r[col.obs] || null : null;
            const bpoVal = col.bpo >= 0 ? r[col.bpo] || null : null;
            const enxovalVal = col.enxoval >= 0 ? r[col.enxoval] || null : null;
            const nomeIndVal = col.nomeInd >= 0 ? r[col.nomeInd] || null : null;
            const statusIndVal = col.statusInd >= 0 ? r[col.statusInd] || null : null;

            // Verificar se unidade já existe (empId + numero)
            const chaveUnid = `${empId}|${unidNum}`;
            if (unidMap.has(chaveUnid)) {
                const existente = unidMap.get(chaveUnid);
                // Compara cada campo: só atualiza se houver diferença real
                const houveMudanca =
                    existente.status !== mapStatus(statusStr) ||
                    (existente.proprietario_id ?? null) !== (propId ?? null) ||
                    (existente.responsavel_id ?? null) !== (respId ?? null) ||
                    (existente.observacoes ?? null) !== (obs ?? null) ||
                    (existente.data_fechamento ?? null) !== (dataContrato ?? null) ||
                    (existente.data_ativacao ?? null) !== (dataAtiv ?? null) ||
                    (existente.data_baixa ?? null) !== (dataSaida ?? null) ||
                    (existente.comissao_adm ?? null) !== (comissao ?? null) ||
                    (existente.bpo ?? null) !== (bpoVal ?? null) ||
                    (existente.taxa_enxoval ?? null) !== (enxovalVal ?? null) ||
                    (existente.nome_indicacao ?? null) !== (nomeIndVal ?? null) ||
                    (existente.status_pagamento_indicacao ?? null) !== (statusIndVal ?? null);

                if (houveMudanca) {
                    stmtUpdateUnid.run(
                        mapStatus(statusStr),
                        propId,
                        respId,
                        obs,
                        dataContrato,
                        dataAtiv,
                        dataSaida,
                        comissao,
                        bpoVal,
                        enxovalVal,
                        nomeIndVal,
                        statusIndVal,
                        existente.id,
                    );
                    result.atualizadas++;
                } else {
                    result.ignoradas++;
                }
                continue;
            }

            // Inserir nova unidade
            const res = stmtInsertUnid.run(
                empId,
                unidNum,
                mapStatus(statusStr),
                propId,
                respId,
                obs,
                dataContrato,
                dataAtiv,
                dataSaida,
                comissao,
                bpoVal,
                enxovalVal,
                nomeIndVal,
                statusIndVal,
            );

            unidMap.set(chaveUnid, { id: res.lastInsertRowid });
            stmtInsertHist.run(res.lastInsertRowid, mapStatus(statusStr), usuarioId);
            result.unidades++;
        }
        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }

    return result;
}

// ─── IMPORTAR LANÇAMENTOS ─────────────────────────────────────────────────────

function importarLancamentos(file, usuarioId) {
    const { headers, rows } = parseCSV(file.buffer);

    const col = {
        competencia: findCol(headers, ["competencia", "competência"]),
        departamento: findCol(headers, ["departamento"]),
        indicador: findCol(headers, ["indicador"]),
        valor: findCol(headers, ["valor_realizado", "valor realizado", "realizado"]),
        meta: findCol(headers, ["meta"]),
        obs: findCol(headers, ["observacao", "observação", "obs"]),
    };

    const DEPTOS_VALIDOS = ["Marketing", "Comercial", "Atendimento", "Precificacao", "Financeiro"];
    const result = { inseridos: 0, atualizados: 0, ignorados: 0, erros: [] };

    const insertLanc = db.prepare(`
        INSERT INTO lancamentos_indicadores (indicador_id, competencia, valor_realizado, meta, observacao, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(indicador_id, competencia) DO UPDATE SET
            valor_realizado = excluded.valor_realizado,
            meta = excluded.meta,
            observacao = excluded.observacao,
            usuario_id = excluded.usuario_id,
            lancado_em = CURRENT_TIMESTAMP
    `);

    db.exec("BEGIN");
    try {
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const competencia = (r[col.competencia] || "").trim();
            const departamento = (r[col.departamento] || "").trim();
            const nomeIndicador = (r[col.indicador] || "").trim();
            const valorStr = (r[col.valor] || "").trim();

            if (!competencia || !departamento || !nomeIndicador || !valorStr) {
                result.ignorados++;
                continue;
            }

            if (!/^\d{4}-\d{2}$/.test(competencia)) {
                result.erros.push(`Linha ${i + 2}: competência '${competencia}' inválida (use AAAA-MM)`);
                continue;
            }

            if (!DEPTOS_VALIDOS.includes(departamento)) {
                result.erros.push(`Linha ${i + 2}: departamento '${departamento}' inválido. Use: ${DEPTOS_VALIDOS.join(", ")}`);
                continue;
            }

            const valor = parseFloat(valorStr);
            if (isNaN(valor)) {
                result.erros.push(`Linha ${i + 2}: valor_realizado '${valorStr}' não é um número`);
                continue;
            }

            const ind = db.prepare("SELECT id FROM indicadores WHERE departamento = ? AND nome = ? AND ativo = 1").get(departamento, nomeIndicador);

            if (!ind) {
                result.erros.push(`Linha ${i + 2}: indicador '${nomeIndicador}' não encontrado no departamento '${departamento}'`);
                continue;
            }

            const meta = col.meta >= 0 ? parseFloat(r[col.meta]) || null : null;
            const obs = col.obs >= 0 ? r[col.obs] || null : null;

            const existing = db.prepare("SELECT id FROM lancamentos_indicadores WHERE indicador_id = ? AND competencia = ?").get(ind.id, competencia);

            insertLanc.run(ind.id, competencia, valor, meta, obs, usuarioId);
            existing ? result.atualizados++ : result.inseridos++;
        }
        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }

    return result;
}

// ─── ENDPOINT PRINCIPAL ───────────────────────────────────────────────────────

function importar(req, res) {
    if (!req.file) return res.status(400).json({ error: "Arquivo CSV não enviado" });

    const tipo = (req.body.tipo || "").trim();
    if (!["portfolio", "lancamentos"].includes(tipo)) {
        return res.status(400).json({ error: "Tipo inválido. Use 'portfolio' ou 'lancamentos'" });
    }

    const { headers } = parseCSV(req.file.buffer);
    if (!headers.length) return res.status(400).json({ error: "CSV vazio ou sem cabeçalho" });

    // Validar colunas obrigatórias antes de importar
    const schema = tipo === "lancamentos" ? SCHEMA_LANCAMENTOS : SCHEMA_PORTFOLIO;
    const faltando = schema.required.filter((col) => findCol(headers, [col]) < 0);
    if (faltando.length > 0) {
        return res.status(422).json({
            error: "Colunas obrigatórias ausentes no CSV",
            colunas_faltando: faltando,
            colunas_encontradas: headers,
            mensagem: `O CSV enviado não contém as colunas obrigatórias: ${faltando.join(", ")}. Verifique o arquivo ou entre em contato com o desenvolvimento.`,
            ...(schema.exemplo && { exemplo_formato: schema.exemplo }),
        });
    }

    try {
        let resultado;
        if (tipo === "portfolio") {
            resultado = importarPortfolio(req.file, req.user.id);
        } else {
            resultado = importarLancamentos(req.file, req.user.id);
        }
        return res.json({ sucesso: true, tipo, ...resultado });
    } catch (e) {
        console.error("Erro na importação:", e);
        return res.status(500).json({ error: "Erro interno durante a importação", detalhe: e.message });
    }
}

// ─── LISTAR INDICADORES (para gerar modelo CSV de lançamentos) ────────────────

function modeloLancamentos(req, res) {
    const inds = db
        .prepare("SELECT departamento, nome, unidade_medida, meta_padrao FROM indicadores WHERE ativo = 1 ORDER BY departamento, nome")
        .all();

    const competencia = new Date().toISOString().substring(0, 7);
    const linhas = [
        "competencia;departamento;indicador;valor_realizado;meta;observacao",
        ...inds.map((i) => `${competencia};${i.departamento};${i.nome};;${i.meta_padrao || ""};`),
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="modelo-lancamentos-${competencia}.csv"`);
    res.send("\uFEFF" + linhas.join("\r\n")); // BOM para Excel abrir com acentos
}

module.exports = { validar, importar, modeloLancamentos };
