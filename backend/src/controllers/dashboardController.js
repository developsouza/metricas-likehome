const { db } = require("../database");

// Calcula crescimento líquido usando exclusivamente as datas reais das unidades (vindas do CSV).
// O historico_status_unidade NÃO é usado aqui porque suas datas refletem quando o registro
// foi criado no sistema (import), não quando o evento comercial aconteceu de verdade.
function calcularCrescimentoLiquido(competencia) {
    // Captadas: unidades cuja data de ativação real caiu neste mês
    const captadas =
        db
            .prepare(
                `SELECT COUNT(DISTINCT id) AS n FROM unidades
       WHERE strftime('%Y-%m', data_ativacao) = ?`,
            )
            .get(competencia)?.n || 0;

    // Saídas: unidades com status Baixa cuja data de saída real foi neste mês
    const perdidas =
        db
            .prepare(
                `SELECT COUNT(DISTINCT id) AS n FROM unidades
       WHERE status = 'Baixa'
         AND strftime('%Y-%m', data_baixa) = ?`,
            )
            .get(competencia)?.n || 0;

    return { captadas, perdidas, liquido: captadas - perdidas };
}

// Retorna os últimos N meses até (e incluindo) a competencia dada
function getUltimosMeses(competencia, n) {
    const [ano, mes] = competencia.split("-").map(Number);
    const meses = [];
    for (let i = n - 1; i >= 0; i--) {
        let m = mes - i;
        let a = ano;
        while (m <= 0) {
            m += 12;
            a--;
        }
        meses.push(`${a}-${String(m).padStart(2, "0")}`);
    }
    return meses;
}

// Retorna todos os meses entre inicio e fim (inclusive)
function getMesesRange(inicio, fim) {
    const meses = [];
    let [a, m] = inicio.split("-").map(Number);
    const [aF, mF] = fim.split("-").map(Number);
    while (a < aF || (a === aF && m <= mF)) {
        meses.push(`${a}-${String(m).padStart(2, "0")}`);
        m++;
        if (m > 12) {
            m = 1;
            a++;
        }
    }
    return meses;
}

