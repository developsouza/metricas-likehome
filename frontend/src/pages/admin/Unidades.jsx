import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtData, labelStatus } from "../../utils/format";
import Paginacao from "../../components/Paginacao";

const POR_PAGINA = 20;

const STATUS_LIST = ["Prospeccao", "Reuniao", "Fechamento", "Integracao", "Ativo", "Baixa"];
const TIPOS = ["Studio", "Apartamento 1Q", "Apartamento 2Q", "Apartamento 3Q", "Casa 2Q", "Casa 3Q", "Cobertura"];

function classeStatus(s) {
    const m = {
        Prospeccao: "s-prospeccao",
        Reuniao: "s-reuniao",
        Fechamento: "s-fechamento",
        Integracao: "s-integracao",
        Ativo: "s-ativo",
        Baixa: "s-baixa",
    };
    return m[s] || "";
}

const BPO_OPTIONS = ["Proprietario", "LikeHome"];
const PAGAMENTO_OPTIONS = ["Paga", "Não Paga"];

function Modal({ unidade, onClose, onSave, empreendimentos, proprietarios, usuarios }) {
    const [form, setForm] = useState(
        unidade
            ? { ...unidade }
            : {
                  empreendimento_id: "",
                  numero: "",
                  tipo: "",
                  status: "Prospeccao",
                  proprietario_id: "",
                  responsavel_id: "",
                  observacoes: "",
                  data_prospeccao: "",
                  data_reuniao: "",
                  data_fechamento: "",
                  data_integracao: "",
                  data_ativacao: "",
                  data_baixa: "",
                  comissao_adm: "",
                  bpo: "",
                  taxa_enxoval: "",
                  nome_indicacao: "",
                  status_pagamento_indicacao: "",
              },
    );
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    function h(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function salvar() {
        if (!form.empreendimento_id || !form.numero) return setErro("Empreendimento e número são obrigatórios");
        setErro("");
        setLoading(true);
        try {
            if (unidade?.id) await api.put(`/unidades/${unidade.id}`, form);
            else await api.post("/unidades", form);
            onSave();
        } catch (e) {
            setErro(e.response?.data?.error || "Erro ao salvar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 680 }}>
                <div className="modal-title">{unidade?.id ? "Editar Unidade" : "Nova Unidade"}</div>
                {erro && <div className="alert alert-danger">{erro}</div>}
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Empreendimento *</label>
                        <select className="form-control" value={form.empreendimento_id} onChange={(e) => h("empreendimento_id", e.target.value)}>
                            <option value="">Selecione...</option>
                            {empreendimentos.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Número / Identificação *</label>
                        <input
                            className="form-control"
                            value={form.numero}
                            onChange={(e) => h("numero", e.target.value)}
                            placeholder="Ex: 101, Apto B"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tipo</label>
                        <select className="form-control" value={form.tipo || ""} onChange={(e) => h("tipo", e.target.value)}>
                            <option value="">Selecione...</option>
                            {TIPOS.map((t) => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-control" value={form.status} onChange={(e) => h("status", e.target.value)}>
                            {STATUS_LIST.map((s) => (
                                <option key={s} value={s}>
                                    {labelStatus(s)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Proprietário</label>
                        <select className="form-control" value={form.proprietario_id || ""} onChange={(e) => h("proprietario_id", e.target.value)}>
                            <option value="">Selecione...</option>
                            {proprietarios.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Responsável</label>
                        <select className="form-control" value={form.responsavel_id || ""} onChange={(e) => h("responsavel_id", e.target.value)}>
                            <option value="">Selecione...</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">% Administração</label>
                        <input
                            type="number"
                            className="form-control"
                            value={form.comissao_adm ?? ""}
                            onChange={(e) => h("comissao_adm", e.target.value)}
                            placeholder="Ex: 20"
                            min="0"
                            max="100"
                            step="0.5"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">BPO</label>
                        <select className="form-control" value={form.bpo || ""} onChange={(e) => h("bpo", e.target.value)}>
                            <option value="">Selecione...</option>
                            {BPO_OPTIONS.map((b) => (
                                <option key={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Taxa Enxoval</label>
                        <select className="form-control" value={form.taxa_enxoval || ""} onChange={(e) => h("taxa_enxoval", e.target.value)}>
                            <option value="">Selecione...</option>
                            {PAGAMENTO_OPTIONS.map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nome Indicação</label>
                        <input
                            className="form-control"
                            value={form.nome_indicacao || ""}
                            onChange={(e) => h("nome_indicacao", e.target.value)}
                            placeholder="Quem indicou?"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Pgto. Indicação</label>
                        <select
                            className="form-control"
                            value={form.status_pagamento_indicacao || ""}
                            onChange={(e) => h("status_pagamento_indicacao", e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {PAGAMENTO_OPTIONS.map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-grid-3">
                    <div className="form-group">
                        <label className="form-label">Data Prospecção</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_prospeccao || ""}
                            onChange={(e) => h("data_prospeccao", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Reunião</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_reuniao || ""}
                            onChange={(e) => h("data_reuniao", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Fechamento</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_fechamento || ""}
                            onChange={(e) => h("data_fechamento", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Integração</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_integracao || ""}
                            onChange={(e) => h("data_integracao", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Ativação</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_ativacao || ""}
                            onChange={(e) => h("data_ativacao", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Baixa</label>
                        <input type="date" className="form-control" value={form.data_baixa || ""} onChange={(e) => h("data_baixa", e.target.value)} />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Observações</label>
                    <textarea className="form-control" rows={2} value={form.observacoes || ""} onChange={(e) => h("observacoes", e.target.value)} />
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={salvar} disabled={loading}>
                        {loading ? "Salvando..." : "Salvar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Unidades() {
    const [lista, setLista] = useState([]);
    const [empreendimentos, setEmpreendimentos] = useState([]);
    const [proprietarios, setProprietarios] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [filtroStatus, setFiltroStatus] = useState("");
    const [filtroEmp, setFiltroEmp] = useState("");
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);

    useEffect(() => {
        carregarAuxiliares();
    }, []);
    useEffect(() => {
        carregar();
    }, [filtroStatus, filtroEmp]);
    useEffect(() => {
        setPagina(1);
    }, [filtroStatus, filtroEmp, busca]);

    async function carregarAuxiliares() {
        const [re, rp, ru] = await Promise.all([api.get("/empreendimentos"), api.get("/proprietarios"), api.get("/usuarios")]);
        setEmpreendimentos(re.data);
        setProprietarios(rp.data);
        setUsuarios(ru.data);
    }

    async function carregar() {
        setLoading(true);
        const params = new URLSearchParams();
        if (filtroStatus) params.append("status", filtroStatus);
        if (filtroEmp) params.append("empreendimento_id", filtroEmp);
        const r = await api.get(`/unidades?${params}`);
        setLista(r.data);
        setLoading(false);
    }

    async function excluir(id) {
        if (!confirm("Confirma a exclusão desta unidade?")) return;
        await api.delete(`/unidades/${id}`);
        carregar();
    }

    const listaBuscada = busca
        ? lista.filter(
              (u) =>
                  u.numero?.toLowerCase().includes(busca.toLowerCase()) ||
                  u.empreendimento_nome?.toLowerCase().includes(busca.toLowerCase()) ||
                  u.proprietario_nome?.toLowerCase().includes(busca.toLowerCase()) ||
                  u.responsavel_nome?.toLowerCase().includes(busca.toLowerCase()),
          )
        : lista;

    const totalPaginas = Math.max(1, Math.ceil(listaBuscada.length / POR_PAGINA));
    const listaPaginada = listaBuscada.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Unidades</h2>
                    <p>
                        {listaBuscada.length} unidade{listaBuscada.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditando(null);
                        setModal(true);
                    }}
                >
                    + Nova Unidade
                </button>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                    <div className="form-grid" style={{ marginBottom: 0 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Buscar</label>
                            <input
                                className="form-control"
                                placeholder="Número, empreendimento, proprietário..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Filtrar por Empreendimento</label>
                            <select className="form-control" value={filtroEmp} onChange={(e) => setFiltroEmp(e.target.value)}>
                                <option value="">Todos</option>
                                {empreendimentos.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Filtrar por Status</label>
                            <select className="form-control" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                                <option value="">Todos</option>
                                {STATUS_LIST.map((s) => (
                                    <option key={s} value={s}>
                                        {labelStatus(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading">Carregando...</div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Empreendimento</th>
                                        <th>Nº</th>
                                        <th>Status</th>
                                        <th>Proprietário</th>
                                        <th>% Adm</th>
                                        <th>BPO</th>
                                        <th>Contrato</th>
                                        <th>Ativação</th>
                                        <th>Responsável</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaBuscada.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: "center", color: "var(--neutral-400)", padding: "2rem" }}>
                                                Nenhuma unidade encontrada
                                            </td>
                                        </tr>
                                    ) : (
                                        listaPaginada.map((u) => (
                                            <tr key={u.id}>
                                                <td style={{ fontWeight: 600 }}>{u.empreendimento_nome}</td>
                                                <td>{u.numero}</td>
                                                <td>
                                                    <span className={`status-badge ${classeStatus(u.status)}`}>{labelStatus(u.status)}</span>
                                                </td>
                                                <td className="text-muted">{u.proprietario_nome || "—"}</td>
                                                <td className="text-muted" style={{ whiteSpace: "nowrap" }}>
                                                    {u.comissao_adm != null ? `${u.comissao_adm}%` : "—"}
                                                </td>
                                                <td className="text-muted">{u.bpo || "—"}</td>
                                                <td className="text-muted">{fmtData(u.data_fechamento) || "—"}</td>
                                                <td className="text-muted">{fmtData(u.data_ativacao) || "—"}</td>
                                                <td className="text-muted">{u.responsavel_nome || "—"}</td>
                                                <td>
                                                    <div className="flex-gap">
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => {
                                                                setEditando(u);
                                                                setModal(true);
                                                            }}
                                                            title="Editar"
                                                        >
                                                            <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            style={{ color: "var(--danger)" }}
                                                            onClick={() => excluir(u.id)}
                                                            title="Excluir"
                                                        >
                                                            <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <Paginacao
                                pagina={pagina}
                                totalPaginas={totalPaginas}
                                total={listaBuscada.length}
                                porPagina={POR_PAGINA}
                                onChange={setPagina}
                            />
                        </div>
                    )}
                </div>
            </div>

            {modal && (
                <Modal
                    unidade={editando}
                    onClose={() => setModal(false)}
                    onSave={() => {
                        setModal(false);
                        carregar();
                    }}
                    empreendimentos={empreendimentos}
                    proprietarios={proprietarios}
                    usuarios={usuarios}
                />
            )}
        </div>
    );
}
