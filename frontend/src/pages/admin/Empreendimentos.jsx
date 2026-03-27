import { useState, useEffect } from "react";
import api from "../../services/api";
import Paginacao from "../../components/Paginacao";

const POR_PAGINA = 20;

function Modal({ emp, onClose, onSave }) {
    const [form, setForm] = useState(emp || { nome: "", endereco: "", cidade: "", estado: "" });
    const [loading, setLoading] = useState(false);
    function h(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }
    async function salvar() {
        if (!form.nome) return;
        setLoading(true);
        try {
            if (emp?.id) await api.put(`/empreendimentos/${emp.id}`, form);
            else await api.post("/empreendimentos", form);
            onSave();
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 500 }}>
                <div className="modal-title">{emp?.id ? "Editar" : "Novo"} Empreendimento</div>
                <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <input className="form-control" value={form.nome} onChange={(e) => h("nome", e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                    <label className="form-label">Endereço</label>
                    <input className="form-control" value={form.endereco} onChange={(e) => h("endereco", e.target.value)} />
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Cidade</label>
                        <input className="form-control" value={form.cidade} onChange={(e) => h("cidade", e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Estado</label>
                        <input
                            className="form-control"
                            value={form.estado}
                            onChange={(e) => h("estado", e.target.value)}
                            maxLength={2}
                            placeholder="PB"
                        />
                    </div>
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

export default function Empreendimentos() {
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);

    const POR_PAGINA_EMP = 20;

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        setLoading(true);
        const r = await api.get("/empreendimentos");
        setLista(r.data);
        setLoading(false);
    }

    async function desativar(id) {
        if (!confirm("Desativar empreendimento?")) return;
        await api.delete(`/empreendimentos/${id}`);
        carregar();
    }

    const listaFiltrada = busca
        ? lista.filter((e) => e.nome?.toLowerCase().includes(busca.toLowerCase()) || e.cidade?.toLowerCase().includes(busca.toLowerCase()))
        : lista;
    const totalPaginasEmp = Math.max(1, Math.ceil(listaFiltrada.length / POR_PAGINA_EMP));
    const listaPaginadaEmp = listaFiltrada.slice((pagina - 1) * POR_PAGINA_EMP, pagina * POR_PAGINA_EMP);
    useEffect(() => {
        setPagina(1);
    }, [busca]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Empreendimentos</h2>
                    <p>{listaFiltrada.length} cadastrados</p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div>
                        <label className="form-label">Buscar</label>
                        <input className="form-control" placeholder="Nome ou cidade..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditando(null);
                            setModal(true);
                        }}
                    >
                        + Novo
                    </button>
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
                                        <th>Nome</th>
                                        <th>Endereço</th>
                                        <th>Cidade</th>
                                        <th>Estado</th>
                                        <th>Unidades</th>
                                        <th>Ativas</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaPaginadaEmp.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--neutral-400)" }}>
                                                Nenhum empreendimento encontrado
                                            </td>
                                        </tr>
                                    ) : (
                                        listaPaginadaEmp.map((e) => (
                                            <tr key={e.id}>
                                                <td style={{ fontWeight: 600 }}>{e.nome}</td>
                                                <td className="text-muted">{e.endereco || "—"}</td>
                                                <td className="text-muted">{e.cidade || "—"}</td>
                                                <td className="text-muted">{e.estado || "—"}</td>
                                                <td>{e.total_unidades}</td>
                                                <td>
                                                    <span className="status-badge s-ativo">{e.unidades_ativas}</span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${e.ativo ? "s-ativo" : "s-baixa"}`}>
                                                        {e.ativo ? "Ativo" : "Inativo"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex-gap">
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => {
                                                                setEditando(e);
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
                                                            onClick={() => desativar(e.id)}
                                                            title="Desativar"
                                                        >
                                                            <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
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
                                totalPaginas={totalPaginasEmp}
                                total={listaFiltrada.length}
                                porPagina={POR_PAGINA_EMP}
                                onChange={setPagina}
                            />
                        </div>
                    )}
                </div>
            </div>
            {modal && (
                <Modal
                    emp={editando}
                    onClose={() => setModal(false)}
                    onSave={() => {
                        setModal(false);
                        carregar();
                    }}
                />
            )}
        </div>
    );
}
