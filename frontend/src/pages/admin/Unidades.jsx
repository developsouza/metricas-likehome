import { useState, useEffect } from "react";
import api from "../../services/api";
import { fmtData, labelStatus } from "../../utils/format";
import Paginacao from "../../components/Paginacao";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

const COLUNAS_EXPORT = [
    { key: "empreendimento_nome", label: "Empreendimento" },
    { key: "numero", label: "Nº" },
    { key: "status", label: "Status", fmt: (v) => labelStatus(v) },
    { key: "proprietario_nome", label: "Proprietário" },
    { key: "comissao_adm", label: "% Adm", fmt: (v) => (v != null ? `${v}%` : "") },
    { key: "bpo", label: "BPO" },
    { key: "tipo", label: "Tipo" },
    { key: "data_prospeccao", label: "Data Prospecção", fmt: fmtData },
    { key: "data_reuniao", label: "Data Reunião", fmt: fmtData },
    { key: "data_fechamento", label: "Contrato", fmt: fmtData },
    { key: "data_integracao", label: "Data Integração", fmt: fmtData },
    { key: "data_ativacao", label: "Ativação", fmt: fmtData },
    { key: "data_baixa", label: "Data Baixa", fmt: fmtData },
    { key: "responsavel_nome", label: "Responsável" },
    { key: "taxa_enxoval", label: "Taxa Enxoval" },
    { key: "nome_indicacao", label: "Nome Indicação" },
    { key: "status_pagamento_indicacao", label: "Pgto. Indicação" },
    { key: "observacoes", label: "Observações" },
];