function dashboardAdmin(req, res) {
    const { competencia } = req.query;
    const comp = competencia || new Date().toISOString().substring(0, 7);

    // ── Pipeline por status ───────────────────────────────────────────────
    const pipeline = db.prepare(`SELECT status, COUNT(*) as total FROM unidades GROUP BY status`).all();
    const totalUnidades = pipeline.reduce((acc, p) => acc + p.total, 0);
    const unidadesAtivas = pipeline.find((p) => p.status === "Ativo")?.total || 0;
    const emIntegracao = pipeline.find((p) => p.status === "Integracao")?.total || 0;
    const emFechamento = pipeline.find((p) => p.status === "Fechamento")?.total || 0;

    // ── Crescimento líquido calculado a partir das datas reais ───────────
    const nomeCL = "Crescimento líquido de unidades";
    const clMes = calcularCrescimentoLiquido(comp);
    const metaCLRow = db.prepare(`SELECT meta_padrao FROM indicadores WHERE nome = ?`).get(nomeCL);
    const metaCL = metaCLRow?.meta_padrao || 5;
    const percentualCL = metaCL > 0 ? Math.round(((clMes.liquido * 100) / metaCL) * 10) / 10 : null;

    // ── Evolução de captações e baixas (últimos 12 meses) ────────────────
    //    Derivado de data_ativacao e data_baixa da tabela unidades
    const evolucaoCrescimento = getUltimosMeses(comp, 12).map((m) => {
        const cl = calcularCrescimentoLiquido(m);
        return { competencia: m, captadas: cl.captadas, perdidas: cl.perdidas, liquido: cl.liquido };
    });

    // ── Top empreendimentos por unidades ativas ───────────────────────────
    const empreendimentos = db
        .prepare(
            `SELECT e.nome,
              COUNT(u.id) as total_unidades,
              SUM(CASE WHEN u.status='Ativo'      THEN 1 ELSE 0 END) as ativas,
              SUM(CASE WHEN u.status='Integracao' THEN 1 ELSE 0 END) as integracao,
              SUM(CASE WHEN u.status='Fechamento' THEN 1 ELSE 0 END) as fechamento,
              SUM(CASE WHEN u.status='Baixa'      THEN 1 ELSE 0 END) as baixas
             FROM empreendimentos e
             LEFT JOIN unidades u ON u.empreendimento_id = e.id
             GROUP BY e.id
             ORDER BY ativas DESC`,
        )
        .all();

    // ── Distribuição BPO ─────────────────────────────────────────────────
    const distBPO = db
        .prepare(
            `SELECT COALESCE(bpo,'Não informado') as bpo, COUNT(*) as total
             FROM unidades WHERE status='Ativo'
             GROUP BY bpo ORDER BY total DESC`,
        )
        .all();

    // ── Distribuição % Administração ─────────────────────────────────────
    const distComissao = db
        .prepare(
            `SELECT COALESCE(CAST(comissao_adm AS TEXT),'Não informado') as comissao,
                    COUNT(*) as total
             FROM unidades WHERE status='Ativo'
             GROUP BY comissao_adm ORDER BY total DESC`,
        )
        .all();

    // ── Distribuição por responsável ─────────────────────────────────────
    const distResponsavel = db
        .prepare(
            `SELECT COALESCE(us.nome,'Sem responsável') as responsavel, COUNT(*) as total
             FROM unidades u
             LEFT JOIN usuarios us ON us.id = u.responsavel_id
             WHERE u.status = 'Ativo'
             GROUP BY u.responsavel_id ORDER BY total DESC`,
        )
        .all();

    // ── Unidades com indicação ────────────────────────────────────────────
    const distIndicacao = db
        .prepare(
            `SELECT COALESCE(status_pagamento_indicacao,'Sem indicação') as status_pgto, COUNT(*) as total
             FROM unidades WHERE nome_indicacao IS NOT NULL AND nome_indicacao != ''
             GROUP BY status_pagamento_indicacao`,
        )
        .all();

    // ── KRIs + alertas (apenas se houver lançamentos manuais) ────────────
    const krisPorDepto = db
        .prepare(
            `SELECT i.departamento, i.nome, i.unidade_medida, l.valor_realizado, l.meta,
              CASE WHEN l.meta > 0 THEN ROUND(l.valor_realizado*100.0/l.meta,1) ELSE NULL END as percentual
             FROM lancamentos_indicadores l
             JOIN indicadores i ON i.id = l.indicador_id
             WHERE l.competencia = ? AND i.tipo = 'KRI'
             ORDER BY i.departamento, i.nome`,
        )
        .all(comp);

    const clEntrada = {
        departamento: "Comercial",
        nome: nomeCL,
        unidade_medida: "unidade",
        valor_realizado: clMes.liquido,
        meta: metaCL,
        percentual: percentualCL,
    };
    const krisPorDeptoFinal = krisPorDepto.some((k) => k.nome === nomeCL)
        ? krisPorDepto.map((k) => (k.nome === nomeCL ? { ...k, ...clEntrada } : k))
        : [...krisPorDepto, clEntrada];

    const alertas = krisPorDeptoFinal.filter((k) => k.percentual !== null && k.percentual < 80);

    res.json({
        competencia: comp,
        resumo: {
            totalUnidades,
            unidadesAtivas,
            emIntegracao,
            emFechamento,
            baixas: pipeline.find((p) => p.status === "Baixa")?.total || 0,
        },
        pipeline,
        krisPorDepto: krisPorDeptoFinal,
        alertas,
        evolucaoCrescimento,
        empreendimentos,
        distBPO,
        distComissao,
        distResponsavel,
        distIndicacao,
        crescimentoLiquido: { ...clMes, meta: metaCL, percentual: percentualCL },
    });
}

