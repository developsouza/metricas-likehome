import { useState, useEffect } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { fmtValor, fmtMoeda, fmtPct, fmtCompetencia, competenciaAtual, labelStatus, labelDepto } from "../../utils/format";

const CORES_STATUS = { Prospeccao: "#3b82f6", Reuniao: "#8b5cf6", Fechamento: "#f97316", Integracao: "#eab308", Ativo: "#22c55e", Baixa: "#9ca3af" };
const CORES_DEPTO = { Marketing: "#3b82f6", Comercial: "#10b981", Atendimento: "#f59e0b", Precificacao: "#8b5cf6", Financeiro: "#ef4444" };

function KpiCard({ label, value, meta, cor, trend, sub }) {
    return (
        <div className="kpi-card" style={{ "--kpi-color": cor }}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
            {meta && (
                <div className="kpi-meta">
                    Meta: {meta} {trend && <span className={`kpi-trend ${trend}`}>▲</span>}
                </div>
            )}
            {sub && (
                <div className="kpi-meta" style={{ opacity: 0.75, fontSize: 11 }}>
                    {sub}
                </div>
            )}
        </div>
    );
}

export default function DashboardAdmin() {
    const { usuario } = useAuth();
    const [data, setData] = useState(null);
    const [comp, setComp] = useState(competenciaAtual());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregar();
    }, [comp]);

    async function carregar() {
        setLoading(true);
        try {
            const r = await api.get(`/dashboard/admin?competencia=${comp}`);
            setData(r.data);
        } finally {
            setLoading(false);
        }
    }

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
        evolucaoReceita,
        evolucaoOcupacao,
        evolucaoLeads,
        financeiroMes,
        empreendimentos,
        crescimentoLiquido,
        evolucaoCrescimento,
    } = data;

    const evolucaoReceitaFmt = evolucaoReceita.map((e) => ({ ...e, name: fmtCompetencia(e.competencia) }));
    const evolucaoOcupacaoFmt = evolucaoOcupacao.map((e) => ({ ...e, name: fmtCompetencia(e.competencia) }));
    const evolucaoLeadsFmt = evolucaoLeads.map((e) => ({ ...e, name: fmtCompetencia(e.competencia) }));
    const evolucaoCrescimentoFmt = (evolucaoCrescimento || []).map((e) => ({ ...e, name: fmtCompetencia(e.competencia) }));
    const pipelineChart = pipeline.map((p) => ({ name: labelStatus(p.status), value: p.total, fill: CORES_STATUS[p.status] }));

    // KRIs agrupados por depto para tabela
    const deptoMap = {};
    krisPorDepto.forEach((k) => {
        if (!deptoMap[k.departamento]) deptoMap[k.departamento] = [];
        deptoMap[k.departamento].push(k);
    });

    return (
        <div>
            {/* Seletor de competência */}
            <div className="page-header">
                <div>
                    <h2>Dashboard Administrativo</h2>
                    <p>Visão consolidada de todos os indicadores</p>
                </div>
                <div className="flex-gap">
                    <input type="month" className="form-control" value={comp} onChange={(e) => setComp(e.target.value)} style={{ width: "auto" }} />
                </div>
            </div>

            {/* Alertas */}
            {alertas.length > 0 && (
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

            {/* KPIs Principais */}
            <div className="kpi-grid">
                <KpiCard label="Unidades Ativas" value={resumo.unidadesAtivas} meta={`${resumo.totalUnidades} total`} cor="#22c55e" />
                <KpiCard label="Nota Média OTAs" value={resumo.notaOTA ? resumo.notaOTA.toFixed(1) : "—"} meta="Meta: 4,7" cor="#f59e0b" />
                <KpiCard label="Taxa de Ocupação" value={resumo.taxaOcupacao ? `${resumo.taxaOcupacao}%` : "—"} meta="Meta: 70%" cor="#3b82f6" />
                <KpiCard label="Empreendimentos" value={empreendimentos.length} meta="Ativos" cor="#8b5cf6" />
                <KpiCard
                    label="Crescimento Líquido"
                    value={crescimentoLiquido ? `${crescimentoLiquido.liquido >= 0 ? "+" : ""}${crescimentoLiquido.liquido} un.` : "—"}
                    meta={crescimentoLiquido?.meta}
                    cor={
                        crescimentoLiquido && crescimentoLiquido.liquido >= crescimentoLiquido.meta
                            ? "#22c55e"
                            : crescimentoLiquido && crescimentoLiquido.liquido >= 0
                              ? "#f59e0b"
                              : "#ef4444"
                    }
                    sub={crescimentoLiquido ? `↑ ${crescimentoLiquido.captadas} captadas · ↓ ${crescimentoLiquido.perdidas} baixas` : null}
                />
            </div>

            {/* Gráficos */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>📈 Receita Operacional (EBITDA) — Últimos 6 meses</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={evolucaoReceitaFmt}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => fmtMoeda(v)} />
                            <Legend fontSize={11} />
                            <Line type="monotone" dataKey="valor_realizado" name="Realizado" stroke="#0f4c81" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="meta" name="Meta" stroke="#e8a020" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>🏠 Taxa de Ocupação (%) — Últimos 6 meses</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={evolucaoOcupacaoFmt}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <Tooltip formatter={(v) => `${v}%`} />
                            <Bar dataKey="valor_realizado" name="Ocupação" fill="#0f4c81" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>🎯 Leads de Proprietários — Últimos 6 meses</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={evolucaoLeadsFmt}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={11} />
                            <Tooltip />
                            <Bar dataKey="valor_realizado" name="Leads" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>🔄 Pipeline de Unidades</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={pipelineChart}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                                fontSize={11}
                            >
                                {pipelineChart.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>📈 Crescimento Líquido de Unidades — Últimos 6 meses</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={evolucaoCrescimentoFmt}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={11} />
                            <Tooltip />
                            <Legend fontSize={11} />
                            <Bar dataKey="captadas" name="Captadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="perdidas" name="Baixas" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="liquido" name="Líquido" stroke="#0f4c81" strokeWidth={2} dot={{ r: 4 }} />
                        </ComposedChart>
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
                                            Nenhum lançamento neste período
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
                                                            background: CORES_DEPTO[k.departamento] + "20",
                                                            color: CORES_DEPTO[k.departamento],
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
                                                        <div>
                                                            <span
                                                                style={{
                                                                    fontWeight: 600,
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
                                                            <div className="progress-bar" style={{ width: 80 }}>
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
                                                            ? "Acima da meta"
                                                            : status === "atencao"
                                                              ? "Atenção"
                                                              : status === "abaixo"
                                                                ? "Abaixo"
                                                                : "Sem lançamento"}
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

            {/* Empreendimentos */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Unidades por Empreendimento</span>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Empreendimento</th>
                                    <th>Cidade</th>
                                    <th>Total Unidades</th>
                                    <th>Ativas</th>
                                    <th>Baixas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {empreendimentos.map((e, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{e.nome}</td>
                                        <td className="text-muted">{e.cidade || "—"}</td>
                                        <td>{e.total_unidades}</td>
                                        <td>
                                            <span className="status-badge s-ativo">{e.ativas}</span>
                                        </td>
                                        <td>
                                            <span className="status-badge s-baixa">{e.baixas}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
