import { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../services/api";
import Paginacao from "../../components/Paginacao";
import SortableHeader from "../../components/SortableHeader";
import { useOrdenacao } from "../../utils/table";
import { fmtCompetencia, fmtData } from "../../utils/format";
import { adicionarCabecalhoPdf, adicionarRodapesPdf, BRAND_RGB, carregarLogoPdf } from "../../utils/pdfBranding";
import { SETORES_CHECKUP, calcularSaude, camposVisiveis, classificacaoSaude } from "./checkupConfig";

const POR_PAGINA = 20;
const STATUS_ACAO = ["Pendente", "Em andamento", "Aguardando terceiro", "Resolvido", "Cancelado"];
const PRIORIDADES = ["Baixa", "Média", "Alta", "Crítica"];

function classeSaude(valor) {
  if (valor == null) return "checkup-pending";
  if (valor >= 75) return "checkup-good";
  if (valor >= 60) return "checkup-warning";
  return "checkup-critical";
}

function CampoResposta({ campo, valor, disabled, onChange }) {
  const props = { className: "form-control", value: valor ?? "", disabled, onChange: (e) => onChange(e.target.value) };
  return <div className={`form-group checkup-field ${campo.tipo === "textarea" ? "wide" : ""}`}>
    <label className="form-label">{campo.label}{campo.obrigatorio ? " *" : ""}</label>
    {campo.tipo === "select" ? <select {...props}><option value="">Selecione...</option>{campo.opcoes.map((opcao) => <option key={opcao}>{opcao}</option>)}</select>
      : campo.tipo === "textarea" ? <textarea {...props} rows="3" />
      : <div className="checkup-input-suffix"><input {...props} type={campo.tipo || "text"} step={campo.tipo === "number" ? "any" : undefined} />{campo.sufixo && <span>{campo.sufixo}</span>}</div>}
  </div>;
}

function FormularioSetor({ config, setor, onSaved }) {
  const [respostas, setRespostas] = useState(setor.respostas || {});
  const [erro, setErro] = useState(""); const [aviso, setAviso] = useState(""); const [salvando, setSalvando] = useState(false);
  useEffect(() => { setRespostas(setor.respostas || {}); setErro(""); }, [setor.id, setor.respostas]);
  const visiveis = camposVisiveis(config, respostas); const saude = calcularSaude(config, respostas);
  async function salvar(concluir) {
    if (concluir) { const faltantes = visiveis.filter((c) => c.obrigatorio && (respostas[c.id] == null || respostas[c.id] === "")); if (faltantes.length) return setErro(`Preencha: ${faltantes.map((c) => c.label).join(", ")}.`); }
    setSalvando(true); setErro(""); try { await api.put(`/checkups/${setor.diagnostico_id}/setores/${encodeURIComponent(config.id)}`, { respostas, saude, concluir }); await onSaved(); } catch (e) { setErro(e.response?.data?.error || "Não foi possível salvar."); } finally { setSalvando(false); }
  }
  async function criarAcao(campo) {
    try {
      await api.post(`/checkups/${setor.diagnostico_id}/acoes`, { setor: config.id, titulo: `Tratar: ${campo.label}`, problema_relacionado: `${campo.label}: ${respostas[campo.id]}`, prioridade: (campo.pontuacao[respostas[campo.id]] ?? 100) <= 20 ? "Crítica" : "Alta", status: "Pendente" });
      setAviso("Plano de ação criado. Complete responsável e prazo na aba Plano de Ação."); onSaved();
    } catch (e) { setErro(e.response?.data?.error || "Não foi possível criar o plano de ação."); }
  }
  const tendencia = config.id === "Precificação" && respostas.rentabilidade_anterior !== "" && respostas.rentabilidade_atual !== "" ? Number(respostas.rentabilidade_atual) > Number(respostas.rentabilidade_anterior) ? "Crescimento" : Number(respostas.rentabilidade_atual) < Number(respostas.rentabilidade_anterior) ? "Queda" : "Estável" : null;
  return <div className="checkup-sector-layout"><div className="card"><div className="card-header"><div><span className="card-title">Diagnóstico de {config.id}</span><p className="text-muted">Responda somente à análise que exige avaliação humana.</p></div><div className={`checkup-score ${classeSaude(saude)}`}><strong>{saude == null ? "—" : `${saude}%`}</strong><span>{classificacaoSaude(saude)}</span></div></div><div className="card-body">{tendencia && <div className={`checkup-trend ${tendencia === "Queda" ? "down" : tendencia === "Crescimento" ? "up" : ""}`}>Tendência calculada: <strong>{tendencia}</strong></div>}<div className="checkup-form-grid">{visiveis.map((campo) => <div key={campo.id} className={campo.tipo === "textarea" ? "wide" : ""}><CampoResposta campo={campo} valor={respostas[campo.id]} disabled={!setor.pode_responder} onChange={(valor) => { setAviso(""); setRespostas((r) => ({ ...r, [campo.id]: valor })); }} />{setor.pode_responder && campo.pontuacao && respostas[campo.id] && (campo.pontuacao[respostas[campo.id]] ?? 100) < 75 && <button className="btn btn-secondary btn-sm checkup-create-action" onClick={() => criarAcao(campo)}>+ Adicionar ao Plano de Ação</button>}</div>)}</div>{erro && <div className="alert alert-danger">{erro}</div>}{aviso && <div className="alert alert-success">{aviso}</div>}{setor.pode_responder && <div className="modal-actions"><button className="btn btn-secondary" disabled={salvando} onClick={() => salvar(false)}>Salvar rascunho</button><button className="btn btn-primary" disabled={salvando} onClick={() => salvar(true)}>{salvando ? "Salvando..." : "Concluir setor"}</button></div>}</div></div></div>;
}

function PlanoAcao({ diagnostico, usuarios, onSaved }) {
  const vazio = { setor: "Precificação", titulo: "", descricao: "", problema_relacionado: "", prioridade: "Média", responsavel_id: "", prazo: "", status: "Pendente", observacoes: "" };
  const [form, setForm] = useState(vazio); const [editando, setEditando] = useState(null); const [erro, setErro] = useState("");
  function h(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }
  async function salvar() { if (!form.titulo.trim()) return setErro("Informe o título da ação."); try { if (editando) await api.put(`/checkups/${diagnostico.id}/acoes/${editando}`, form); else await api.post(`/checkups/${diagnostico.id}/acoes`, form); setForm(vazio); setEditando(null); setErro(""); onSaved(); } catch (e) { setErro(e.response?.data?.error || "Não foi possível salvar a ação."); } }
  function editar(acao) { setEditando(acao.id); setForm({ ...acao, responsavel_id: acao.responsavel_id || "", prazo: acao.prazo || "" }); }
  return <div className="checkup-action-grid"><div className="card"><div className="card-header"><span className="card-title">{editando ? "Editar plano de ação" : "Novo plano de ação"}</span></div><div className="card-body"><div className="form-grid"><div className="form-group"><label className="form-label">Setor *</label><select className="form-control" value={form.setor} onChange={(e) => h("setor", e.target.value)}>{SETORES_CHECKUP.map((s) => <option key={s.id}>{s.id}</option>)}</select></div><div className="form-group"><label className="form-label">Prioridade</label><select className="form-control" value={form.prioridade} onChange={(e) => h("prioridade", e.target.value)}>{PRIORIDADES.map((v) => <option key={v}>{v}</option>)}</select></div><div className="form-group"><label className="form-label">Responsável</label><select className="form-control" value={form.responsavel_id} onChange={(e) => h("responsavel_id", e.target.value)}><option value="">Não definido</option>{usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></div><div className="form-group"><label className="form-label">Prazo</label><input className="form-control" type="date" value={form.prazo || ""} onChange={(e) => h("prazo", e.target.value)} /></div></div><div className="form-group"><label className="form-label">Título *</label><input className="form-control" value={form.titulo} onChange={(e) => h("titulo", e.target.value)} /></div><div className="form-group"><label className="form-label">Problema relacionado</label><textarea className="form-control" rows="2" value={form.problema_relacionado || ""} onChange={(e) => h("problema_relacionado", e.target.value)} /></div><div className="form-group"><label className="form-label">Descrição / observações</label><textarea className="form-control" rows="3" value={form.descricao || ""} onChange={(e) => h("descricao", e.target.value)} /></div>{erro && <div className="alert alert-danger">{erro}</div>}<div className="modal-actions">{editando && <button className="btn btn-secondary" onClick={() => { setEditando(null); setForm(vazio); }}>Cancelar</button>}<button className="btn btn-primary" onClick={salvar}>Salvar ação</button></div></div></div><div className="card"><div className="card-header"><span className="card-title">Ações registradas</span><span className="status-badge">{diagnostico.acoes.length}</span></div><div className="card-body"><div className="checkup-actions-list">{!diagnostico.acoes.length && <div className="empty-state">Nenhum plano de ação registrado.</div>}{diagnostico.acoes.map((acao) => <button className="checkup-action-item" key={acao.id} onClick={() => editar(acao)}><div><span className={`priority-label priority-${acao.prioridade.toLowerCase().replace("í", "i")}`}>{acao.prioridade}</span><strong>{acao.titulo}</strong></div><p>{acao.problema_relacionado || acao.descricao || "Sem descrição"}</p><footer><span>{acao.setor} · {acao.responsavel_nome || "Sem responsável"}</span><span>{acao.prazo ? fmtData(acao.prazo) : "Sem prazo"} · {acao.status}</span></footer></button>)}</div></div></div></div>;
}

function VisaoGeral({ diagnostico, usuarios, onSaved }) {
  const [form, setForm] = useState({ status: diagnostico.status, responsavel_geral_id: diagnostico.responsavel_geral_id || "", parecer: diagnostico.parecer || "", recomendacoes: diagnostico.recomendacoes || "", prioridades_proximo_periodo: diagnostico.prioridades_proximo_periodo || "" });
  const riscos = useMemo(() => diagnostico.setores.flatMap((setor) => { const config = SETORES_CHECKUP.find((s) => s.id === setor.setor); if (!config) return []; return config.campos.filter((c) => c.pontuacao && (c.pontuacao[setor.respostas[c.id]] ?? 100) < 75).map((c) => ({ setor: setor.setor, texto: c.label, perda: 100 - (c.pontuacao[setor.respostas[c.id]] ?? 0) })); }).sort((a, b) => b.perda - a.perda), [diagnostico.setores]);
  async function salvarParecer() { await api.put(`/checkups/${diagnostico.id}`, form); onSaved(); }
  return <><div className="checkup-overview-grid"><div className={`checkup-health-card ${classeSaude(diagnostico.saude_geral)}`}><span>Saúde da acomodação</span><strong>{diagnostico.saude_geral == null ? "—" : `${diagnostico.saude_geral}%`}</strong><b>{diagnostico.classificacao || "Pendente"}</b><div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${diagnostico.saude_geral || 0}%` }} /></div></div><div className="card"><div className="card-header"><span className="card-title">Preenchimento dos setores</span><strong>{diagnostico.preenchimento}%</strong></div><div className="card-body checkup-sector-status">{diagnostico.setores.map((s) => <div key={s.id}><span className={`checkup-dot ${s.status === "Concluído" ? "done" : ""}`} /><div><strong>{s.setor}</strong><small>{s.status === "Concluído" ? `${s.responsavel_nome} · ${new Date(`${s.atualizado_em}Z`).toLocaleString("pt-BR")}` : s.status}</small></div><b>{s.saude == null ? "—" : `${s.saude}%`}</b></div>)}</div></div></div><div className="checkup-overview-grid"><div className="card"><div className="card-header"><span className="card-title">Principais riscos identificados</span></div><div className="card-body checkup-risk-list">{!riscos.length && <div className="empty-state">Nenhum risco calculado nas respostas atuais.</div>}{riscos.slice(0, 6).map((r, i) => <div key={`${r.setor}-${i}`}><span className={r.perda >= 70 ? "critical" : r.perda >= 40 ? "high" : "medium"}>{r.perda >= 70 ? "CRÍTICO" : r.perda >= 40 ? "ALTO" : "MÉDIO"}</span><div><strong>{r.setor}</strong><p>{r.texto}</p></div></div>)}</div></div><div className="card"><div className="card-header"><span className="card-title">Indicadores imediatos</span></div><div className="card-body checkup-mini-kpis"><div><span>Planos abertos</span><strong>{diagnostico.acoes.filter((a) => !["Resolvido", "Cancelado"].includes(a.status)).length}</strong></div><div><span>Setores concluídos</span><strong>{diagnostico.setores.filter((s) => s.status === "Concluído").length}/{diagnostico.setores.length}</strong></div><div><span>Status</span><strong>{diagnostico.status}</strong></div><div><span>Período</span><strong>{fmtCompetencia(diagnostico.periodo)}</strong></div></div></div></div>{diagnostico.pode_gerenciar && diagnostico.status !== "Concluído" && <div className="card"><div className="card-header"><span className="card-title">Parecer final do analista</span></div><div className="card-body"><div className="form-grid"><div className="form-group"><label className="form-label">Status do diagnóstico</label><select className="form-control" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{["Em elaboração", "Aguardando setores", "Em análise"].map((v) => <option key={v}>{v}</option>)}</select></div><div className="form-group"><label className="form-label">Responsável geral</label><select className="form-control" value={form.responsavel_geral_id} onChange={(e) => setForm((f) => ({ ...f, responsavel_geral_id: e.target.value }))}><option value="">Não definido</option>{usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></div></div>{[["parecer", "Conclusão geral da análise"], ["recomendacoes", "Recomendações estratégicas"], ["prioridades_proximo_periodo", "Prioridades do próximo período"]].map(([id, label]) => <div className="form-group" key={id}><label className="form-label">{label}</label><textarea className="form-control" rows="3" value={form[id]} onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))} /></div>)}<div className="modal-actions"><button className="btn btn-primary" onClick={salvarParecer}>Salvar parecer</button></div></div></div>}</>;
}

async function gerarPdf(diagnostico) {
  const logo = await carregarLogoPdf();
  const doc = new jsPDF();
  const margem = 14;
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const acoesAbertas = diagnostico.acoes.filter((acao) => !["Resolvido", "Cancelado"].includes(acao.status)).length;
  const setoresConcluidos = diagnostico.setores.filter((setor) => setor.status === "Concluído").length;
  const novaPagina = (titulo = "RELATÓRIO DE CHECKUP") => { doc.addPage(); adicionarCabecalhoPdf(doc, titulo, logo); return 42; };
  const tabelaEstilos = { fontSize: 8.2, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: .15, textColor: [51, 65, 85] };
  const opcoesTabela = { theme: "grid", headStyles: { fillColor: BRAND_RGB, textColor: 255, fontStyle: "bold" }, styles: tabelaEstilos, margin: { top: 42, bottom: 18 } };

  adicionarCabecalhoPdf(doc, "RELATÓRIO DE CHECKUP", logo);
  doc.setFillColor(255, 240, 242);
  doc.roundedRect(margem, 42, 48, 42, 3, 3, "F");
  doc.setTextColor(...BRAND_RGB); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  doc.text("SAÚDE GERAL", margem + 6, 51);
  doc.setFontSize(23); doc.text(diagnostico.saude_geral == null ? "-" : `${diagnostico.saude_geral}%`, margem + 6, 66);
  doc.setFontSize(8); doc.setTextColor(185, 47, 71); doc.text(diagnostico.classificacao || "Pendente", margem + 6, 75);
  doc.setFillColor(252, 200, 209); doc.roundedRect(margem + 6, 78, 36, 2.5, 1, 1, "F");
  doc.setFillColor(...BRAND_RGB); doc.roundedRect(margem + 6, 78, Math.max(0, Math.min(36, (diagnostico.saude_geral || 0) * .36)), 2.5, 1, 1, "F");

  doc.setTextColor(30, 41, 59); doc.setFontSize(11); doc.text("Resumo do diagnóstico", 70, 49);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(71, 85, 105);
  doc.text(`Unidade: ${diagnostico.empreendimento_nome} - ${diagnostico.unidade_numero}`, 70, 57);
  doc.text(`Proprietário: ${diagnostico.proprietario_nome || "Não informado"}`, 70, 64);
  doc.text(`Período: ${fmtCompetencia(diagnostico.periodo)}`, 70, 71);
  doc.text(`Responsável: ${diagnostico.responsavel_geral_nome || "Não definido"}`, 70, 78);

  const indicadores = [["Preenchimento", `${diagnostico.preenchimento}%`], ["Setores concluídos", `${setoresConcluidos}/${diagnostico.setores.length}`], ["Ações em aberto", String(acoesAbertas)]];
  const larguraCard = (largura - (margem * 2) - 8) / 3;
  indicadores.forEach(([rotulo, valor], indice) => {
    const x = margem + indice * (larguraCard + 4);
    doc.setFillColor(248, 250, 252); doc.roundedRect(x, 92, larguraCard, 22, 2, 2, "F");
    doc.setTextColor(100, 116, 139); doc.setFontSize(7.5); doc.text(rotulo.toUpperCase(), x + 4, 100);
    doc.setTextColor(30, 41, 59); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(valor, x + 4, 109);
  });

  doc.setTextColor(30, 41, 59); doc.setFontSize(11); doc.text("Visão por área", margem, 126);
  autoTable(doc, {
    ...opcoesTabela,
    startY: 130,
    head: [["Área", "Saúde", "Situação", "Responsável", "Status"]],
    body: diagnostico.setores.map((setor) => [setor.setor, setor.saude == null ? "-" : `${setor.saude}%`, classificacaoSaude(setor.saude), setor.responsavel_nome || "Pendente", setor.status]),
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 20, halign: "center" }, 2: { cellWidth: 31 }, 3: { cellWidth: 49 }, 4: { cellWidth: 34 } },
  });

  let y = novaPagina("ANÁLISE DETALHADA POR ÁREA");
  diagnostico.setores.forEach((setor) => {
    if (y > altura - 58) y = novaPagina("ANÁLISE DETALHADA POR ÁREA");
    doc.setTextColor(30, 41, 59); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(`${setor.setor}  |  ${setor.saude ?? "-"}%`, margem, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(`Situação: ${classificacaoSaude(setor.saude)} · ${setor.status}`, margem, y + 5);
    const config = SETORES_CHECKUP.find((s) => s.id === setor.setor);
    const respostas = (config?.campos || []).filter((campo) => setor.respostas[campo.id] !== undefined && setor.respostas[campo.id] !== "").map((campo) => [campo.label, String(setor.respostas[campo.id])]);
    autoTable(doc, { ...opcoesTabela, startY: y + 8, head: [["Item analisado", "Resposta"]], body: respostas.length ? respostas : [["Nenhuma resposta registrada", "-"]], columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 97 } } });
    y = doc.lastAutoTable.finalY + 11;
  });

  y = novaPagina("PLANO DE AÇÃO E CONCLUSÃO");
  doc.setTextColor(30, 41, 59); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Plano de ação", margem, y);
  autoTable(doc, { ...opcoesTabela, startY: y + 5, head: [["Ação", "Setor", "Prioridade", "Responsável", "Prazo", "Status"]], body: diagnostico.acoes.length ? diagnostico.acoes.map((acao) => [acao.titulo, acao.setor, acao.prioridade, acao.responsavel_nome || "-", fmtData(acao.prazo), acao.status]) : [["Nenhuma ação registrada", "-", "-", "-", "-", "-"]], columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 28 }, 2: { cellWidth: 24 }, 3: { cellWidth: 37 }, 4: { cellWidth: 20 }, 5: { cellWidth: 22 } } });
  y = doc.lastAutoTable.finalY + 13;
  if (y > altura - 54) y = novaPagina("PLANO DE AÇÃO E CONCLUSÃO");
  const linhasParecer = doc.splitTextToSize(diagnostico.parecer || "Parecer ainda não registrado.", largura - (margem * 2) - 8);
  if (y + 14 + (linhasParecer.length * 4) > altura - 18) y = novaPagina("PLANO DE AÇÃO E CONCLUSÃO");
  doc.setFillColor(255, 240, 242); doc.roundedRect(margem, y, largura - (margem * 2), 7, 2, 2, "F");
  doc.setTextColor(...BRAND_RGB); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Parecer final", margem + 4, y + 4.8);
  doc.setTextColor(51, 65, 85); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(linhasParecer, margem + 4, y + 14);
  adicionarRodapesPdf(doc);
  doc.save(`checkup-${diagnostico.empreendimento_nome}-${diagnostico.unidade_numero}-${diagnostico.periodo}.pdf`);
}

function DetalheCheckup({ id, usuarios, onBack }) {
  const [diagnostico, setDiagnostico] = useState(null); const [aba, setAba] = useState("Visão Geral"); const [erro, setErro] = useState("");
  const carregar = useCallback(async () => { try { setDiagnostico((await api.get(`/checkups/${id}`)).data); } catch (e) { setErro(e.response?.data?.error || "Não foi possível carregar o Checkup."); } }, [id]);
  useEffect(() => { carregar(); }, [carregar]);
  if (erro) return <div className="alert alert-danger">{erro}</div>; if (!diagnostico) return <div className="loading">Carregando Checkup...</div>;
  const setorAtual = diagnostico.setores.find((s) => s.setor === aba); const config = SETORES_CHECKUP.find((s) => s.id === aba);
  async function concluir() { if (!window.confirm("Concluir e preservar este diagnóstico mensal? Após o fechamento ele não poderá ser alterado.")) return; try { await api.post(`/checkups/${id}/concluir`); carregar(); } catch (e) { setErro(e.response?.data?.error || "Não foi possível concluir."); } }
  const abas = ["Visão Geral", ...SETORES_CHECKUP.map((s) => s.id), "Plano de Ação", "Histórico"].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return <div className="checkup-page"><div className="page-header"><div><button className="checkup-back" onClick={onBack}>← Voltar ao Checkup</button><h2>{diagnostico.empreendimento_nome} — {diagnostico.unidade_numero}</h2><p>{diagnostico.proprietario_nome || "Sem proprietário"} · {fmtCompetencia(diagnostico.periodo)}</p></div><div className="flex-gap"><button className="btn btn-secondary" onClick={() => gerarPdf(diagnostico)}>Exportar PDF</button>{diagnostico.pode_gerenciar && diagnostico.status !== "Concluído" && <button className="btn btn-primary" onClick={concluir}>Concluir diagnóstico</button>}</div></div><div className="checkup-header-stats"><div><span>Saúde geral</span><strong>{diagnostico.saude_geral == null ? "—" : `${diagnostico.saude_geral}%`}</strong></div><div><span>Classificação</span><strong>{diagnostico.classificacao}</strong></div><div><span>Preenchimento</span><strong>{diagnostico.preenchimento}%</strong></div><div><span>Status</span><strong>{diagnostico.status}</strong></div><div><span>Data da análise</span><strong>{fmtData(diagnostico.data_analise)}</strong></div></div><div className="tabs checkup-tabs">{abas.map((nome) => <button key={nome} className={`tab-btn ${aba === nome ? "active" : ""}`} onClick={() => setAba(nome)}>{nome}</button>)}</div>{aba === "Visão Geral" ? <VisaoGeral diagnostico={diagnostico} usuarios={usuarios} onSaved={carregar} /> : config && setorAtual ? <FormularioSetor config={config} setor={setorAtual} onSaved={carregar} /> : aba === "Plano de Ação" ? <PlanoAcao diagnostico={diagnostico} usuarios={usuarios} onSaved={carregar} /> : <div className="card"><div className="card-header"><span className="card-title">Histórico e auditoria</span></div><div className="card-body checkup-history">{diagnostico.evolucao.length > 0 && <div className="checkup-timeline">{diagnostico.evolucao.map((h) => <div key={h.periodo}><span>{fmtCompetencia(h.periodo)}</span><strong>{h.saude_geral}%</strong><small>{h.classificacao}</small></div>)}</div>}{!diagnostico.historico.length ? <div className="empty-state">Nenhuma alteração registrada.</div> : diagnostico.historico.map((h) => <div className="history-row" key={h.id}><span>{new Date(`${h.criado_em}Z`).toLocaleString("pt-BR")}</span><strong>{h.usuario_nome}</strong><p>{h.acao}{h.setor ? ` · ${h.setor}` : ""}</p></div>)}</div></div>}</div>;
}

export default function Checkup() {
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7)); const [busca, setBusca] = useState(""); const [lista, setLista] = useState([]); const [usuarios, setUsuarios] = useState([]); const [selecionado, setSelecionado] = useState(null); const [pagina, setPagina] = useState(1); const [loading, setLoading] = useState(true);
  const carregar = useCallback(async () => { setLoading(true); try { const [checkups, users] = await Promise.all([api.get(`/checkups?periodo=${periodo}`), api.get("/checkups/responsaveis")]); setLista(checkups.data); setUsuarios(users.data); } finally { setLoading(false); } }, [periodo]);
  useEffect(() => { carregar(); }, [carregar]); useEffect(() => { setPagina(1); }, [busca, periodo]);
  const filtrada = lista.filter((u) => !busca || `${u.empreendimento_nome} ${u.unidade_numero} ${u.proprietario_nome || ""}`.toLowerCase().includes(busca.toLowerCase()));
  const { itensOrdenados, ordenacao, direcao, toggleOrdem } = useOrdenacao(filtrada); const totalPaginas = Math.max(1, Math.ceil(itensOrdenados.length / POR_PAGINA)); const paginada = itensOrdenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  async function abrir(item) { if (item.diagnostico_id) return setSelecionado(item.diagnostico_id); const r = await api.post("/checkups", { unidade_id: item.unidade_id, periodo }); setSelecionado(r.data.id); }
  if (selecionado) return <DetalheCheckup id={selecionado} usuarios={usuarios} onBack={() => { setSelecionado(null); carregar(); }} />;
  const comDiagnostico = lista.filter((i) => i.diagnostico_id).length; const criticas = lista.filter((i) => i.saude_geral != null && i.saude_geral < 60).length;
  return <div className="checkup-page"><div className="page-header"><div><h2>Checkup das Acomodações</h2><p>Visão 360° da saúde operacional de cada unidade.</p></div><input type="month" className="form-control" style={{ width: "auto" }} value={periodo} onChange={(e) => setPeriodo(e.target.value)} /></div><div className="activity-summary">{[["Unidades", lista.length], ["Diagnósticos iniciados", comDiagnostico], ["Pendentes", lista.length - comDiagnostico], ["Críticas / urgentes", criticas]].map(([label, valor]) => <div className="summary-card" key={label}><span>{label}</span><strong>{valor}</strong></div>)}</div><div className="card" style={{ marginBottom: 16 }}><div className="card-body"><label className="form-label">Buscar</label><input className="form-control" placeholder="Empreendimento, unidade ou proprietário..." value={busca} onChange={(e) => setBusca(e.target.value)} /></div></div><div className="card"><div className="card-body">{loading ? <div className="loading">Carregando acomodações...</div> : <div className="table-container"><table><thead><tr><SortableHeader label="Empreendimento" field="empreendimento_nome" sortField={ordenacao} sortDirection={direcao} onSort={toggleOrdem} /><SortableHeader label="Unidade" field="unidade_numero" sortField={ordenacao} sortDirection={direcao} onSort={toggleOrdem} /><SortableHeader label="Proprietário" field="proprietario_nome" sortField={ordenacao} sortDirection={direcao} onSort={toggleOrdem} /><SortableHeader label="Saúde" field="saude_geral" sortField={ordenacao} sortDirection={direcao} onSort={toggleOrdem} /><SortableHeader label="Classificação" field="classificacao" sortField={ordenacao} sortDirection={direcao} onSort={toggleOrdem} /><SortableHeader label="Preenchimento" field="preenchimento" sortField={ordenacao} sortDirection={direcao} onSort={toggleOrdem} /><SortableHeader label="Status" field="status" sortField={ordenacao} sortDirection={direcao} onSort={toggleOrdem} /><SortableHeader label="Ações abertas" field="acoes_abertas" sortField={ordenacao} sortDirection={direcao} onSort={toggleOrdem} /><th>Ações</th></tr></thead><tbody>{paginada.map((item) => <tr key={item.unidade_id}><td style={{ fontWeight: 600 }}>{item.empreendimento_nome}</td><td>{item.unidade_numero}</td><td className="text-muted">{item.proprietario_nome || "—"}</td><td><strong className={classeSaude(item.saude_geral)}>{item.saude_geral == null ? "—" : `${item.saude_geral}%`}</strong></td><td><span className={`status-badge ${classeSaude(item.saude_geral)}`}>{item.classificacao || "Não iniciado"}</span></td><td>{item.diagnostico_id ? `${item.preenchimento}%` : "—"}</td><td>{item.status || "Não iniciado"}</td><td>{item.acoes_abertas || 0}</td><td><button className="btn btn-primary btn-sm" onClick={() => abrir(item)}>{item.diagnostico_id ? "Abrir" : "Iniciar"}</button></td></tr>)}</tbody></table><Paginacao pagina={pagina} totalPaginas={totalPaginas} total={itensOrdenados.length} porPagina={POR_PAGINA} onChange={setPagina} /></div>}</div></div></div>;
}
