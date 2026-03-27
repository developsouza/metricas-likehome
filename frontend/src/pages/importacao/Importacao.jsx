import { useState, useRef } from 'react'
import api from '../../services/api'

const TIPOS = [
  {
    id: 'portfolio',
    label: 'Portfólio Comercial',
    descricao: 'Importa empreendimentos, proprietários e unidades',
    obrigatorias: ['Empreendimento', 'Unidade', 'Status da unidade'],
    opcionais: ['Proprietario', 'Data de Contrato', 'Data de Ativação', 'Data de Saida',
      'Comissao - Adm', 'BPO', 'Taxa - Enxoval', 'Nome da Indicação',
      'Status - Pagamento Indicação', 'Responsável', 'Observação'],
    exemploCabecalho: 'Empreendimento;Unidade;Proprietario;Data de Contrato;Data de Ativação;Data de Saida;Status da unidade;Comissao - Adm;BPO;Taxa - Enxoval;Nome da Indicação;Status - Pagamento Indicação;Responsável;Observação',
  },
  {
    id: 'lancamentos',
    label: 'Lançamentos de Indicadores',
    descricao: 'Importa lançamentos mensais de KRIs/KPIs por departamento',
    obrigatorias: ['competencia', 'departamento', 'indicador', 'valor_realizado'],
    opcionais: ['meta', 'observacao'],
    exemploCabecalho: 'competencia;departamento;indicador;valor_realizado;meta;observacao',
    exemploLinha: '2026-03;Comercial;Crescimento líquido de unidades;8;5;Observação opcional',
  },
]

function BadgeStatus({ ok }) {
  return ok
    ? <span style={s.badgeOk}>✓ encontrada</span>
    : <span style={s.badgeErr}>✗ ausente</span>
}

