const { db } = require("../database");

// Calcula crescimento líquido combinando:
// 1) historico_status_unidade — unidades gerenciadas via CRUD
// 2) data_ativacao / data_baixa da tabela unidades — dados sem histórico (seed/importações)
function calcularCrescimentoLiquido(competencia) {
    // Captadas via histórico
    const hCaptadas =
        db
            .prepare(
                `SELECT COUNT(DISTINCT unidade_id) AS n FROM historico_status_unidade
       WHERE status_novo = 'Ativo' AND strftime('%Y-%m', data_mudanca) = ?`,
            )
            .get(competencia)?.n || 0;

    // Captadas via data_ativacao (sem histórico)
    const dCaptadas =
        db
            .prepare(
                `SELECT COUNT(DISTINCT u.id) AS n FROM unidades u
       WHERE u.status = 'Ativo'
         AND strftime('%Y-%m', u.data_ativacao) = ?
         AND NOT EXISTS (
           SELECT 1 FROM historico_status_unidade h
           WHERE h.unidade_id = u.id AND h.status_novo = 'Ativo'
         )`,
            )
            .get(competencia)?.n || 0;

    // Perdidas via histórico
    const hPerdidas =
        db
            .prepare(
                `SELECT COUNT(DISTINCT unidade_id) AS n FROM historico_status_unidade
       WHERE status_novo = 'Baixa' AND strftime('%Y-%m', data_mudanca) = ?`,
            )
            .get(competencia)?.n || 0;

    // Perdidas via data_baixa (sem histórico)
    const dPerdidas =
        db
            .prepare(
                `SELECT COUNT(DISTINCT u.id) AS n FROM unidades u
       WHERE u.status = 'Baixa'
         AND strftime('%Y-%m', u.data_baixa) = ?
         AND NOT EXISTS (
           SELECT 1 FROM historico_status_unidade h
           WHERE h.unidade_id = u.id AND h.status_novo = 'Baixa'
         )`,
            )
            .get(competencia)?.n || 0;

    const captadas = hCaptadas + dCaptadas;
    const perdidas = hPerdidas + dPerdidas;
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

    // Pipeline resumo
    const pipeline = db.prepare(`SELECT status, COUNT(*) as total FROM unidades GROUP BY status`).all();
    const totalUnidades = pipeline.reduce((acc, p) => acc + p.total, 0);
    const unidadesAtivas = pipeline.find((p) => p.status === "Ativo")?.total || 0;

    // Resumo por departamento (KRIs no mês)
    const krisPorDepto = db
        .prepare(
            `
    SELECT i.departamento, i.nome, i.unidade_medida, l.valor_realizado, l.meta,
      CASE WHEN l.meta > 0 THEN ROUND(l.valor_realizado * 100.0 / l.meta, 1) ELSE NULL END as percentual
    FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE l.competencia = ? AND i.tipo = 'KRI'
    ORDER BY i.departamento, i.nome
  `,
        )
        .all(comp);

    // Crescimento líquido — calculado automaticamente a partir do historico_status_unidade
    const nomeCL = "Crescimento líquido de unidades";
    const clMes = calcularCrescimentoLiquido(comp);
    const metaCLRow = db.prepare(`SELECT meta_padrao FROM indicadores WHERE nome = ?`).get(nomeCL);
    const metaCL = metaCLRow?.meta_padrao || 5;
    const percentualCL = metaCL > 0 ? Math.round(((clMes.liquido * 100) / metaCL) * 10) / 10 : null;
    const evolucaoCrescimento = getUltimosMeses(comp, 6).map((m) => {
        const cl = calcularCrescimentoLiquido(m);
        return { competencia: m, ...cl };
    });
    // Sobrescreve a entrada manual do KRI com o valor calculado automaticamente;
    // se o KRI ainda não tiver lançamento no mês, injeta a entrada
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

    // Alertas: KRIs abaixo de 80% da meta
    const alertas = krisPorDeptoFinal.filter((k) => k.percentual !== null && k.percentual < 80);

    // Evolução receita média (Financeiro KRI últimos 6 meses)
    const evolucaoReceita = db
        .prepare(
            `
    SELECT l.competencia, l.valor_realizado, l.meta FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE i.departamento = 'Financeiro' AND i.tipo = 'KRI' AND i.nome LIKE '%EBITDA%'
    ORDER BY l.competencia DESC LIMIT 6
  `,
        )
        .all()
        .reverse();

    // Evolução ocupação últimos 6 meses
    const evolucaoOcupacao = db
        .prepare(
            `
    SELECT l.competencia, l.valor_realizado FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE i.departamento = 'Precificacao' AND i.nome LIKE '%ocupa%'
    ORDER BY l.competencia DESC LIMIT 6
  `,
        )
        .all()
        .reverse();

    // Evolução leads últimos 6 meses
    const evolucaoLeads = db
        .prepare(
            `
    SELECT l.competencia, l.valor_realizado FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE i.departamento = 'Marketing' AND i.nome LIKE '%proprietário%'
    ORDER BY l.competencia DESC LIMIT 6
  `,
        )
        .all()
        .reverse();

    // Resumo financeiro do mês
    const financeiroMes = db
        .prepare(
            `
    SELECT i.nome, l.valor_realizado, l.meta FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE i.departamento = 'Financeiro' AND l.competencia = ?
  `,
        )
        .all(comp);

    // Nota OTA
    const notaOTA = db
        .prepare(
            `
    SELECT l.valor_realizado FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE i.departamento = 'Atendimento' AND i.nome LIKE '%OTA%' AND l.competencia = ?
  `,
        )
        .get(comp);

    // Taxa de ocupação
    const taxaOcupacao = db
        .prepare(
            `
    SELECT l.valor_realizado FROM lancamentos_indicadores l
    JOIN indicadores i ON i.id = l.indicador_id
    WHERE i.nome LIKE '%ocupa%' AND i.departamento = 'Precificacao' AND l.competencia = ?
  `,
        )
        .get(comp);

    // Empreendimentos com unidades ativas
    const empreendimentos = db
        .prepare(
            `
    SELECT e.nome, COUNT(u.id) as total_ativas
    FROM empreendimentos e
    LEFT JOIN unidades u ON u.empreendimento_id = e.id AND u.status = 'Ativo'
    GROUP BY e.id ORDER BY total_ativas DESC
  `,
        )
        .all();

    res.json({
        competencia: comp,
        resumo: {
            totalUnidades,
            unidadesAtivas,
            notaOTA: notaOTA?.valor_realizado || null,
            taxaOcupacao: taxaOcupacao?.valor_realizado || null,
        },
        pipeline,
        krisPorDepto: krisPorDeptoFinal,
        alertas,
        evolucaoReceita,
        evolucaoOcupacao,
        evolucaoLeads,
        financeiroMes,
        empreendimentos,
        crescimentoLiquido: { ...clMes, meta: metaCL, percentual: percentualCL },
        evolucaoCrescimento,
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
      SUM(CASE WHEN u.status = 'Baixa' THEN 1 ELSE 0 END) as baixas
    FROM empreendimentos e
    LEFT JOIN unidades u ON u.empreendimento_id = e.id
    GROUP BY e.id ORDER BY ativas DESC
  `,
        )
        .all();

    res.json({ periodo: { inicio, fim }, lancamentos, evolucaoPipeline, rankEmpreendimentos });
}

module.exports = { dashboardAdmin, dashboardDepartamento, bi };
