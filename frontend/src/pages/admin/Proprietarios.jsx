import { useState, useEffect } from "react";
import api from "../../services/api";

function Modal({ prop, onClose, onSave }) {
    const [form, setForm] = useState(prop || { nome: "", cpf_cnpj: "", email: "", telefone: "" });
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    function h(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function salvar() {
        if (!form.nome) return setErro("Nome é obrigatório");
        setErro("");
        setLoading(true);
        try {
            if (prop?.id) await api.put(`/proprietarios/${prop.id}`, form);
            else await api.post("/proprietarios", form);
            onSave();
        } catch (e) {
            setErro(e.response?.data?.error || "Erro ao salvar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 480 }}>
                <div className="modal-title">{prop?.id ? "Editar" : "Novo"} Proprietário</div>
                {erro && <div className="alert alert-danger">{erro}</div>}
                <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <input className="form-control" value={form.nome} onChange={(e) => h("nome", e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                    <label className="form-label">CPF / CNPJ</label>
                    <input
                        className="form-control"
                        value={form.cpf_cnpj || ""}
                        onChange={(e) => h("cpf_cnpj", e.target.value)}
                        placeholder="000.000.000-00"
                    />
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">E-mail</label>
                        <input type="email" className="form-control" value={form.email || ""} onChange={(e) => h("email", e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Telefone</label>
                        <input
                            className="form-control"
                            value={form.telefone || ""}
                            onChange={(e) => h("telefone", e.target.value)}
                            placeholder="(00) 00000-0000"
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

export default function Proprietarios() {
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [busca, setBusca] = useState("");

    useEffect(() => {
        carregar();
    }, []);

    async function carregar() {
        setLoading(true);
        const r = await api.get("/proprietarios");
        setLista(r.data);
        setLoading(false);
    }

    async function excluir(id) {
        if (!confirm("Confirma a exclusão deste proprietário?")) return;
        try {
            await api.delete(`/proprietarios/${id}`);
            carregar();
        } catch (e) {
            alert(e.response?.data?.error || "Erro ao excluir");
        }
    }

    const listaFiltrada = busca
        ? lista.filter(
              (p) =>
                  p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                  p.cpf_cnpj?.toLowerCase().includes(busca.toLowerCase()) ||
                  p.email?.toLowerCase().includes(busca.toLowerCase()) ||
                  p.telefone?.toLowerCase().includes(busca.toLowerCase()),
          )
        : lista;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Proprietários</h2>
                    <p>
                        {listaFiltrada.length} cadastrado{listaFiltrada.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditando(null);
                        setModal(true);
                    }}
                >
                    + Novo Proprietário
                </button>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Buscar</label>
                        <input
                            className="form-control"
                            placeholder="Nome, CPF/CNPJ, e-mail ou telefone..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
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
                                        <th>Nome</th>
                                        <th>CPF / CNPJ</th>
                                        <th>E-mail</th>
                                        <th>Telefone</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaFiltrada.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: "center", color: "var(--neutral-400)", padding: "2rem" }}>
                                                Nenhum proprietário encontrado
                                            </td>
                                        </tr>
                                    ) : (
                                        listaFiltrada.map((p) => (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: 600 }}>{p.nome}</td>
                                                <td className="text-muted">{p.cpf_cnpj || "—"}</td>
                                                <td className="text-muted">{p.email || "—"}</td>
                                                <td className="text-muted">{p.telefone || "—"}</td>
                                                <td>
                                                    <div className="flex-gap">
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => {
                                                                setEditando(p);
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
                                                            onClick={() => excluir(p.id)}
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
                        </div>
                    )}
                </div>
            </div>

            {modal && (
                <Modal
                    prop={editando}
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
