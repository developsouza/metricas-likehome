import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import api from '../../services/api'
import { fmtValor, fmtCompetencia, fmtMoeda, labelDepto } from '../../utils/format'

const DEPTOS = ['Marketing', 'Comercial', 'Atendimento', 'Precificacao', 'Financeiro']
const CORES = ['#0f4c81', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

export default function BI() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inicio, setInicio] = useState('2024-10')
  const [fim, setFim] = useState(new Date().toISOString().substring(0, 7))
  const [deptoAtivo, setDeptoAtivo] = useState('Financeiro')

  useEffect(() => { carregar() }, [inicio, fim])

  async function carregar() {
    setLoading(true)
    try {
      const r = await api.get(`/dashboard/bi?competencia_inicio=${inicio}&competencia_fim=${fim}`)
      setData(r.data)
    } finally { setLoading(false) }
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
