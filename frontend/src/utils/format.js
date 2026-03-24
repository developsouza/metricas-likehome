export function fmtMoeda(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export function fmtNum(v, decimais = 1) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimais }).format(v)
}

export function fmtPct(v) {
  if (v == null) return '—'
  return `${fmtNum(v, 1)}%`
}

export function fmtValor(v, unidade) {
  if (v == null) return '—'
  switch (unidade) {
    case 'R$': return fmtMoeda(v)
    case '%': return fmtPct(v)
    case 'nota': return fmtNum(v, 2)
    case 'horas': return `${fmtNum(v, 1)}h`
    case 'dias': return `${fmtNum(v, 0)} dias`
    default: return fmtNum(v, unidade === 'unidade' ? 0 : 2)
  }
}

export function fmtData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function competenciaAtual() {
  return new Date().toISOString().substring(0, 7)
}

export function mesesAnteriores(n = 12) {
  const meses = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1)
    meses.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`)
  }
  return meses
}

export function fmtCompetencia(c) {
  if (!c) return '—'
  const [y, m] = c.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[parseInt(m) - 1]}/${y}`
}

export function corIndicador(status) {
  switch (status) {
    case 'acima': return 'var(--success)'
    case 'atencao': return 'var(--warning)'
    case 'abaixo': return 'var(--danger)'
    default: return 'var(--neutral-300)'
  }
}

export function labelStatus(s) {
  const m = { Prospeccao: 'Prospecção', Reuniao: 'Reunião', Fechamento: 'Fechamento', Integracao: 'Integração', Ativo: 'Ativo', Baixa: 'Baixa/Inativo' }
  return m[s] || s
}

export function deptos() {
  return ['Marketing', 'Comercial', 'Atendimento', 'Precificacao', 'Financeiro']
}

export function labelDepto(d) {
  const m = { Precificacao: 'Precificação', Geral: 'Geral' }
  return m[d] || d
}
