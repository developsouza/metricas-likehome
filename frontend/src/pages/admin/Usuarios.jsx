import { useState, useEffect } from 'react'
import api from '../../services/api'
import { labelDepto, deptos } from '../../utils/format'

function Modal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || { nome: '', email: '', senha: '', perfil: 'usuario', departamento: '', ativo: 1 })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  function h(k, v) { setForm(f => ({ ...f, [k]: v })) }
  async function salvar() {
    if (!form.nome || !form.email) return setErro('Nome e e-mail obrigatórios')
    if (!user?.id && !form.senha) return setErro('Senha obrigatória para novo usuário')
    setErro(''); setLoading(true)
    try {
      if (user?.id) await api.put(`/usuarios/${user.id}`, form)
      else await api.post('/usuarios', form)
      onSave()
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao salvar')
    } finally { setLoading(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div className="modal-title">{user?.id ? 'Editar' : 'Novo'} Usuário</div>
        {erro && <div className="alert alert-danger">{erro}</div>}
        <div className="form-group"><label className="form-label">Nome *</label><input className="form-control" value={form.nome} onChange={e => h('nome', e.target.value)} autoFocus /></div>
        <div className="form-group"><label className="form-label">E-mail *</label><input type="email" className="form-control" value={form.email} onChange={e => h('email', e.target.value)} /></div>
        <div className="form-group">
          <label className="form-label">{user?.id ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
          <input type="password" className="form-control" value={form.senha || ''} onChange={e => h('senha', e.target.value)} placeholder="••••••••" />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Perfil</label>
            <select className="form-control" value={form.perfil} onChange={e => h('perfil', e.target.value)}>
              <option value="usuario">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Departamento</label>
            <select className="form-control" value={form.departamento || ''} onChange={e => h('departamento', e.target.value)}>
              <option value="">Selecione...</option>
              <option value="Geral">Geral</option>
              {deptos().map(d => <option key={d} value={d}>{labelDepto(d)}</option>)}
            </select>
          </div>
        </div>
        {user?.id && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.ativo} onChange={e => h('ativo', Number(e.target.value))}>
              <option value={1}>Ativo</option>
              <option value={0}>Inativo</option>
            </select>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Usuarios() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => { carregar() }, [])
  async function carregar() {
    setLoading(true)
    const r = await api.get('/usuarios')
    setLista(r.data)
    setLoading(false)
  }
  async function desativar(id) {
    if (!confirm('Desativar usuário?')) return
    await api.delete(`/usuarios/${id}`)
    carregar()
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Usuários</h2><p>{lista.filter(u => u.ativo).length} ativos de {lista.length}</p></div>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setModal(true) }}>+ Novo Usuário</button>
      </div>
      <div className="card">
        <div className="card-body">
          {loading ? <div className="loading">Carregando...</div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Departamento</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  {lista.map(u => (
                    <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.5 }}>
                      <td style={{ fontWeight: 600 }}>{u.nome}</td>
                      <td className="text-muted">{u.email}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: u.perfil === 'admin' ? '#eff6ff' : 'var(--neutral-100)', color: u.perfil === 'admin' ? '#2563eb' : 'var(--neutral-600)' }}>{u.perfil === 'admin' ? '⭐ Admin' : 'Usuário'}</span></td>
                      <td className="text-muted">{labelDepto(u.departamento) || '—'}</td>
                      <td><span className={`status-badge ${u.ativo ? 's-ativo' : 's-baixa'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td>
                        <div className="flex-gap">
                          <button className="btn-icon" onClick={() => { setEditando(u); setModal(true) }}>
                            <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          {u.ativo && <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => desativar(u.id)}>
                            <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {modal && <Modal user={editando} onClose={() => setModal(false)} onSave={() => { setModal(false); carregar() }} />}
    </div>
  )
}
