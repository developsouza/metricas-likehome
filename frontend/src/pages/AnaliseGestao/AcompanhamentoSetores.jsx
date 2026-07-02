import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { deptos, labelDepto } from "../../utils/format";

const STATUS = ["A Fazer", "Em Andamento", "Aguardando Validação", "Concluído", "Cancelado"];
const PRIORIDADES = ["Baixa", "Média", "Alta", "Urgente"];
const POLLING_MS = Number(import.meta.env.VITE_ACTIVITIES_POLLING_MS) || 30000;
const vazio = { titulo: "", descricao: "", status: "A Fazer", prioridade: "Média", responsavel_id: "", prazo: "" };

function ModalAtividade({ atividade, departamento, podeEditar, podeExcluir, onClose, onSaved }) {
  const [form, setForm] = useState(atividade ? { ...atividade, responsavel_id: atividade.responsavel_id || "", prazo: atividade.prazo?.slice(0, 16) || "" } : { ...vazio, departamento });
  const [responsaveis, setResponsaveis] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const id = atividade?.id;

  useEffect(() => {
    api.get(`/atividades/responsaveis?departamento=${encodeURIComponent(departamento)}`).then((r) => setResponsaveis(r.data));
    if (id) Promise.all([api.get(`/atividades/${id}/comentarios`), api.get(`/atividades/${id}/historico`)]).then(([c, h]) => { setComentarios(c.data); setHistorico(h.data); });
  }, [departamento, id]);
  function h(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }
  async function salvar() {
    if (!form.titulo.trim()) return setErro("Informe o título.");
    setSalvando(true); setErro("");
    try {
      const payload = { ...form, responsavel_id: form.responsavel_id || null, prazo: form.prazo || null, departamento };
      if (id) await api.put(`/atividades/${id}`, payload); else await api.post("/atividades", payload);
      onSaved();
    } catch (e) { setErro(e.response?.data?.error || "Não foi possível salvar."); }
    finally { setSalvando(false); }
  }
  async function comentar() {
    if (!comentario.trim()) return;
    try {
      const r = await api.post(`/atividades/${id}/comentarios`, { comentario });
      setComentarios((c) => [...c, r.data]); setComentario("");
    } catch (e) { setErro(e.response?.data?.error || "Não foi possível comentar."); }
  }
  async function excluir() {
    if (!id || !window.confirm(`Excluir permanentemente a atividade “${form.titulo}”? Esta ação não poderá ser desfeita.`)) return;
    setExcluindo(true); setErro("");
    try {
      await api.delete(`/atividades/${id}`);
      onSaved();
    } catch (e) { setErro(e.response?.data?.error || "Não foi possível excluir a atividade."); }
    finally { setExcluindo(false); }
  }

  return <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}><div className="modal-box activity-modal">
    <div className="modal-title">{id ? "Detalhes da atividade" : "Nova atividade"}</div>
    {erro && <div className="alert alert-danger">{erro}</div>}
    <div className="activity-modal-grid"><div>
      <div className="form-group"><label className="form-label">Título *</label><input className="form-control" value={form.titulo} disabled={!podeEditar} onChange={(e) => h("titulo", e.target.value)} autoFocus /></div>
      <div className="form-group"><label className="form-label">Descrição</label><textarea className="form-control" rows="4" value={form.descricao || ""} disabled={!podeEditar} onChange={(e) => h("descricao", e.target.value)} /></div>
      <div className="form-grid">
        <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={form.status} disabled={!podeEditar} onChange={(e) => h("status", e.target.value)}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Prioridade</label><select className="form-control" value={form.prioridade} disabled={!podeEditar} onChange={(e) => h("prioridade", e.target.value)}>{PRIORIDADES.map((p) => <option key={p}>{p}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Responsável</label><select className="form-control" value={form.responsavel_id} disabled={!podeEditar} onChange={(e) => h("responsavel_id", e.target.value)}><option value="">Sem responsável</option>{responsaveis.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Prazo</label><input type="datetime-local" className="form-control" value={form.prazo} disabled={!podeEditar} onChange={(e) => h("prazo", e.target.value)} /></div>
      </div>
      {id && <div className="activity-meta">Criada por {atividade.criado_por_nome} em {new Date(`${atividade.criado_em}Z`).toLocaleString("pt-BR")}</div>}
    </div>
    {id && <div className="activity-side">
      <h4>Comentários</h4><div className="comments-list">{!comentarios.length && <span className="text-muted">Nenhum comentário.</span>}{comentarios.map((c) => <div className="comment" key={c.id}><strong>{c.usuario_nome}</strong><p>{c.comentario}</p><small>{new Date(`${c.criado_em}Z`).toLocaleString("pt-BR")}</small></div>)}</div>
      <div className="comment-form"><textarea className="form-control" rows="2" value={comentario} placeholder="Escreva um comentário..." onChange={(e) => setComentario(e.target.value)} /><button className="btn btn-primary" onClick={comentar}>Comentar</button></div>
      <details className="history"><summary>Histórico ({historico.length})</summary>{historico.map((h) => <div key={h.id}><strong>{h.usuario_nome}</strong> — {h.acao}<small>{new Date(`${h.criado_em}Z`).toLocaleString("pt-BR")}</small></div>)}</details>
    </div>}
    </div>
    <div className="modal-actions activity-modal-actions">
      {podeExcluir && id && <button className="btn btn-danger activity-delete" disabled={excluindo || salvando} onClick={excluir}>{excluindo ? "Excluindo..." : "Excluir atividade"}</button>}
      <div className="activity-modal-actions-main"><button className="btn btn-secondary" onClick={onClose}>Fechar</button>{podeEditar && <button className="btn btn-primary" disabled={salvando || excluindo} onClick={salvar}>{salvando ? "Salvando..." : "Salvar"}</button>}</div>
    </div>
  </div></div>;
}

export default function AcompanhamentoSetores() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const estrategico = ["admin", "analise_gestao"].includes(usuario?.perfil);
  const departamentos = estrategico ? deptos() : [usuario?.departamento].filter(Boolean);
  const [departamento, setDepartamento] = useState(departamentos[0] || "");
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filtros, setFiltros] = useState({ status: "", prioridade: "", responsavel_id: "", inicio: "", fim: "", atrasadas: false, sem_atualizacao_dias: "" });
  const [responsaveis, setResponsaveis] = useState([]);
  const podeCriar = usuario?.perfil !== "analise_gestao";
  const podeEditar = usuario?.perfil === "admin" || usuario?.perfil === "usuario";

  const carregar = useCallback(async (silencioso = false) => {
    if (!departamento) return;
    if (!silencioso) setLoading(true);
    const params = new URLSearchParams({ departamento });
    Object.entries(filtros).forEach(([k, v]) => { if (v) params.set(k, v === true ? "1" : v); });
    try { setAtividades((await api.get(`/atividades?${params}`)).data); } finally { if (!silencioso) setLoading(false); }
  }, [departamento, filtros]);
  useEffect(() => { carregar(); const t = setInterval(() => carregar(true), POLLING_MS); return () => clearInterval(t); }, [carregar]);
  useEffect(() => { if (departamento) api.get(`/atividades/responsaveis?departamento=${encodeURIComponent(departamento)}`).then((r) => setResponsaveis(r.data)); }, [departamento]);
  useEffect(() => {
    const id = Number(searchParams.get("atividade"));
    if (id) api.get(`/atividades/${id}`).then((r) => { setDepartamento(r.data.departamento); setModal(r.data); }).catch(() => {}).finally(() => setSearchParams({}, { replace: true }));
  }, [searchParams, setSearchParams]);

  const resumo = useMemo(() => ({ total: atividades.length, pendentes: atividades.filter((a) => a.status === "A Fazer").length, andamento: atividades.filter((a) => a.status === "Em Andamento").length, validacao: atividades.filter((a) => a.status === "Aguardando Validação").length, concluidas: atividades.filter((a) => a.status === "Concluído").length, atrasadas: atividades.filter((a) => a.atrasada).length }), [atividades]);
  function fecharSalvando() { setModal(null); carregar(); }

  return <div>
    <div className="page-header"><div><h2>Acompanhamento de Setores</h2><p>Atividades, responsáveis e prazos em uma visão única.</p></div>{podeCriar && <button className="btn btn-primary" onClick={() => setModal("nova")}>+ Nova atividade</button>}</div>
    {estrategico && <div className="tabs department-tabs">{departamentos.map((d) => <button key={d} className={`tab-btn ${departamento === d ? "active" : ""}`} onClick={() => setDepartamento(d)}>{labelDepto(d)}</button>)}</div>}
    <div className="activity-summary">{[["Total", resumo.total], ["A fazer", resumo.pendentes], ["Em andamento", resumo.andamento], ["Validação", resumo.validacao], ["Concluídas", resumo.concluidas], ["Atrasadas", resumo.atrasadas]].map(([l, v]) => <div className="summary-card" key={l}><span>{l}</span><strong>{v}</strong></div>)}</div>
    <div className="card activity-filters"><div className="card-body"><select className="form-control" value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}><option value="">Todos os status</option>{STATUS.map((s) => <option key={s}>{s}</option>)}</select><select className="form-control" value={filtros.prioridade} onChange={(e) => setFiltros((f) => ({ ...f, prioridade: e.target.value }))}><option value="">Todas as prioridades</option>{PRIORIDADES.map((p) => <option key={p}>{p}</option>)}</select><select className="form-control" value={filtros.responsavel_id} onChange={(e) => setFiltros((f) => ({ ...f, responsavel_id: e.target.value }))}><option value="">Todos os responsáveis</option>{responsaveis.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}</select><input className="form-control" type="date" value={filtros.inicio} onChange={(e) => setFiltros((f) => ({ ...f, inicio: e.target.value }))} title="Criadas a partir de" /><input className="form-control" type="date" value={filtros.fim} onChange={(e) => setFiltros((f) => ({ ...f, fim: e.target.value }))} title="Criadas até" /><label><input type="checkbox" checked={filtros.atrasadas} onChange={(e) => setFiltros((f) => ({ ...f, atrasadas: e.target.checked }))} /> Só atrasadas</label><select className="form-control" value={filtros.sem_atualizacao_dias} onChange={(e) => setFiltros((f) => ({ ...f, sem_atualizacao_dias: e.target.value }))}><option value="">Qualquer atualização</option><option value="7">Sem atualização há 7 dias</option><option value="15">Sem atualização há 15 dias</option><option value="30">Sem atualização há 30 dias</option></select></div></div>
    {loading ? <div className="loading">Carregando atividades...</div> : <div className="kanban-board">{STATUS.map((status) => { const itens = atividades.filter((a) => a.status === status); return <section className="kanban-column" key={status}><header><strong>{status}</strong><span>{itens.length}</span></header><div>{itens.map((a) => <button key={a.id} className={`activity-card priority-${a.prioridade.toLowerCase().replace("é", "e")}${a.atrasada ? " overdue" : ""}`} onClick={() => setModal(a)}><div><span className="priority-label">{a.prioridade}</span>{a.atrasada ? <span className="overdue-label">Atrasada</span> : null}</div><h4>{a.titulo}</h4>{a.descricao && <p>{a.descricao}</p>}<footer><span>{a.responsavel_nome || "Sem responsável"}</span><span>💬 {a.comentarios_total}</span></footer>{a.prazo && <small>Prazo: {new Date(a.prazo).toLocaleString("pt-BR")}</small>}</button>)}</div></section>; })}</div>}
    {modal && <ModalAtividade atividade={modal === "nova" ? null : modal} departamento={departamento} podeEditar={modal === "nova" ? podeCriar : podeEditar} podeExcluir={usuario?.perfil === "admin"} onClose={() => setModal(null)} onSaved={fecharSalvando} />}
  </div>;
}