function ModalExport({ dados, onClose }) {
    const [selecionadas, setSelecionadas] = useState(COLUNAS_EXPORT.slice(0, 9).map((c) => c.key));

    function toggleColuna(key) {
        setSelecionadas((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    }

    function selecionarTodas() {
        setSelecionadas(COLUNAS_EXPORT.map((c) => c.key));
    }

    function removerSelecao() {
        setSelecionadas([]);
    }

    function getColunasSelecionadas() {
        return COLUNAS_EXPORT.filter((c) => selecionadas.includes(c.key));
    }

    function exportarExcel() {
        const cols = getColunasSelecionadas();
        const header = cols.map((c) => c.label);
        const rows = dados.map((u) =>
            cols.map((c) => {
                const val = u[c.key] ?? "";
                return c.fmt ? c.fmt(val) || "" : val;
            }),
        );
        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Unidades");
        XLSX.writeFile(wb, "unidades.xlsx");
    }

    function exportarPDF() {
        const cols = getColunasSelecionadas();
        const doc = new jsPDF({ orientation: "landscape" });
        doc.setFontSize(14);
        doc.text("Unidades", 14, 15);
        autoTable(doc, {
            startY: 22,
            head: [cols.map((c) => c.label)],
            body: dados.map((u) =>
                cols.map((c) => {
                    const val = u[c.key] ?? "";
                    return c.fmt ? c.fmt(val) || "" : val;
                }),
            ),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [79, 70, 229] },
        });
        doc.save("unidades.pdf");
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 520 }}>
                <div className="modal-title">Exportar Unidades</div>
                <p style={{ fontSize: "0.85rem", color: "var(--neutral-500)", marginBottom: 12 }}>
                    Selecione as colunas que deseja incluir na exportação ({dados.length} registros)
                </p>

                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "4px 12px" }} onClick={selecionarTodas}>
                        Selecionar todos
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "4px 12px" }} onClick={removerSelecao}>
                        Remover seleção
                    </button>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px 16px",
                        maxHeight: 300,
                        overflowY: "auto",
                        border: "1px solid var(--neutral-200)",
                        borderRadius: 8,
                        padding: "12px 16px",
                        marginBottom: 16,
                    }}
                >
                    {COLUNAS_EXPORT.map((c) => (
                        <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem" }}>
                            <input
                                type="checkbox"
                                checked={selecionadas.includes(c.key)}
                                onChange={() => toggleColuna(c.key)}
                                style={{ width: 15, height: 15, accentColor: "var(--primary)" }}
                            />
                            {c.label}
                        </label>
                    ))}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={exportarExcel}
                        disabled={selecionadas.length === 0}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Excel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={exportarPDF}
                        disabled={selecionadas.length === 0}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                        PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

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
    const [modalExport, setModalExport] = useState(false);
    const [filtroStatus, setFiltroStatus] = useState("");
    const [filtroEmp, setFiltroEmp] = useState("");
    const [busca, setBusca] = useState("");
    const [filtroCampoData, setFiltroCampoData] = useState("data_ativacao");
    const [filtroDataDe, setFiltroDataDe] = useState("");
    const [filtroDataAte, setFiltroDataAte] = useState("");
    const [pagina, setPagina] = useState(1);
    const [ordenacao, setOrdenacao] = useState("");
    const [direcao, setDirecao] = useState("asc");

    function toggleOrdem(campo) {
        if (ordenacao === campo) {
            setDirecao((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setOrdenacao(campo);
            setDirecao("asc");
        }
        setPagina(1);
    }

    useEffect(() => {
        carregarAuxiliares();
    }, []);
    useEffect(() => {
        carregar();
    }, [filtroStatus, filtroEmp, filtroDataDe, filtroDataAte, filtroCampoData]);
    useEffect(() => {
        setPagina(1);
    }, [filtroStatus, filtroEmp, busca, filtroDataDe, filtroDataAte, filtroCampoData]);

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
        if (filtroDataDe || filtroDataAte) {
            params.append("campo_data", filtroCampoData);
            if (filtroDataDe) params.append("data_de", filtroDataDe);
            if (filtroDataAte) params.append("data_ate", filtroDataAte);
        }
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

    const listaOrdenada = ordenacao
        ? [...listaBuscada].sort((a, b) => {
              const va = a[ordenacao] ?? "";
              const vb = b[ordenacao] ?? "";
              const cmp =
                  typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR", { numeric: true });
              return direcao === "asc" ? cmp : -cmp;
          })
        : listaBuscada;

    const totalPaginas = Math.max(1, Math.ceil(listaOrdenada.length / POR_PAGINA));
    const listaPaginada = listaOrdenada.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Unidades</h2>
                    <p>
                        {listaBuscada.length} unidade{listaBuscada.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setModalExport(true)}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Exportar
                    </button>
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
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-body" style={{ paddingBottom: 12 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ flex: "2 1 200px" }}>
                            <label className="form-label">Buscar</label>
                            <input
                                className="form-control"
                                placeholder="Número, empreendimento, proprietário..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: "2 1 160px" }}>
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
                        <div style={{ flex: "1 1 130px" }}>
                            <label className="form-label">Status</label>
                            <select className="form-control" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                                <option value="">Todos</option>
                                {STATUS_LIST.map((s) => (
                                    <option key={s} value={s}>
                                        {labelStatus(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: "1 1 130px" }}>
                            <label className="form-label">Data de</label>
                            <select className="form-control" value={filtroCampoData} onChange={(e) => setFiltroCampoData(e.target.value)}>
                                <option value="data_prospeccao">Prospecção</option>
                                <option value="data_reuniao">Reunião</option>
                                <option value="data_fechamento">Contrato</option>
                                <option value="data_integracao">Integração</option>
                                <option value="data_ativacao">Ativação</option>
                                <option value="data_baixa">Baixa</option>
                            </select>
                        </div>
                        <div style={{ flex: "1 1 130px" }}>
                            <label className="form-label">De</label>
                            <input type="date" className="form-control" value={filtroDataDe} onChange={(e) => setFiltroDataDe(e.target.value)} />
                        </div>
                        <div style={{ flex: "1 1 130px" }}>
                            <label className="form-label">Até</label>
                            <input type="date" className="form-control" value={filtroDataAte} onChange={(e) => setFiltroDataAte(e.target.value)} />
                        </div>
                        {(filtroDataDe || filtroDataAte) && (
                            <div style={{ paddingBottom: 2 }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setFiltroDataDe("");
                                        setFiltroDataAte("");
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
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
                                        {[
                                            { label: "Empreendimento", campo: "empreendimento_nome" },
                                            { label: "Nº", campo: "numero" },
                                            { label: "Status", campo: "status" },
                                            { label: "Proprietário", campo: "proprietario_nome" },
                                            { label: "% Adm", campo: "comissao_adm" },
                                            { label: "BPO", campo: "bpo" },
                                            { label: "Contrato", campo: "data_fechamento" },
                                            { label: "Ativação", campo: "data_ativacao" },
                                            { label: "Responsável", campo: "responsavel_nome" },
                                        ].map(({ label, campo }) => (
                                            <th
                                                key={campo}
                                                onClick={() => toggleOrdem(campo)}
                                                style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                                            >
                                                {label}
                                                <span style={{ marginLeft: 4, opacity: ordenacao === campo ? 1 : 0.3, fontSize: "0.75em" }}>
                                                    {ordenacao === campo ? (direcao === "asc" ? "▲" : "▼") : "⇅"}
                                                </span>
                                            </th>
                                        ))}
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaOrdenada.length === 0 ? (
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
                                total={listaOrdenada.length}
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

            {modalExport && <ModalExport dados={listaOrdenada} onClose={() => setModalExport(false)} />}
        </div>
    );
}