function dashboardDepartamento(req, res) {
    const { depto } = req.params;
    const { competencia } = req.query;
    const comp = competencia || new Date().toISOString().substring(0, 7);

    // Todos os indicadores do depto
    const indicadores = db.prepare("SELECT * FROM indicadores WHERE departamento = ? AND ativo = 1 ORDER BY tipo DESC, nome").all(depto);

    // Lançamentos do mês
    const lancamentos = db
        .prepare(
            `
    SELECT l.* FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE i.departamento = ? AND l.competencia = ?
  `,
        )
        .all(depto, comp);

    // Histórico 6 meses para cada indicador
    const historicos = {};
    indicadores.forEach((ind) => {
        historicos[ind.id] = db
            .prepare(
                `
      SELECT competencia, valor_realizado, meta FROM lancamentos_indicadores
      WHERE indicador_id = ? ORDER BY competencia DESC LIMIT 6
    `,
            )
            .all(ind.id)
            .reverse();
    });

    // Montar resultado combinado
    const resultado = indicadores.map((ind) => {
        const lanc = lancamentos.find((l) => l.indicador_id === ind.id);
        const percentual = lanc && lanc.meta ? Math.round(((lanc.valor_realizado * 100) / lanc.meta) * 10) / 10 : null;
        return {
            ...ind,
            lancamento: lanc || null,
            percentual,
            status: percentual === null ? "sem_lancamento" : percentual >= 100 ? "acima" : percentual >= 80 ? "atencao" : "abaixo",
            historico: historicos[ind.id],
        };
    });

    // Sobrescreve o indicador de crescimento líquido com cálculo automático
    const nomeCL = "Crescimento líquido de unidades";
    const resultadoFinal = resultado.map((ind) => {
        if (ind.nome !== nomeCL) return ind;
        const cl = calcularCrescimentoLiquido(comp);
        const meta = ind.meta_padrao || 5;
        const percentual = meta > 0 ? Math.round(((cl.liquido * 100) / meta) * 10) / 10 : null;
        const historico = getUltimosMeses(comp, 6).map((m) => {
            const c = calcularCrescimentoLiquido(m);
            return { competencia: m, valor_realizado: c.liquido, meta, captadas: c.captadas, perdidas: c.perdidas };
        });
        return {
            ...ind,
            lancamento: { indicador_id: ind.id, competencia: comp, valor_realizado: cl.liquido, meta, captadas: cl.captadas, perdidas: cl.perdidas },
            percentual,
            status: percentual === null ? "sem_lancamento" : percentual >= 100 ? "acima" : percentual >= 80 ? "atencao" : "abaixo",
            historico,
        };
    });

    res.json({ competencia: comp, departamento: depto, indicadores: resultadoFinal });
}

