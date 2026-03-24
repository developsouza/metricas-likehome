import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { fmtValor, fmtCompetencia, competenciaAtual, labelDepto, deptos } from '../../utils/format'

function ModalLancamento({ indicador, lancamento, competencia, onClose, onSave }) {
  const [valor, setValor] = useState(lancamento?.valor_realizado ?? '')
  const [meta, setMeta] = useState(lancamento?.meta ?? indicador.meta_padrao ?? '')
  const [obs, setObs] = useState(lancamento?.observacao ?? '')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar() {
    if (valor === '' || valor === null) return setErro('Informe o valor realizado')
    setErro(''); setLoading(true)
    try {
      if (lancamento?.id) {
        await api.put(`/lancamentos/${lancamento.id}`, { valor_realizado: Number(valor), meta: meta !== '' ? Number(meta) : null, observacao: obs })
      } else {
        await api.post('/lancamentos', { indicador_id: indicador.id, competencia, valor_realizado: Number(valor), meta: meta !== '' ? Number(meta) : null, observacao: obs })
      }
      onSave()
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao salvar')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="modal-title">
          {lancamento?.id ? 'Editar Lançamento' : 'Lançar Indicador'}
        </div>
        <div style={{ marginBottom: 16, padding: 12, background: 'var(--neutral-50)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginBottom: 2 }}>{indicador.tipo} · {labelDepto(indicador.departamento)}</div>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{indicador.nome}</div>
          <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 2 }}>Competência: <strong>{fmtCompetencia(competencia)}</strong> · Unidade: {indicador.unidade_medida}</div>
        </div>
        {erro && <div className="alert alert-danger">{erro}</div>}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Valor Realizado *</label>
            <input type="number" step="any" className="form-control" value={valor} onChange={e => setValor(e.target.value)} placeholder="0" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Meta do Período</label>
            <input type="number" step="any" className="form-control" value={meta} onChange={e => setMeta(e.target.value)} placeholder={indicador.meta_padrao || '0'} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Observação</label>
          <textarea className="form-control" rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Contexto, justificativa..." />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Lancamentos() {
  const { usuario } = useAuth()
  const isAdmin = usuario?.perfil === 'admin'
  const [indicadores, setIndicadores] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [comp, setComp] = useState(competenciaAtual())
  const [deptoFiltro, setDeptoFiltro] = useState(isAdmin ? '' : usuario?.departamento || '')
  const [loading, setLoading] = useState(true)
  const [modalInd, setModalInd] = useState(null)
  const [modalLanc, setModalLanc] = useState(null)

  useEffect(() => { carregar() }, [comp, deptoFiltro])

  async function carregar() {
    setLoading(true)
    const params = new URLSearchParams({ competencia: comp })
    if (deptoFiltro) params.append('departamento', deptoFiltro)
    const [ri, rl] = await Promise.all([
      api.get(`/indicadores?${deptoFiltro ? `departamento=${deptoFiltro}` : ''}`),
      api.get(`/lancamentos?${params}`)
    ])
    setIndicadores(ri.data)
    setLancamentos(rl.data)
    setLoading(false)
  }

  function getLancamento(indicador_id) {
    return lancamentos.find(l => l.indicador_id === indicador_id) || null
  }

  async function excluirLancamento(id) {
    if (!confirm('Excluir este lançamento?')) return
    await api.delete(`/lancamentos/${id}`)
    carregar()
  }

  // Agrupar indicadores por departamento
  const indsPorDepto = {}
  indicadores.forEach(i => {
    if (!indsPorDepto[i.departamento]) indsPorDepto[i.departamento] = []
    indsPorDepto[i.departamento].push(i)
  })

  const totalInds = indicadores.length
  const totalLancados = indicadores.filter(i => getLancamento(i.id)).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Lançamento de Indicadores</h2>
          <p>{totalLancados} de {totalInds} indicadores lançados em {fmtCompetencia(comp)}</p>
        </div>
        <div className="flex-gap">
          {isAdmin && (
            <select className="form-control" value={deptoFiltro} onChange={e => setDeptoFiltro(e.target.value)} style={{ width: 'auto' }}>
              <option value="">Todos os departamentos</option>
              {deptos().map(d => <option key={d} value={d}>{labelDepto(d)}</option>)}
            </select>
          )}
          <input type="month" className="form-control" value={comp} onChange={e => setComp(e.target.value)} style={{ width: 'auto' }} />
        </div>
      </div>

      {/* Progresso geral */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Progresso de preenchimento — {fmtCompetencia(comp)}</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{totalInds > 0 ? Math.round(totalLancados / totalInds * 100) : 0}%</span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-bar-fill" style={{ width: `${totalInds > 0 ? totalLancados / totalInds * 100 : 0}%`, background: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--neutral-400)', marginTop: 6 }}>{totalLancados} lançados · {totalInds - totalLancados} pendentes</div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando indicadores...</div>
      ) : (
        Object.entries(indsPorDepto).map(([depto, inds]) => (
          <div key={depto} className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">{labelDepto(depto)}</span>
              <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>
                {inds.filter(i => getLancamento(i.id)).length}/{inds.length} lançados
              </span>
            </div>
            <div className="card-body">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Indicador</th>
                      <th>Unidade</th>
                      <th>Meta Padrão</th>
                      <th>Realizado</th>
                      <th>Meta Período</th>
                      <th>Atingimento</th>
                      <th>Observação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inds.map(ind => {
                      const lanc = getLancamento(ind.id)
                      const pct = lanc?.meta ? Math.round(lanc.valor_realizado / lanc.meta * 100) : null
                      const status = pct === null ? 'sem_lancamento' : pct >= 100 ? 'acima' : pct >= 80 ? 'atencao' : 'abaixo'
                      return (
                        <tr key={ind.id} style={{ background: lanc ? '' : 'rgba(253,230,138,.06)' }}>
                          <td><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: ind.tipo === 'KRI' ? 'var(--primary)' : 'var(--neutral-200)', color: ind.tipo === 'KRI' ? '#fff' : 'var(--neutral-600)' }}>{ind.tipo}</span></td>
                          <td style={{ fontWeight: 500, maxWidth: 240 }}>{ind.nome}</td>
                          <td className="text-muted">{ind.unidade_medida}</td>
                          <td className="text-muted">{fmtValor(ind.meta_padrao, ind.unidade_medida)}</td>
                          <td><strong>{lanc ? fmtValor(lanc.valor_realizado, ind.unidade_medida) : <span className="text-muted">—</span>}</strong></td>
                          <td className="text-muted">{lanc?.meta ? fmtValor(lanc.meta, ind.unidade_medida) : '—'}</td>
                          <td>
                            {lanc && (
                              <span className={`status-badge s-${status}`}>
                                {pct !== null ? `${pct}%` : '—'}
                              </span>
                            )}
                          </td>
                          <td className="text-muted" style={{ maxWidth: 180, fontSize: 12 }}>{lanc?.observacao || '—'}</td>
                          <td>
                            <div className="flex-gap">
                              {!lanc ? (
                                <button className="btn btn-primary btn-sm" onClick={() => { setModalInd(ind); setModalLanc(null) }}>
                                  + Lançar
                                </button>
                              ) : (
                                <>
                                  <button className="btn-icon" onClick={() => { setModalInd(ind); setModalLanc(lanc) }} title="Editar">
                                    <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                  </button>
                                  {isAdmin && (
                                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => excluirLancamento(lanc.id)} title="Excluir">
                                      <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  )}
                                </>
                              )}
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
        ))
      )}

      {modalInd && (
        <ModalLancamento
          indicador={modalInd}
          lancamento={modalLanc}
          competencia={comp}
          onClose={() => { setModalInd(null); setModalLanc(null) }}
          onSave={() => { setModalInd(null); setModalLanc(null); carregar() }}
        />
      )}
    </div>
  )
}
