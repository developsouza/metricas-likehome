import { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Bar, Line, BarChart, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import api from '../../services/api'
import { fmtValor, fmtCompetencia, labelDepto } from '../../utils/format'
import Paginacao from '../../components/Paginacao'

const DEPTOS = ['Marketing', 'Comercial', 'Atendimento', 'Precificacao', 'Financeiro']
const CORES_DEPTO = ['#0f4c81', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
const CORES_PIE = ['#0f4c81', '#22c55e', '#f97316', '#8b5cf6', '#ef4444', '#eab308', '#10b981', '#9ca3af']

const POR_PAGINA_KRI = 15

export default function BI() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inicio, setInicio] = useState('2024-10')
  const [fim, setFim] = useState(new Date().toISOString().substring(0, 7))
  const [deptoAtivo, setDeptoAtivo] = useState('Comercial')
  const [paginaKri, setPaginaKri] = useState(1)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/dashboard/bi?competencia_inicio=${inicio}&competencia_fim=${fim}`)
      setData(r.data)
      setPaginaKri(1)
    } finally { setLoading(false) }
  }, [inicio, fim])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { setPaginaKri(1) }, [deptoAtivo])

  if (loading) return (
    <div className="loading">
      <svg className="spin" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth={2} strokeLinecap="round"/>
      </svg> Processando análise...
    </div>
  )

  if (!data) return null

  const { totais, evolucaoCrescimento, rankEmpreendimentos, distBPO, distComissao, distResponsavel, lancamentos } = data

  // Formata evolucaoCrescimento para o eixo X
  const evolucaoFmt = (evolucaoCrescimento || []).map(e => ({
    ...e,
    name: fmtCompetencia(e.competencia),
  }))

  // Top 15 empreendimentos com ativas > 0
  const topEmps = [...(rankEmpreendimentos || [])]
    .filter(e => e.ativas > 0)
    .slice(0, 15)
    .map(e => ({ name: e.nome.length > 22 ? e.nome.substring(0, 22) + '…' : e.nome, ativas: e.ativas, integracao: e.integracao || 0, baixas: e.baixas || 0 }))

  // KRIs por depto (filtrado)
  const krisDepto = lancamentos.filter(l => l.departamento === deptoAtivo && l.tipo === 'KRI')
  const krisDeptoTotal = krisDepto.length
  const krisTotalPaginas = Math.max(1, Math.ceil(krisDeptoTotal / POR_PAGINA_KRI))
  const krisPaginados = krisDepto.slice((paginaKri - 1) * POR_PAGINA_KRI, paginaKri * POR_PAGINA_KRI)

  // Atingimento médio por depto (gráfico de radar)
  function getRadarDepto() {
    const porDepto = {}
    lancamentos.filter(l => l.tipo === 'KRI').forEach(l => {
      if (!porDepto[l.departamento]) porDepto[l.departamento] = { sum: 0, count: 0 }
      if (l.meta > 0) {
        porDepto[l.departamento].sum += l.valor_realizado / l.meta * 100
        porDepto[l.departamento].count++
      }
    })
    return DEPTOS.map(d => ({
      depto: labelDepto(d),
      atingimento: porDepto[d] && porDepto[d].count > 0 ? Math.round(porDepto[d].sum / porDepto[d].count) : 0
    }))
  }

  // Atingimento por depto e mês (linha)
  function getAtingimentoGeral() {
    const comp = {}
    lancamentos.filter(l => l.tipo === 'KRI').forEach(l => {
      if (!comp[l.competencia]) comp[l.competencia] = { name: fmtCompetencia(l.competencia) }
      const pct = l.meta > 0 ? l.valor_realizado / l.meta * 100 : null
      if (pct !== null) {
        if (!comp[l.competencia][l.departamento + '_count']) comp[l.competencia][l.departamento + '_count'] = 0
        if (!comp[l.competencia][l.departamento + '_sum']) comp[l.competencia][l.departamento + '_sum'] = 0
        comp[l.competencia][l.departamento + '_count']++
        comp[l.competencia][l.departamento + '_sum'] += pct
      }
    })
    return Object.values(comp).map(c => {
      const result = { name: c.name }
      DEPTOS.forEach(d => {
        if (c[d + '_count'] > 0) result[d] = Math.round(c[d + '_sum'] / c[d + '_count'])
      })
      return result
    })
  }

  const temLancamentos = lancamentos.length > 0
  const atingimentoGeral = getAtingimentoGeral()
  const radarData = getRadarDepto()

  return (
    <div>
      {/* Cabeçalho */}
      <div className="page-header">
        <div>
          <h2>Análise BI — Business Intelligence</h2>
          <p>Portfólio real · {totais?.total || 0} unidades cadastradas</p>
        </div>
        <div className="flex-gap">
          <div>
            <label className="form-label">De</label>
            <input type="month" className="form-control" value={inicio} onChange={e => setInicio(e.target.value)} style={{ width: 'auto' }} />
          </div>
          <div>
            <label className="form-label">Até</label>
            <input type="month" className="form-control" value={fim} onChange={e => setFim(e.target.value)} style={{ width: 'auto' }} />
          </div>
        </div>
      </div>

      {/* KPIs do portfólio */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-color': '#0f4c81' }}>
          <div className="kpi-label">Total Portfólio</div>
          <div className="kpi-value">{totais?.total || 0}</div>
          <div className="kpi-meta">unidades cadastradas</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#22c55e' }}>
          <div className="kpi-label">Unidades Ativas</div>
          <div className="kpi-value">{totais?.ativas || 0}</div>
          <div className="kpi-meta">{totais?.total > 0 ? Math.round(totais.ativas / totais.total * 100) : 0}% do portfólio</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#eab308' }}>
          <div className="kpi-label">Em Integração</div>
          <div className="kpi-value">{totais?.integracao || 0}</div>
          <div className="kpi-meta">a integrar</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#f97316' }}>
          <div className="kpi-label">Fechamento</div>
          <div className="kpi-value">{totais?.fechamento || 0}</div>
          <div className="kpi-meta">contrato pendente</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#9ca3af' }}>
          <div className="kpi-label">Baixas</div>
          <div className="kpi-value">{totais?.baixas || 0}</div>
          <div className="kpi-meta">unidades encerradas</div>
        </div>
      </div>

      {/* Gráficos de portfólio real */}
      <div className="charts-grid">
        {/* Evolução captações e saídas */}
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <h3>📈 Captações e Saídas — Últimos 12 meses (dados reais)</h3>
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

        {/* Top empreendimentos */}
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <h3>🏢 Top 15 Empreendimentos (unidades ativas)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topEmps} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" fontSize={10} />
              <YAxis dataKey="name" type="category" fontSize={10} width={160} />
              <Tooltip />
              <Legend fontSize={11} />
              <Bar dataKey="ativas" name="Ativas" fill="#22c55e" radius={[0, 4, 4, 0]} stackId="a" />
              <Bar dataKey="integracao" name="Integração" fill="#eab308" radius={[0, 4, 4, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição BPO */}
        <div className="chart-card">
          <h3>🤝 BPO — Unidades Ativas + Integração</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={distBPO || []} cx="50%" cy="50%" outerRadius={90}
                dataKey="total" nameKey="bpo"
                label={({ bpo, total }) => `${bpo}: ${total}`} fontSize={11}>
                {(distBPO || []).map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [v, p.payload.bpo]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição % Adm */}
        <div className="chart-card">
          <h3>💼 % Administração — Unidades Ativas + Integração</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={distComissao || []} cx="50%" cy="50%" outerRadius={90}
                dataKey="total" nameKey="comissao"
                label={({ comissao, total }) => `${comissao}%: ${total}`} fontSize={11}>
                {(distComissao || []).map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [v, `${p.payload.comissao}%`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Responsável */}
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

        {/* Radar KRI (visível apenas se houver lançamentos) */}
        {temLancamentos && (
          <div className="chart-card">
            <h3>🎯 Radar KRI — {fmtCompetencia(fim)}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
                <PolarGrid />
                <PolarAngleAxis dataKey="depto" fontSize={11} />
                <Radar name="Atingimento %" dataKey="atingimento" stroke="#0f4c81" fill="#0f4c81" fillOpacity={0.25} />
                <Tooltip formatter={v => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Atingimento por depto (visível apenas se houver lançamentos) */}
        {temLancamentos && atingimentoGeral.length > 0 && (
          <div className="chart-card" style={{ gridColumn: 'span 2' }}>
            <h3>📊 Atingimento Médio de KRIs por Departamento (%)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={atingimentoGeral}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} domain={[0, 140]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${v}%`} />
                <Legend fontSize={11} />
                {DEPTOS.map((d, i) => (
                  <Line key={d} type="monotone" dataKey={d} name={labelDepto(d)} stroke={CORES_DEPTO[i]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabela de empreendimentos completa */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Portfólio Completo por Empreendimento</span>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Empreendimento</th>
                  <th>Cidade</th>
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Ativas</th>
                  <th style={{ textAlign: 'center' }}>Integração</th>
                  <th style={{ textAlign: 'center' }}>Fechamento</th>
                  <th style={{ textAlign: 'center' }}>Baixas</th>
                </tr>
              </thead>
              <tbody>
                {rankEmpreendimentos.filter(e => e.total_unidades > 0).map((e, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{e.nome}</td>
                    <td className="text-muted">{e.cidade || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{e.total_unidades}</td>
                    <td style={{ textAlign: 'center' }}>
                      {e.ativas > 0 ? <span className="status-badge s-ativo">{e.ativas}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {e.integracao > 0 ? <span className="status-badge s-integracao">{e.integracao}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {e.fechamento > 0 ? <span className="status-badge s-fechamento">{e.fechamento}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {e.baixas > 0 ? <span className="status-badge s-baixa">{e.baixas}</span> : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detalhamento de KRIs por Depto — aparece apenas se existirem lançamentos */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="card-title">KRIs por Departamento — {fmtCompetencia(inicio)} a {fmtCompetencia(fim)}</span>
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
            {DEPTOS.map(d => (
              <button key={d} className={`tab-btn ${deptoAtivo === d ? 'active' : ''}`} onClick={() => setDeptoAtivo(d)}>
                {labelDepto(d)}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          {!temLancamentos ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--neutral-400)' }}>
              Nenhum lançamento manual neste período.<br />
              Os KRIs serão exibidos aqui conforme os departamentos lançarem indicadores.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Competência</th>
                    <th>Indicador</th>
                    <th>Realizado</th>
                    <th>Meta</th>
                    <th>Atingimento</th>
                  </tr>
                </thead>
                <tbody>
                  {krisPaginados.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--neutral-400)' }}>Nenhum KRI lançado para {labelDepto(deptoAtivo)}</td></tr>
                  ) : krisPaginados.map((l, i) => {
                    const pct = l.meta > 0 ? Math.round(l.valor_realizado / l.meta * 100 * 10) / 10 : null
                    const status = pct === null ? 'sem_lancamento' : pct >= 100 ? 'acima' : pct >= 80 ? 'atencao' : 'abaixo'
                    return (
                      <tr key={i}>
                        <td className="text-muted">{fmtCompetencia(l.competencia)}</td>
                        <td style={{ fontWeight: 500 }}>{l.nome}</td>
                        <td><strong>{fmtValor(l.valor_realizado, l.unidade_medida)}</strong></td>
                        <td className="text-muted">{fmtValor(l.meta, l.unidade_medida)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {pct !== null && (
                              <span style={{ fontWeight: 600, color: status === 'acima' ? 'var(--success)' : status === 'atencao' ? 'var(--warning)' : 'var(--danger)' }}>
                                {pct}%
                              </span>
                            )}
                            <span className={`status-badge s-${status}`}>
                              {status === 'acima' ? '✓ Acima' : status === 'atencao' ? '⚡ Atenção' : status === 'abaixo' ? '✕ Abaixo' : '—'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Paginacao
                pagina={paginaKri}
                totalPaginas={krisTotalPaginas}
                total={krisDeptoTotal}
                porPagina={POR_PAGINA_KRI}
                onChange={setPaginaKri}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

  if (loading) return <div className="loading"><svg className="spin" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth={2} strokeLinecap="round"/></svg> Processando análise...</div>

  if (!data) return null

  // Monta dados por competência para cada depto
  function getDadosDepto(depto) {
    const inds = data.lancamentos.filter(l => l.departamento === depto && l.tipo === 'KRI')
    const porComp = {}
    inds.forEach(l => {
      if (!porComp[l.competencia]) porComp[l.competencia] = { name: fmtCompetencia(l.competencia) }
      // Normaliza para % do objetivo
      const pct = l.meta > 0 ? Math.round(l.valor_realizado / l.meta * 100) : null
      porComp[l.competencia][l.nome.substring(0, 20)] = pct
    })
    return Object.values(porComp)
  }

  // Dados para comparação de atingimento por depto
  function getAtingimentoGeral() {
    const comp = {}
    data.lancamentos.filter(l => l.tipo === 'KRI').forEach(l => {
      if (!comp[l.competencia]) comp[l.competencia] = { name: fmtCompetencia(l.competencia) }
      const pct = l.meta > 0 ? l.valor_realizado / l.meta * 100 : null
      if (pct !== null) {
        if (!comp[l.competencia][l.departamento + '_count']) comp[l.competencia][l.departamento + '_count'] = 0
        if (!comp[l.competencia][l.departamento + '_sum']) comp[l.competencia][l.departamento + '_sum'] = 0
        comp[l.competencia][l.departamento + '_count']++
        comp[l.competencia][l.departamento + '_sum'] += pct
      }
    })
    return Object.values(comp).map(c => {
      const result = { name: c.name }
      DEPTOS.forEach(d => {
        if (c[d + '_count'] > 0) result[d] = Math.round(c[d + '_sum'] / c[d + '_count'])
      })
      return result
    })
  }

  // Radar: atingimento médio por depto (último mês)
  function getRadarDepto() {
    const ultimoMes = fim
    const porDepto = {}
    data.lancamentos.filter(l => l.competencia === ultimoMes && l.tipo === 'KRI').forEach(l => {
      if (!porDepto[l.departamento]) porDepto[l.departamento] = { sum: 0, count: 0 }
      if (l.meta > 0) {
        porDepto[l.departamento].sum += l.valor_realizado / l.meta * 100
        porDepto[l.departamento].count++
      }
    })
    return DEPTOS.map(d => ({
      depto: labelDepto(d),
      atingimento: porDepto[d] ? Math.round(porDepto[d].sum / porDepto[d].count) : 0
    }))
  }

  const atingimentoGeral = getAtingimentoGeral()
  const radarData = getRadarDepto()
  const dadosDepto = getDadosDepto(deptoAtivo)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Análise BI — Business Intelligence</h2>
          <p>Visão comparativa e análise de tendências por período</p>
        </div>
        <div className="flex-gap">
          <div>
            <label className="form-label">De</label>
            <input type="month" className="form-control" value={inicio} onChange={e => setInicio(e.target.value)} style={{ width: 'auto' }} />
          </div>
          <div>
            <label className="form-label">Até</label>
            <input type="month" className="form-control" value={fim} onChange={e => setFim(e.target.value)} style={{ width: 'auto' }} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Atingimento de KRIs por Departamento */}
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <h3>📊 Atingimento Médio de KRIs por Departamento (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={atingimentoGeral}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} domain={[0, 140]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend fontSize={11} />
              {DEPTOS.map((d, i) => (
                <Line key={d} type="monotone" dataKey={d} name={labelDepto(d)} stroke={CORES[i]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="chart-card">
          <h3>🎯 Radar de Performance — {fmtCompetencia(fim)}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={90}>
              <PolarGrid />
              <PolarAngleAxis dataKey="depto" fontSize={11} />
              <Radar name="Atingimento" dataKey="atingimento" stroke="#0f4c81" fill="#0f4c81" fillOpacity={0.25} />
              <Tooltip formatter={(v) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking de Empreendimentos */}
        <div className="chart-card">
          <h3>🏢 Empreendimentos — Unidades Ativas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.rankEmpreendimentos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="nome" fontSize={10} width={120} />
              <Tooltip />
              <Legend fontSize={11} />
              <Bar dataKey="ativas" name="Ativas" fill="#22c55e" radius={[0, 4, 4, 0]} />
              <Bar dataKey="baixas" name="Baixas" fill="#9ca3af" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detalhamento por Depto */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Evolução de KRIs por Departamento</span>
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
            {DEPTOS.map(d => (
              <button key={d} className={`tab-btn ${deptoAtivo === d ? 'active' : ''}`} onClick={() => setDeptoAtivo(d)}>
                {labelDepto(d)}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Competência</th>
                  <th>Indicador</th>
                  <th>Realizado</th>
                  <th>Meta</th>
                  <th>Atingimento</th>
                </tr>
              </thead>
              <tbody>
                {data.lancamentos.filter(l => l.departamento === deptoAtivo && l.tipo === 'KRI').length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--neutral-400)' }}>Nenhum dado no período</td></tr>
                ) : data.lancamentos.filter(l => l.departamento === deptoAtivo && l.tipo === 'KRI').map((l, i) => {
                  const pct = l.meta > 0 ? Math.round(l.valor_realizado / l.meta * 100 * 10) / 10 : null
                  const status = pct === null ? 'sem_lancamento' : pct >= 100 ? 'acima' : pct >= 80 ? 'atencao' : 'abaixo'
                  return (
                    <tr key={i}>
                      <td className="text-muted">{fmtCompetencia(l.competencia)}</td>
                      <td style={{ fontWeight: 500 }}>{l.nome}</td>
                      <td><strong>{fmtValor(l.valor_realizado, l.unidade_medida)}</strong></td>
                      <td className="text-muted">{fmtValor(l.meta, l.unidade_medida)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {pct !== null && <span style={{ fontWeight: 600, color: status === 'acima' ? 'var(--success)' : status === 'atencao' ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</span>}
                          <span className={`status-badge s-${status}`}>{status === 'acima' ? '✓ Acima' : status === 'atencao' ? '⚡ Atenção' : status === 'abaixo' ? '✕ Abaixo' : '—'}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