export default function Importacao() {
  const [tipoSel, setTipoSel] = useState('portfolio')
  const [arquivo, setArquivo] = useState(null)
  const [arrastando, setArrastando] = useState(false)
  const [validacao, setValidacao] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const inputRef = useRef()

  const tipo = TIPOS.find(t => t.id === tipoSel)

  function resetar() {
    setArquivo(null)
    setValidacao(null)
    setResultado(null)
    setErro(null)
  }

  function onTipoChange(id) {
    setTipoSel(id)
    resetar()
  }

  function onArquivo(f) {
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      setErro('Apenas arquivos .csv são aceitos.')
      return
    }
    setArquivo(f)
    setValidacao(null)
    setResultado(null)
    setErro(null)
    validarArquivo(f)
  }

  async function validarArquivo(f) {
    setCarregando(true)
    setErro(null)
    try {
      const fd = new FormData()
      fd.append('arquivo', f)
      fd.append('tipo', tipoSel)
      const { data } = await api.post('/import/validar', fd)
      setValidacao(data)
    } catch (e) {
      setErro(e.response?.data?.error || 'Erro ao validar o arquivo')
    } finally {
      setCarregando(false)
    }
  }

  async function executarImportacao() {
    if (!arquivo || !validacao?.valido) return
    setCarregando(true)
    setErro(null)
    setResultado(null)
    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      fd.append('tipo', tipoSel)
      const { data } = await api.post('/import/importar', fd)
      setResultado(data)
    } catch (e) {
      setErro(e.response?.data?.mensagem || e.response?.data?.error || 'Erro durante a importação')
      if (e.response?.data?.colunas_faltando) {
        setValidacao(v => ({
          ...v,
          valido: false,
          colunas_obrigatorias: {
            ...v?.colunas_obrigatorias,
            faltando: e.response.data.colunas_faltando,
          },
        }))
      }
    } finally {
      setCarregando(false)
    }
  }

  async function baixarModelo() {
    try {
      const resp = await api.get('/import/modelo-lancamentos', { responseType: 'blob' })
      const url = URL.createObjectURL(resp.data)
      const a = document.createElement('a')
      a.href = url
      a.download = resp.headers['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] || 'modelo-lancamentos.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setErro('Erro ao baixar modelo')
    }
  }

  return (
    <div style={s.page}>
      <h2 style={s.titulo}>Importar CSV</h2>
      <p style={s.subtitulo}>Importe dados em massa a partir de arquivos CSV. O sistema mapeia as colunas automaticamente e informa o que está faltando.</p>

      {/* Seletor de tipo */}
      <div style={s.tiposGrid}>
        {TIPOS.map(t => (
          <button
            key={t.id}
            style={{ ...s.tipoCard, ...(tipoSel === t.id ? s.tipoCardAtivo : {}) }}
            onClick={() => onTipoChange(t.id)}
          >
            <span style={s.tipoLabel}>{t.label}</span>
            <span style={s.tipoDesc}>{t.descricao}</span>
          </button>
        ))}
      </div>

      {/* Informações sobre colunas */}
      <div style={s.infoBox}>
        <div style={s.infoSecao}>
          <strong>Colunas obrigatórias:</strong>
          <div style={s.tagRow}>
            {tipo.obrigatorias.map(c => <span key={c} style={s.tagObrig}>{c}</span>)}
          </div>
        </div>
        <div style={s.infoSecao}>
          <strong>Colunas opcionais:</strong>
          <div style={s.tagRow}>
            {tipo.opcionais.map(c => <span key={c} style={s.tagOpc}>{c}</span>)}
          </div>
        </div>
        <div style={s.exemploCabecalho}>
          <strong>Formato do cabeçalho (separador: <code>;</code>):</strong>
          <pre style={s.pre}>{tipo.exemploCabecalho}</pre>
          {tipo.exemploLinha && <pre style={s.pre}>{tipo.exemploLinha}</pre>}
        </div>
        {tipoSel === 'lancamentos' && (
          <button style={s.btnModelo} onClick={baixarModelo}>
            ⬇ Baixar modelo preenchido com seus indicadores
          </button>
        )}
      </div>

      {/* Zona de upload */}
      <div
        style={{ ...s.dropzone, ...(arrastando ? s.dropzoneAtivo : {}) }}
        onDragOver={e => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={e => { e.preventDefault(); setArrastando(false); onArquivo(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current.click()}
      >
        {arquivo
          ? <span>📄 <strong>{arquivo.name}</strong> ({(arquivo.size / 1024).toFixed(1)} KB)</span>
          : <span>Arraste um arquivo CSV aqui ou <u>clique para selecionar</u></span>
        }
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={e => onArquivo(e.target.files[0])}
        />
      </div>

      {/* Erros */}
      {erro && <div style={s.erroBox}>⚠ {erro}</div>}

      {/* Loading */}
      {carregando && <div style={s.loadingBox}>Processando...</div>}

      {/* Resultado da validação */}
      {validacao && !carregando && (
        <div style={s.validacaoBox}>
          <h4 style={{ margin: '0 0 12px' }}>
            {validacao.valido
              ? '✅ CSV válido — pronto para importar'
              : '❌ CSV com problemas — corrija antes de importar'}
          </h4>

          <div style={s.validacaoGrid}>
            <div>
              <strong>Colunas obrigatórias</strong>
              {tipo.obrigatorias.map(c => (
                <div key={c} style={s.colRow}>
                  <code style={s.colNome}>{c}</code>
                  <BadgeStatus ok={!validacao.colunas_obrigatorias?.faltando?.includes(c)} />
                </div>
              ))}
            </div>
            <div>
              <strong>Colunas opcionais encontradas</strong>
              {validacao.colunas_opcionais_encontradas?.length
                ? validacao.colunas_opcionais_encontradas.map(c => (
                  <div key={c} style={s.colRow}><code style={s.colNome}>{c}</code> <span style={s.badgeOk}>✓</span></div>
                ))
                : <div style={{ color: '#888', fontSize: 13 }}>Nenhuma</div>
              }
            </div>
          </div>

          {!validacao.valido && validacao.colunas_obrigatorias?.faltando?.length > 0 && (
            <div style={s.faltandoBox}>
              <strong>Colunas faltando:</strong> {validacao.colunas_obrigatorias.faltando.join(', ')}
            </div>
          )}

          {validacao.valido && !resultado && (
            <button style={s.btnImportar} onClick={executarImportacao} disabled={carregando}>
              {carregando ? 'Importando...' : '📥 Importar dados'}
            </button>
          )}
        </div>
      )}

      {/* Resultado da importação */}
      {resultado && !carregando && (
        <div style={s.resultadoBox}>
          <h4 style={{ margin: '0 0 12px' }}>✅ Importação concluída</h4>

          {tipoSel === 'portfolio' ? (
            <div style={s.statsGrid}>
              <Stat label="Empreendimentos criados" valor={resultado.empreendimentos} />
              <Stat label="Proprietários criados" valor={resultado.proprietarios} />
              <Stat label="Unidades importadas" valor={resultado.unidades} cor="#16a34a" />
              <Stat label="Unidades já existentes (ignoradas)" valor={resultado.ignoradas} cor="#6b7280" />
            </div>
          ) : (
            <div style={s.statsGrid}>
              <Stat label="Novos lançamentos" valor={resultado.inseridos} cor="#16a34a" />
              <Stat label="Atualizados" valor={resultado.atualizados} cor="#2563eb" />
              <Stat label="Ignorados (linhas vazias)" valor={resultado.ignorados} cor="#6b7280" />
            </div>
          )}

          {resultado.erros?.length > 0 && (
            <div style={s.errosDetalhe}>
              <strong>⚠ {resultado.erros.length} linha(s) com problema:</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {resultado.erros.map((e, i) => <li key={i} style={{ fontSize: 13 }}>{e}</li>)}
              </ul>
            </div>
          )}

          <button style={s.btnNovo} onClick={resetar}>Importar outro arquivo</button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, valor, cor = '#1d4ed8' }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statValor, color: cor }}>{valor ?? 0}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const s = {
  page: { padding: '24px', maxWidth: 900 },
  titulo: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  subtitulo: { color: '#6b7280', marginBottom: 24, fontSize: 14 },

  tiposGrid: { display: 'flex', gap: 12, marginBottom: 20 },
  tipoCard: {
    flex: 1, padding: '14px 18px', border: '2px solid #e5e7eb', borderRadius: 10,
    background: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex',
    flexDirection: 'column', gap: 4, transition: 'all .15s',
  },
  tipoCardAtivo: { borderColor: '#2563eb', background: '#eff6ff' },
  tipoLabel: { fontWeight: 600, fontSize: 15 },
  tipoDesc: { fontSize: 13, color: '#6b7280' },

  infoBox: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10,
  },
  infoSecao: { display: 'flex', flexDirection: 'column', gap: 6 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tagObrig: {
    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
    borderRadius: 6, padding: '2px 8px', fontSize: 12, fontFamily: 'monospace',
  },
  tagOpc: {
    background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
    borderRadius: 6, padding: '2px 8px', fontSize: 12, fontFamily: 'monospace',
  },
  exemploCabecalho: { display: 'flex', flexDirection: 'column', gap: 4 },
  pre: {
    background: '#1e293b', color: '#e2e8f0', padding: '8px 12px', borderRadius: 6,
    fontSize: 12, overflowX: 'auto', margin: 0, whiteSpace: 'pre',
  },
  btnModelo: {
    alignSelf: 'flex-start', padding: '6px 14px', background: '#fff',
    border: '1px solid #2563eb', color: '#2563eb', borderRadius: 7,
    cursor: 'pointer', fontSize: 13, fontWeight: 500,
  },

  dropzone: {
    border: '2px dashed #cbd5e1', borderRadius: 10, padding: '32px', textAlign: 'center',
    cursor: 'pointer', background: '#f8fafc', transition: 'all .15s',
    fontSize: 15, color: '#475569', marginBottom: 16,
  },
  dropzoneAtivo: { borderColor: '#2563eb', background: '#eff6ff' },

  erroBox: {
    background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626',
    borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 14,
  },
  loadingBox: {
    textAlign: 'center', color: '#2563eb', padding: 16, fontSize: 15,
  },

  validacaoBox: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: 20, marginBottom: 16,
  },
  validacaoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 14 },
  colRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' },
  colNome: { fontSize: 13, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 },
  badgeOk: { background: '#dcfce7', color: '#16a34a', borderRadius: 4, padding: '1px 7px', fontSize: 12 },
  badgeErr: { background: '#fee2e2', color: '#dc2626', borderRadius: 4, padding: '1px 7px', fontSize: 12 },
  faltandoBox: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13,
  },
  btnImportar: {
    marginTop: 8, padding: '10px 24px', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600,
  },

  resultadoBox: {
    background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 20,
  },
  statsGrid: { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  statCard: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '12px 18px', minWidth: 150, textAlign: 'center',
  },
  statValor: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  errosDetalhe: {
    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6,
    padding: '10px 14px', marginBottom: 12, fontSize: 13,
  },
  btnNovo: {
    padding: '8px 20px', background: '#fff', border: '1px solid #2563eb',
    color: '#2563eb', borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 500,
  },
}