function bi(req, res) {
    const { competencia_inicio, competencia_fim } = req.query;
    const inicio = competencia_inicio || "2024-01";
    const fim = competencia_fim || new Date().toISOString().substring(0, 7);

    // Todos os lançamentos no período agrupados por depto, tipo e competência
    let lancamentos = db
        .prepare(
            `
    SELECT i.departamento, i.tipo, i.nome, i.unidade_medida, l.competencia, l.valor_realizado, l.meta
    FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE l.competencia BETWEEN ? AND ?
    ORDER BY i.departamento, i.nome, l.competencia
  `,
        )
        .all(inicio, fim);

    // Injeta crescimento líquido calculado automaticamente no período do BI
    const nomeCL = "Crescimento líquido de unidades";
    const indCL = db.prepare(`SELECT * FROM indicadores WHERE nome = ?`).get(nomeCL);
    if (indCL) {
        lancamentos = [
            ...lancamentos.filter((l) => l.nome !== nomeCL),
            ...getMesesRange(inicio, fim).map((m) => {
                const cl = calcularCrescimentoLiquido(m);
                return {
                    departamento: indCL.departamento,
                    tipo: indCL.tipo,
                    nome: indCL.nome,
                    unidade_medida: indCL.unidade_medida,
                    competencia: m,
                    valor_realizado: cl.liquido,
                    meta: indCL.meta_padrao || 5,
                };
            }),
        ];
    }

    // Evolução de unidades por status ao longo do tempo
    const evolucaoPipeline = db
        .prepare(
            `
    SELECT status, COUNT(*) as total FROM unidades GROUP BY status
  `,
        )
        .all();

    // Top empreendimentos
    const rankEmpreendimentos = db
        .prepare(
            `
    SELECT e.nome, e.cidade,
      COUNT(u.id) as total_unidades,
      SUM(CASE WHEN u.status = 'Ativo' THEN 1 ELSE 0 END) as ativas,
      SUM(CASE WHEN u.status = 'Integracao' THEN 1 ELSE 0 END) as integracao,
      SUM(CASE WHEN u.status = 'Fechamento' THEN 1 ELSE 0 END) as fechamento,
      SUM(CASE WHEN u.status = 'Baixa' THEN 1 ELSE 0 END) as baixas
    FROM empreendimentos e
    LEFT JOIN unidades u ON u.empreendimento_id = e.id
    GROUP BY e.id ORDER BY ativas DESC
  `,
        )
        .all();

    // ── Dados reais do portfólio para o BI ──────────────────────────────
    // Evolução de captações e baixas (12 meses até o fim do período)
    const evolucaoCrescimento = getUltimosMeses(fim, 12).map((m) => {
        const cl = calcularCrescimentoLiquido(m);
        return { competencia: m, captadas: cl.captadas, perdidas: cl.perdidas, liquido: cl.liquido };
    });

    // Totais por status
    const totaisStatus = db.prepare(`SELECT status, COUNT(*) as total FROM unidades GROUP BY status`).all();
    const totalUnidades = totaisStatus.reduce((a, t) => a + t.total, 0);
    const totalAtivas = totaisStatus.find((t) => t.status === "Ativo")?.total || 0;
    const totalIntegracao = totaisStatus.find((t) => t.status === "Integracao")?.total || 0;
    const totalFechamento = totaisStatus.find((t) => t.status === "Fechamento")?.total || 0;
    const totalBaixas = totaisStatus.find((t) => t.status === "Baixa")?.total || 0;

    // Distribuição BPO
    const distBPO = db
        .prepare(
            `SELECT COALESCE(bpo, 'Não informado') as bpo, COUNT(*) as total
             FROM unidades WHERE status IN ('Ativo','Integracao','Fechamento')
               AND bpo IS NOT NULL AND bpo != ''
             GROUP BY bpo ORDER BY total DESC`,
        )
        .all();

    // Distribuição % Administração
    const distComissao = db
        .prepare(
            `SELECT CAST(CAST(comissao_adm AS INTEGER) AS TEXT) as comissao, COUNT(*) as total
             FROM unidades WHERE status IN ('Ativo','Integracao','Fechamento')
               AND comissao_adm IS NOT NULL
             GROUP BY CAST(comissao_adm AS INTEGER) ORDER BY total DESC`,
        )
        .all();

    // Por responsável (unidades ativas)
    const distResponsavel = db
        .prepare(
            `SELECT u.nome as responsavel, COUNT(*) as total
             FROM unidades un
             JOIN usuarios u ON u.id = un.responsavel_id
             WHERE un.status = 'Ativo'
             GROUP BY un.responsavel_id ORDER BY total DESC`,
        )
        .all();

    res.json({
        periodo: { inicio, fim },
        lancamentos,
        evolucaoPipeline,
        rankEmpreendimentos,
        evolucaoCrescimento,
        totais: { total: totalUnidades, ativas: totalAtivas, integracao: totalIntegracao, fechamento: totalFechamento, baixas: totalBaixas },
        distBPO,
        distComissao,
        distResponsavel,
    });
}

module.exports = { dashboardAdmin, dashboardDepartamento, bi };
