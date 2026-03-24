import { useState, useEffect } from 'react'
import api from '../../services/api'
import { labelDepto, deptos, fmtValor } from '../../utils/format'

function Modal({ ind, onClose, onSave }) {
  const [form, setForm] = useState(ind || { departamento: '', tipo: 'KPI', nome: '', descricao: '', unidade_medida: 'unidade', meta_padrao: '' })
  const [loading, setLoading] = useState(false)
  function h(k, v) { setForm(f => ({ ...f, [k]: v })) }
  async function salvar() {
    if (!form.departamento || !form.nome) return
    setLoading(true)
    try {
      if (ind?.id) await api.put(`/indicadores/${ind.id}`, form)
      else await api.post('/indicadores', form)
      onSave()
    } finally { setLoading(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div className="modal-title">{ind?.id ? 'Editar' : 'Novo'} Indicador</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Departamento *</label>
            <select className="form-control" value={form.departamento} onChange={e => h('departamento', e.target.value)}>
              <option value="">Selecione...</option>
              {deptos().map(d => <option key={d} value={d}>{labelDepto(d)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tipo *</label>
            <select className="form-control" value={form.tipo} onChange={e => h('tipo', e.target.value)}>
              <option value="KRI">KRI</option>
              <option value="KPI">KPI</option>
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Nome *</label><input className="form-control" value={form.nome} onChange={e => h('nome', e.target.value)} autoFocus /></div>
        <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-control" rows={2} value={form.descricao || ''} onChange={e => h('descricao', e.target.value)} /></div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Unidade de Medida</label>
            <select className="form-control" value={form.unidade_medida} onChange={e => h('unidade_medida', e.target.value)}>
              {['unidade', 'R$', '%', 'dias', 'horas', 'nota', 'posição'].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Meta Padrão</label>
            <input type="number" step="any" className="form-control" value={form.meta_padrao || ''} onChange={e => h('meta_padrao', e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Indicadores() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [deptoFiltro, setDeptoFiltro] = useState('')

  useEffect(() => { carregar() }, [deptoFiltro])
  async function carregar() {
    setLoading(true)
    const params = deptoFiltro ? `?departamento=${deptoFiltro}` : ''
    const r = await api.get(`/indicadores${params}`)
    setLista(r.data)
    setLoading(false)
  }

  async function toggleAtivo(ind) {
    await api.put(`/indicadores/${ind.id}`, { ativo: ind.ativo ? 0 : 1 })
    carregar()
  }

  const porDepto = {}
  lista.forEach(i => { if (!porDepto[i.departamento]) porDepto[i.departamento] = []; porDepto[i.departamento].push(i) })

  return (
    <div>
      <div className="page-header">
        <div><h2>Indicadores</h2><p>{lista.filter(i => i.ativo).length} ativos de {lista.length}</p></div>
        <div className="flex-gap">
          <select className="form-control" value={deptoFiltro} onChange={e => setDeptoFiltro(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Todos os departamentos</option>
            {deptos().map(d => <option key={d} value={d}>{labelDepto(d)}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setEditando(null); setModal(true) }}>+ Novo</button>
        </div>
      </div>

      {loading ? <div className="loading">Carregando...</div> : (
        Object.entries(porDepto).map(([depto, inds]) => (
          <div key={depto} className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">{labelDepto(depto)}</span></div>
            <div className="card-body">
              <div className="table-container">
                <table>
                  <thead><tr><th>Tipo</th><th>Nome</th><th>Descrição</th><th>Unidade</th><th>Meta Padrão</th><th>Status</th><th>Ações</th></tr></thead>
                  <tbody>
                    {inds.map(i => (
                      <tr key={i.id} style={{ opacity: i.ativo ? 1 : 0.5 }}>
                        <td><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: i.tipo === 'KRI' ? 'var(--primary)' : 'var(--neutral-200)', color: i.tipo === 'KRI' ? '#fff' : 'var(--neutral-600)' }}>{i.tipo}</span></td>
                        <td style={{ fontWeight: 500 }}>{i.nome}</td>
                        <td className="text-muted" style={{ fontSize: 12 }}>{i.descricao || '—'}</td>
                        <td className="text-muted">{i.unidade_medida}</td>
                        <td className="text-muted">{fmtValor(i.meta_padrao, i.unidade_medida)}</td>
                        <td><span className={`status-badge ${i.ativo ? 's-ativo' : 's-baixa'}`}>{i.ativo ? 'Ativo' : 'Inativo'}</span></td>
                        <td>
                          <div className="flex-gap">
                            <button className="btn-icon" onClick={() => { setEditando(i); setModal(true) }}>
                              <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className="btn-icon" onClick={() => toggleAtivo(i)} title={i.ativo ? 'Desativar' : 'Ativar'} style={{ color: i.ativo ? 'var(--danger)' : 'var(--success)' }}>
                              <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {modal && <Modal ind={editando} onClose={() => setModal(false)} onSave={() => { setModal(false); carregar() }} />}
    </div>
  )
}
