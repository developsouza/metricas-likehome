import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtData, labelStatus } from "../../utils/format";
import { useAuth } from "../../contexts/AuthContext";
import Paginacao from "../../components/Paginacao";

const STATUS_LIST = ["Prospeccao", "Reuniao", "Fechamento", "Integracao", "Ativo", "Baixa"];
const POR_PAGINA = 20;

function ModalUnidade({ unidade, onClose, onSave, empreendimentos, proprietarios, usuarios }) {
    const [form, setForm] = useState(
        unidade || {
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
        },
    );
    const [loading, setLoading] = useState(false);

    function handle(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    async function salvar() {
        setLoading(true);
        try {
            if (unidade?.id) await api.put(`/unidades/${unidade.id}`, form);
            else await api.post("/unidades", form);
            onSave();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 680 }}>
                <div className="modal-title">{unidade?.id ? "Editar Unidade" : "Nova Unidade"}</div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">Empreendimento *</label>
                        <select className="form-control" value={form.empreendimento_id} onChange={(e) => handle("empreendimento_id", e.target.value)}>
                            <option value="">Selecione...</option>
                            {empreendimentos.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Número/Identificação *</label>
                        <input
                            className="form-control"
                            value={form.numero}
                            onChange={(e) => handle("numero", e.target.value)}
                            placeholder="Ex: 101, Apto B"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tipo</label>
                        <select className="form-control" value={form.tipo} onChange={(e) => handle("tipo", e.target.value)}>
                            <option value="">Selecione...</option>
                            {["Studio", "Apartamento 1Q", "Apartamento 2Q", "Apartamento 3Q", "Casa 2Q", "Casa 3Q", "Cobertura"].map((t) => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-control" value={form.status} onChange={(e) => handle("status", e.target.value)}>
                            {STATUS_LIST.map((s) => (
                                <option key={s} value={s}>
                                    {labelStatus(s)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Proprietário</label>
                        <select className="form-control" value={form.proprietario_id} onChange={(e) => handle("proprietario_id", e.target.value)}>
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
                        <select className="form-control" value={form.responsavel_id} onChange={(e) => handle("responsavel_id", e.target.value)}>
                            <option value="">Selecione...</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.nome}
                                </option>
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
                            onChange={(e) => handle("data_prospeccao", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Reunião</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_reuniao || ""}
                            onChange={(e) => handle("data_reuniao", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Fechamento</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_fechamento || ""}
                            onChange={(e) => handle("data_fechamento", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Integração</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_integracao || ""}
                            onChange={(e) => handle("data_integracao", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Ativação</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_ativacao || ""}
                            onChange={(e) => handle("data_ativacao", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Data Baixa</label>
                        <input
                            type="date"
                            className="form-control"
                            value={form.data_baixa || ""}
                            onChange={(e) => handle("data_baixa", e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Observações</label>
                    <textarea
                        className="form-control"
                        rows={2}
                        value={form.observacoes || ""}
                        onChange={(e) => handle("observacoes", e.target.value)}
                    />
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

export default function Pipeline() {
    const { usuario } = useAuth();
    const isAdmin = usuario?.perfil === "admin";
    const [unidades, setUnidades] = useState([]);
    const [empreendimentos, setEmpreendimentos] = useState([]);
    const [proprietarios, setProprietarios] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState("");
    const [filtroEmp, setFiltroEmp] = useState("");
    const [filtroResp, setFiltroResp] = useState("");
    const [filtroTexto, setFiltroTexto] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [unidadeEditando, setUnidadeEditando] = useState(null);
    const [resumo, setResumo] = useState([]);
    const [pagina, setPagina] = useState(1);

    useEffect(() => {
        carregar();
    }, [filtroStatus, filtroEmp, filtroResp]);

    async function carregar() {
        setLoading(true);
        const params = new URLSearchParams();
        if (filtroStatus) params.append("status", filtroStatus);
        if (filtroEmp) params.append("empreendimento_id", filtroEmp);
        if (filtroResp) params.append("responsavel_id", filtroResp);
        const [ru, re, rp, ru2, rRes] = await Promise.all([
            api.get(`/unidades?${params}`),
            api.get("/empreendimentos"),
            api.get("/proprietarios"),
            isAdmin ? api.get("/usuarios") : Promise.resolve({ data: [] }),
            api.get("/unidades/pipeline/resumo"),
        ]);
        setUnidades(ru.data);
        setEmpreendimentos(re.data);
        setProprietarios(rp.data);
        setUsuarios(ru2.data);
        setResumo(rRes.data);
        setLoading(false);
    }

    function editarUnidade(u) {
        setUnidadeEditando(u);
        setModalAberto(true);
    }
    function novaUnidade() {
        setUnidadeEditando(null);
        setModalAberto(true);
    }

    async function excluirUnidade(id) {
        if (!confirm("Confirma a exclusão desta unidade?")) return;
        await api.delete(`/unidades/${id}`);
        carregar();
    }

    const unidadesFiltradas = unidades.filter((u) => {
        if (!filtroTexto) return true;
        const t = filtroTexto.toLowerCase();
        return (
            u.numero?.toLowerCase().includes(t) || u.empreendimento_nome?.toLowerCase().includes(t) || u.proprietario_nome?.toLowerCase().includes(t)
        );
    });

    const totalPaginas = Math.max(1, Math.ceil(unidadesFiltradas.length / POR_PAGINA));
    const unidadesPaginadas = unidadesFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

    // Reset página ao mudar filtros
    useEffect(() => {
        setPagina(1);
    }, [filtroStatus, filtroEmp, filtroResp, filtroTexto]);

    const statCount = (s) => resumo.find((r) => r.status === s)?.total || 0;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Pipeline de Unidades</h2>
                    <p>
                        {unidades.length} unidades · {statCount("Ativo")} ativas
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={novaUnidade}>
                        + Nova Unidade
                    </button>
                )}
            </div>

            {/* Resumo por status */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {STATUS_LIST.map((s) => (
                    <div
                        key={s}
                        onClick={() => setFiltroStatus(filtroStatus === s ? "" : s)}
                        style={{
                            background: "#fff",
                            border: `2px solid ${filtroStatus === s ? "var(--primary)" : "var(--neutral-200)"}`,
                            borderRadius: 8,
                            padding: "10px 16px",
                            cursor: "pointer",
                            minWidth: 110,
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--neutral-900)" }}>{statCount(s)}</div>
                        <div style={{ fontSize: 11, color: "var(--neutral-500)", marginTop: 2 }}>{labelStatus(s)}</div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body" style={{ paddingTop: 16 }}>
                    <div className="filters-row">
                        <div>
                            <label className="form-label">Busca</label>
                            <input
                                className="form-control"
                                placeholder="Buscar unidade, empreendimento..."
                                value={filtroTexto}
                                onChange={(e) => setFiltroTexto(e.target.value)}
                                style={{ minWidth: 240 }}
                            />
                        </div>
                        <div>
                            <label className="form-label">Status</label>
                            <select className="form-control" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                                <option value="">Todos os status</option>
                                {STATUS_LIST.map((s) => (
                                    <option key={s} value={s}>
                                        {labelStatus(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Empreendimento</label>
                            <select className="form-control" value={filtroEmp} onChange={(e) => setFiltroEmp(e.target.value)}>
                                <option value="">Todos</option>
                                {empreendimentos.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {isAdmin && (
                            <div>
                                <label className="form-label">Responsável</label>
                                <select className="form-control" value={filtroResp} onChange={(e) => setFiltroResp(e.target.value)}>
                                    <option value="">Todos</option>
                                    {usuarios.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div style={{ alignSelf: "flex-end" }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setFiltroStatus("");
                                    setFiltroEmp("");
                                    setFiltroResp("");
                                    setFiltroTexto("");
                                }}
                            >
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading">Carregando...</div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Unidade</th>
                                        <th>Empreendimento</th>
                                        <th>Tipo</th>
                                        <th>Proprietário</th>
                                        <th>Responsável</th>
                                        <th>Status</th>
                                        <th>Data Prospecção</th>
                                        <th>Data Reunião</th>
                                        <th>Data Fechamento</th>
                                        <th>Data Integração</th>
                                        <th>Data Ativação</th>
                                        {isAdmin && <th>Ações</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {unidadesFiltradas.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} style={{ textAlign: "center", padding: 48, color: "var(--neutral-400)" }}>
                                                Nenhuma unidade encontrada
                                            </td>
                                        </tr>
                                    ) : (
                                        unidadesPaginadas.map((u) => (
                                            <tr key={u.id}>
                                                <td style={{ fontWeight: 600 }}>{u.numero}</td>
                                                <td>{u.empreendimento_nome}</td>
                                                <td className="text-muted">{u.tipo || "—"}</td>
                                                <td>{u.proprietario_nome || <span className="text-muted">—</span>}</td>
                                                <td className="text-muted">{u.responsavel_nome || "—"}</td>
                                                <td>
                                                    <span className={`status-badge s-${u.status.toLowerCase()}`}>{labelStatus(u.status)}</span>
                                                </td>
                                                <td className="text-muted">{fmtData(u.data_prospeccao)}</td>
                                                <td className="text-muted">{fmtData(u.data_reuniao)}</td>
                                                <td className="text-muted">{fmtData(u.data_fechamento)}</td>
                                                <td className="text-muted">{fmtData(u.data_integracao)}</td>
                                                <td className="text-muted">{fmtData(u.data_ativacao)}</td>
                                                {isAdmin && (
                                                    <td>
                                                        <div className="flex-gap">
                                                            <button className="btn-icon" onClick={() => editarUnidade(u)} title="Editar">
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
                                                                onClick={() => excluirUnidade(u.id)}
                                                                title="Excluir"
                                                                style={{ color: "var(--danger)" }}
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
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <Paginacao
                                pagina={pagina}
                                totalPaginas={totalPaginas}
                                total={unidadesFiltradas.length}
                                porPagina={POR_PAGINA}
                                onChange={setPagina}
                            />
                        </div>
                    )}
                </div>
            </div>

            {modalAberto && (
                <ModalUnidade
                    unidade={unidadeEditando}
                    empreendimentos={empreendimentos}
                    proprietarios={proprietarios}
                    usuarios={usuarios}
                    onClose={() => setModalAberto(false)}
                    onSave={() => {
                        setModalAberto(false);
                        carregar();
                    }}
                />
            )}
        </div>
    );
}
