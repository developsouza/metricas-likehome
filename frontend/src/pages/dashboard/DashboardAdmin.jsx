import { useState, useEffect, useCallback } from "react";
import { ComposedChart, Bar, Line, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../../services/api";
import { fmtValor, fmtCompetencia, competenciaAtual, labelStatus, labelDepto } from "../../utils/format";
import Paginacao from "../../components/Paginacao";

const POR_PAGINA_EMP = 15;

const CORES_STATUS = {
    Prospeccao: "#3b82f6",
    Reuniao: "#8b5cf6",
    Fechamento: "#f97316",
    Integracao: "#eab308",
    Ativo: "#22c55e",
    Baixa: "#9ca3af",
};
const CORES_DEPTO = {
    Marketing: "#3b82f6",
    Comercial: "#10b981",
    Atendimento: "#f59e0b",
    Precificacao: "#8b5cf6",
    Financeiro: "#ef4444",
};
const CORES_PIE = ["#0f4c81", "#22c55e", "#f97316", "#8b5cf6", "#ef4444", "#eab308", "#10b981", "#9ca3af"];

function KpiCard({ label, value, sub, cor, small }) {
    return (
        <div className="kpi-card" style={{ "--kpi-color": cor }}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={small ? { fontSize: 24 } : {}}>
                {value}
            </div>
            {sub && (
                <div className="kpi-meta" style={{ opacity: 0.75 }}>
                    {sub}
                </div>
            )}
        </div>
    );
}

export default function DashboardAdmin() {
    const [data, setData] = useState(null);
    const [comp, setComp] = useState(competenciaAtual());
    const [loading, setLoading] = useState(true);
    const [paginaEmp, setPaginaEmp] = useState(1);

    const carregar = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get(`/dashboard/admin?competencia=${comp}`);
            setData(r.data);
        } finally {
            setLoading(false);
        }
    }, [comp]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    if (loading)
        return (
            <div className="loading">
                <svg className="spin" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                        strokeWidth={2}
                        strokeLinecap="round"
                    />
                </svg>{" "}
                Carregando dashboard...
            </div>
        );

    if (!data) return null;

    const {
        resumo,
        pipeline,
        krisPorDepto,
        alertas,
        evolucaoCrescimento,
        empreendimentos,
        distBPO,
        distComissao,
        distResponsavel,
        crescimentoLiquido,
    } = data;

    // Formata eixo X do gráfico de crescimento
    const evolucaoFmt = (evolucaoCrescimento || []).map((e) => ({
        ...e,
        name: fmtCompetencia(e.competencia),
    }));

    // Pie do pipeline
    const pipelineChart = pipeline
        .map((p) => ({
            name: labelStatus(p.status),
            value: p.total,
            fill: CORES_STATUS[p.status] || "#9ca3af",
        }))
        .filter((p) => p.value > 0);

    // Top 15 empreendimentos com unidades ativas
    const topEmps = [...empreendimentos]
        .filter((e) => e.ativas > 0)
        .slice(0, 15)
        .map((e) => ({ name: e.nome.length > 18 ? e.nome.substring(0, 18) + "…" : e.nome, ativas: e.ativas }));
    // Empreendimentos com paginação para a tabela
    const empsComUnidades = empreendimentos.filter((e) => e.total_unidades > 0);
    const totalPaginasEmp = Math.max(1, Math.ceil(empsComUnidades.length / POR_PAGINA_EMP));
    const empsPaginados = empsComUnidades.slice((paginaEmp - 1) * POR_PAGINA_EMP, paginaEmp * POR_PAGINA_EMP);
    // KRIs por depto
    const deptoMap = {};
    krisPorDepto.forEach((k) => {
        if (!deptoMap[k.departamento]) deptoMap[k.departamento] = [];
        deptoMap[k.departamento].push(k);
    });

    return (
        <div>
            {/* Cabeçalho */}
            <div className="page-header">
                <div>
                    <h2>Dashboard Administrativa</h2>
                    <p>Visão consolidada — dados reais do portfólio</p>
                </div>
                <div className="flex-gap">
                    <input type="month" className="form-control" value={comp} onChange={(e) => setComp(e.target.value)} style={{ width: "auto" }} />
                </div>
            </div>

            {/* Alertas de KRI */}
            {alertas && alertas.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    {alertas.map((a, i) => (
                        <div key={i} className="alert alert-warning">
                            ⚠️{" "}
                            <strong>
                                {a.departamento} — {a.nome}:
                            </strong>{" "}
                            {fmtValor(a.valor_realizado, a.unidade_medida)} realizado vs meta {fmtValor(a.meta, a.unidade_medida)} ({a.percentual}%)
                        </div>
                    ))}
                </div>
            )}

            {/* KPI Cards — derivados das unidades reais */}
            <div className="kpi-grid">
                <KpiCard label="Unidades Ativas" value={resumo.unidadesAtivas} sub={`de ${resumo.totalUnidades} no portfólio`} cor="#22c55e" />
                <KpiCard label="Em Integração" value={resumo.emIntegracao} sub="aguardando ativação" cor="#eab308" />
                <KpiCard label="Fechamento / Pendente" value={resumo.emFechamento} sub="contrato pendente" cor="#f97316" />
                <KpiCard label="Saídas (Baixa)" value={resumo.baixas} sub="unidades encerradas" cor="#9ca3af" />
                <KpiCard
                    label="Crescimento Líquido"
                    value={crescimentoLiquido ? `${crescimentoLiquido.liquido >= 0 ? "+" : ""}${crescimentoLiquido.liquido}` : "—"}
                    sub={crescimentoLiquido ? `↑ ${crescimentoLiquido.captadas} captadas · ↓ ${crescimentoLiquido.perdidas} saídas` : null}
                    cor={
                        crescimentoLiquido && crescimentoLiquido.liquido >= (crescimentoLiquido.meta || 5)
                            ? "#22c55e"
                            : crescimentoLiquido && crescimentoLiquido.liquido >= 0
                              ? "#f59e0b"
                              : "#ef4444"
                    }
                />
            </div>

            {/* Gráficos principais */}
            <div className="charts-grid">
                {/* Evolução de captações e saídas (12 meses, dados reais por data_ativacao/data_baixa) */}
                <div className="chart-card" style={{ gridColumn: "span 2" }}>
                    <h3>📈 Captações e Saídas por Mês — Últimos 12 meses (dados reais)</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <ComposedChart data={evolucaoFmt}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" fontSize={10} />
                            <YAxis fontSize={11} />
                            <Tooltip />
                            <Legend fontSize={11} />
                            <Bar dataKey="captadas" name="Captadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="perdidas" name="Saídas" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="liquido" name="Líquido" stroke="#0f4c81" strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Pipeline (donut) */}
                <div className="chart-card">
                    <h3>🔄 Pipeline por Status</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={pipelineChart}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={false}
                                fontSize={10}
                            >
                                {pipelineChart.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Top empreendimentos */}
                <div className="chart-card">
                    <h3>🏢 Top Empreendimentos (unidades ativas)</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={topEmps} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" fontSize={10} />
                            <YAxis dataKey="name" type="category" fontSize={10} width={120} />
                            <Tooltip />
                            <Bar dataKey="ativas" name="Ativas" fill="#0f4c81" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* BPO distribuição */}
                <div className="chart-card">
                    <h3>🤝 Distribuição BPO (unidades ativas)</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={distBPO || []}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                dataKey="total"
                                nameKey="bpo"
                                label={({ bpo, total }) => `${bpo}: ${total}`}
                                fontSize={11}
                            >
                                {(distBPO || []).map((_, i) => (
                                    <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v, n, p) => [v, p.payload.bpo]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* % Administração distribuição */}
                <div className="chart-card">
                    <h3>💼 Distribuição % Administração</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={distComissao || []}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                dataKey="total"
                                nameKey="comissao"
                                label={({ comissao, total }) => `${comissao}%: ${total}`}
                                fontSize={11}
                            >
                                {(distComissao || []).map((_, i) => (
                                    <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v, n, p) => [v, `${p.payload.comissao}%`]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Responsável distribuição */}
                <div className="chart-card">
                    <h3>👤 Unidades Ativas por Responsável</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={distResponsavel || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" fontSize={10} />
                            <YAxis dataKey="responsavel" type="category" fontSize={11} width={130} />
                            <Tooltip />
                            <Bar dataKey="total" name="Unidades" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* KRIs por Departamento */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                    <span className="card-title">KRIs por Departamento — {fmtCompetencia(comp)}</span>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Departamento</th>
                                    <th>Indicador</th>
                                    <th>Realizado</th>
                                    <th>Meta</th>
                                    <th>Atingimento</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {krisPorDepto.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--neutral-400)" }}>
                                            Nenhum lançamento manual neste período. O crescimento líquido é calculado automaticamente pelas datas das
                                            unidades.
                                        </td>
                                    </tr>
                                ) : (
                                    krisPorDepto.map((k, i) => {
                                        const status =
                                            k.percentual === null
                                                ? "sem_lancamento"
                                                : k.percentual >= 100
                                                  ? "acima"
                                                  : k.percentual >= 80
                                                    ? "atencao"
                                                    : "abaixo";
                                        return (
                                            <tr key={i}>
                                                <td>
                                                    <span
                                                        style={{
                                                            background: (CORES_DEPTO[k.departamento] || "#888") + "20",
                                                            color: CORES_DEPTO[k.departamento] || "#888",
                                                            padding: "2px 8px",
                                                            borderRadius: 20,
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {labelDepto(k.departamento)}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{k.nome}</td>
                                                <td>
                                                    <strong>{fmtValor(k.valor_realizado, k.unidade_medida)}</strong>
                                                </td>
                                                <td className="text-muted">{fmtValor(k.meta, k.unidade_medida)}</td>
                                                <td>
                                                    {k.percentual !== null && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span
                                                                style={{
                                                                    fontWeight: 600,
                                                                    minWidth: 40,
                                                                    color:
                                                                        status === "acima"
                                                                            ? "var(--success)"
                                                                            : status === "atencao"
                                                                              ? "var(--warning)"
                                                                              : "var(--danger)",
                                                                }}
                                                            >
                                                                {k.percentual}%
                                                            </span>
                                                            <div className="progress-bar" style={{ width: 70 }}>
                                                                <div
                                                                    className="progress-bar-fill"
                                                                    style={{
                                                                        width: `${Math.min(k.percentual, 100)}%`,
                                                                        background:
                                                                            status === "acima"
                                                                                ? "var(--success)"
                                                                                : status === "atencao"
                                                                                  ? "var(--warning)"
                                                                                  : "var(--danger)",
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`status-badge s-${status}`}>
                                                        {status === "acima"
                                                            ? "Acima"
                                                            : status === "atencao"
                                                              ? "Atenção"
                                                              : status === "abaixo"
                                                                ? "Abaixo"
                                                                : "Calculado"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Tabela de Empreendimentos */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Portfólio por Empreendimento</span>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Empreendimento</th>
                                    <th style={{ textAlign: "center" }}>Total</th>
                                    <th style={{ textAlign: "center" }}>Ativas</th>
                                    <th style={{ textAlign: "center" }}>Integração</th>
                                    <th style={{ textAlign: "center" }}>Fechamento</th>
                                    <th style={{ textAlign: "center" }}>Baixas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empsPaginados.map((e, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{e.nome}</td>
                                        <td style={{ textAlign: "center" }}>{e.total_unidades}</td>
                                        <td style={{ textAlign: "center" }}>
                                            {e.ativas > 0 && <span className="status-badge s-ativo">{e.ativas}</span>}
                                            {e.ativas === 0 && <span className="text-muted">—</span>}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {e.integracao > 0 ? (
                                                <span className="status-badge s-integracao">{e.integracao}</span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {e.fechamento > 0 ? (
                                                <span className="status-badge s-fechamento">{e.fechamento}</span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {e.baixas > 0 ? (
                                                <span className="status-badge s-baixa">{e.baixas}</span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Paginacao
                            pagina={paginaEmp}
                            totalPaginas={totalPaginasEmp}
                            total={empsComUnidades.length}
                            porPagina={POR_PAGINA_EMP}
                            onChange={setPaginaEmp}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
