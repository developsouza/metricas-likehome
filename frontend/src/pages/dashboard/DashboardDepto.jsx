import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { fmtValor, fmtCompetencia, competenciaAtual, labelDepto, corIndicador } from '../../utils/format'

export default function DashboardDepto() {
  const { usuario } = useAuth()
  const [data, setData] = useState(null)
  const [comp, setComp] = useState(competenciaAtual())
  const [loading, setLoading] = useState(true)
  const [selecionado, setSelecionado] = useState(null)

  const depto = usuario?.departamento

  useEffect(() => { carregar() }, [comp, depto])

  async function carregar() {
    if (!depto || depto === 'Geral') return
    setLoading(true)
    try {
      const r = await api.get(`/dashboard/departamento/${depto}?competencia=${comp}`)
      setData(r.data)
    } finally { setLoading(false) }
  }

  if (!depto || depto === 'Geral') return (
    <div className="empty-state">
      <p>Seu perfil não está vinculado a um departamento específico.</p>
    </div>
  )

  if (loading) return <div className="loading"><svg className="spin" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth={2} strokeLinecap="round"/></svg> Carregando...</div>

  if (!data) return null

  const kris = data.indicadores.filter(i => i.tipo === 'KRI')
  const kpis = data.indicadores.filter(i => i.tipo === 'KPI')
  const indSelecionado = selecionado ? data.indicadores.find(i => i.id === selecionado) : null

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard — {labelDepto(depto)}</h2>
          <p>Acompanhamento dos seus indicadores</p>
        </div>
        <input type="month" className="form-control" value={comp} onChange={e => setComp(e.target.value)} style={{ width: 'auto' }} />
      </div>

      {/* KRIs */}
      <div style={{ marginBottom: 8 }}>
        <div className="card-title" style={{ marginBottom: 12, paddingLeft: 4 }}>KRIs — Indicadores-Chave de Resultado</div>
      </div>
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {kris.map(ind => (
          <div key={ind.id} className="kpi-card" style={{ '--kpi-color': corIndicador(ind.status), cursor: 'pointer', border: selecionado === ind.id ? '2px solid var(--primary)' : '' }} onClick={() => setSelecionado(selecionado === ind.id ? null : ind.id)}>
            <div className="kpi-label">{ind.nome}</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>
              {ind.lancamento ? fmtValor(ind.lancamento.valor_realizado, ind.unidade_medida) : <span style={{ fontSize: 14, color: 'var(--neutral-400)' }}>Sem lançamento</span>}
            </div>
            {ind.lancamento?.meta && (
              <div className="kpi-meta">
                Meta: {fmtValor(ind.lancamento.meta, ind.unidade_medida)}
                <span className={`kpi-trend ${ind.status === 'acima' ? 'up' : ind.status === 'atencao' ? 'warn' : 'down'}`}>
                  {ind.percentual}%
                </span>
              </div>
            )}
            {ind.lancamento?.meta && (
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${Math.min(ind.percentual, 100)}%`, background: corIndicador(ind.status) }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gráfico do indicador selecionado */}
      {indSelecionado && indSelecionado.historico.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <h3>Evolução — {indSelecionado.nome} (últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={indSelecionado.historico.map(h => ({ ...h, name: fmtCompetencia(h.competencia) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => fmtValor(v, indSelecionado.unidade_medida)} />
              <Line type="monotone" dataKey="valor_realizado" name="Realizado" stroke="#0f4c81" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="meta" name="Meta" stroke="#e8a020" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* KPIs */}
      <div style={{ marginBottom: 8 }}>
        <div className="card-title" style={{ marginBottom: 12, paddingLeft: 4 }}>KPIs — Indicadores de Desempenho</div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Unidade</th>
                  <th>Realizado</th>
                  <th>Meta</th>
                  <th>Atingimento</th>
                  <th>Status</th>
                  <th>Histórico 6m</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map(ind => (
                  <tr key={ind.id}>
                    <td style={{ fontWeight: 500 }}>{ind.nome}</td>
                    <td className="text-muted">{ind.unidade_medida}</td>
                    <td><strong>{ind.lancamento ? fmtValor(ind.lancamento.valor_realizado, ind.unidade_medida) : '—'}</strong></td>
                    <td className="text-muted">{ind.lancamento?.meta ? fmtValor(ind.lancamento.meta, ind.unidade_medida) : fmtValor(ind.meta_padrao, ind.unidade_medida)}</td>
                    <td>
                      {ind.percentual !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, minWidth: 40, color: corIndicador(ind.status) }}>{ind.percentual}%</span>
                          <div className="progress-bar" style={{ width: 70 }}>
                            <div className="progress-bar-fill" style={{ width: `${Math.min(ind.percentual, 100)}%`, background: corIndicador(ind.status) }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td><span className={`status-badge s-${ind.status}`}>{ind.status === 'acima' ? 'Acima' : ind.status === 'atencao' ? 'Atenção' : ind.status === 'abaixo' ? 'Abaixo' : 'Pendente'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 24 }}>
                        {ind.historico.slice(-6).map((h, i) => {
                          const pct = h.meta ? Math.min(h.valor_realizado / h.meta, 1.2) : 0.5
                          const cor = pct >= 1 ? 'var(--success)' : pct >= 0.8 ? 'var(--warning)' : 'var(--danger)'
                          return <div key={i} style={{ width: 8, height: `${Math.max(pct * 24, 4)}px`, background: cor, borderRadius: 2 }} title={`${fmtCompetencia(h.competencia)}: ${fmtValor(h.valor_realizado, ind.unidade_medida)}`} />
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
