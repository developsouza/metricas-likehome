export const SETORES_CHECKUP = [
  { id: "Precificação", departamento: "Precificacao", campos: [
    { id: "rentabilidade_anterior", label: "Rentabilidade do mês anterior", tipo: "number", sufixo: "%", obrigatorio: true },
    { id: "rentabilidade_atual", label: "Rentabilidade parcial do mês atual", tipo: "number", sufixo: "%", obrigatorio: true },
    { id: "ocupacao_atual", label: "Ocupação do mês atual", tipo: "number", sufixo: "%", obrigatorio: true },
    { id: "ocupacao_m1", label: "Projeção de ocupação — mês +1", tipo: "number", sufixo: "%" },
    { id: "ocupacao_m2", label: "Projeção de ocupação — mês +2", tipo: "number", sufixo: "%" },
    { id: "ocupacao_m3", label: "Projeção de ocupação — mês +3", tipo: "number", sufixo: "%" },
    { id: "estrategia_adequada", label: "A estratégia atual de preço está adequada?", tipo: "select", opcoes: ["Sim", "Parcialmente", "Não"], obrigatorio: true, pontuacao: { Sim: 100, Parcialmente: 60, Não: 20 }, peso: 2 },
    { id: "diagnostico", label: "Diagnóstico / oportunidade de melhoria", tipo: "textarea", obrigatorio: true, quando: ["estrategia_adequada", ["Parcialmente", "Não"]] },
  ]},
  { id: "Tecnologia", campos: [
    { id: "list_lens", label: "A unidade está no List Lens da Beyond?", tipo: "select", opcoes: ["Sim", "Não", "Não se aplica"], obrigatorio: true, pontuacao: { Sim: 100, Não: 20, "Não se aplica": 100 } },
    { id: "pontos_melhoria", label: "Existem pontos de melhoria identificados?", tipo: "select", opcoes: ["Não", "Sim"], obrigatorio: true, quando: ["list_lens", ["Sim"]], pontuacao: { Não: 100, Sim: 50 } },
    { id: "pontos_descricao", label: "Quais pontos precisam ser melhorados?", tipo: "textarea", obrigatorio: true, quando: ["pontos_melhoria", ["Sim"]] },
    { id: "performance_beyond", label: "Status atual de performance na Beyond", tipo: "text" },
    { id: "problema_tecnologico", label: "Existe configuração, integração ou problema impactando o desempenho?", tipo: "select", opcoes: ["Não", "Sim"], obrigatorio: true, pontuacao: { Não: 100, Sim: 20 }, peso: 2 },
    { id: "problema_descricao", label: "Descrição do problema", tipo: "textarea", obrigatorio: true, quando: ["problema_tecnologico", ["Sim"]] },
    { id: "prioridade", label: "Prioridade", tipo: "select", opcoes: ["Baixa", "Média", "Alta", "Crítica"], quando: ["problema_tecnologico", ["Sim"]] },
    { id: "acao_recomendada", label: "Ação recomendada", tipo: "textarea", quando: ["problema_tecnologico", ["Sim"]] },
  ]},
  { id: "Marketing", departamento: "Marketing", campos: [
    { id: "plataformas", label: "A unidade está conectada e publicada nas plataformas previstas?", tipo: "select", opcoes: ["Sim", "Parcialmente", "Não"], obrigatorio: true, pontuacao: { Sim: 100, Parcialmente: 60, Não: 10 }, peso: 2 },
    { id: "plataformas_problemas", label: "Plataformas com problemas", tipo: "textarea", obrigatorio: true, quando: ["plataformas", ["Parcialmente", "Não"]] },
    { id: "booking_posicao", label: "Posição / visibilidade atual na Booking", tipo: "text" },
    { id: "booking_nota", label: "Nota atual na Booking", tipo: "number" },
    { id: "airbnb_posicao", label: "Posição / visibilidade atual no Airbnb", tipo: "text" },
    { id: "qualidade_anuncio", label: "O anúncio representa adequadamente a acomodação?", tipo: "select", opcoes: ["Sim", "Parcialmente", "Não"], obrigatorio: true, pontuacao: { Sim: 100, Parcialmente: 60, Não: 20 }, peso: 2 },
    { id: "oportunidades", label: "Oportunidades de melhoria identificadas", tipo: "textarea", obrigatorio: true, quando: ["qualidade_anuncio", ["Parcialmente", "Não"]] },
  ]},
  { id: "Atendimento", departamento: "Atendimento", campos: [
    { id: "houve_problemas", label: "Houve problemas nas hospedagens desde a última análise?", tipo: "select", opcoes: ["Não", "Sim"], obrigatorio: true, pontuacao: { Não: 100, Sim: 30 }, peso: 2 },
    { id: "ocorrencias", label: "Ocorrências, datas, origem, gravidade e situação atual", tipo: "textarea", obrigatorio: true, quando: ["houve_problemas", ["Sim"]] },
    { id: "nota_media", label: "Nota média das avaliações", tipo: "number" },
    { id: "quantidade_avaliacoes", label: "Quantidade de avaliações", tipo: "number" },
    { id: "elogios", label: "Principais elogios", tipo: "textarea" },
    { id: "reclamacoes", label: "Principais reclamações / avaliações críticas", tipo: "textarea" },
    { id: "problema_recorrente", label: "Existe problema recorrente citado pelos hóspedes?", tipo: "select", opcoes: ["Não", "Sim"], obrigatorio: true, pontuacao: { Não: 100, Sim: 20 }, peso: 2 },
    { id: "recorrencia_descricao", label: "Problema recorrente identificado", tipo: "textarea", obrigatorio: true, quando: ["problema_recorrente", ["Sim"]] },
    { id: "oportunidades", label: "Oportunidades a partir das avaliações", tipo: "textarea" },
  ]},
  { id: "Manutenção", departamento: "Atendimento", campos: [
    { id: "ultima_vistoria", label: "Data da última vistoria", tipo: "date", obrigatorio: true },
    { id: "proxima_vistoria", label: "Data prevista para próxima vistoria", tipo: "date", obrigatorio: true },
    { id: "historico_manutencoes", label: "Últimas manutenções realizadas", tipo: "textarea" },
    { id: "preventivas", label: "Manutenções preventivas programadas", tipo: "textarea" },
    { id: "reparos_pendentes", label: "Reparos pendentes, prioridade, responsável e prazo", tipo: "textarea" },
    { id: "risco_hospedagens", label: "Existe manutenção que represente risco às próximas hospedagens?", tipo: "select", opcoes: ["Não", "Sim"], obrigatorio: true, pontuacao: { Não: 100, Sim: 10 }, peso: 3 },
    { id: "risco_descricao", label: "Risco identificado", tipo: "textarea", obrigatorio: true, quando: ["risco_hospedagens", ["Sim"]] },
  ]},
  { id: "Financeiro", departamento: "Financeiro", campos: [
    { id: "cobranca_extra", label: "Houve cobrança extra no período?", tipo: "select", opcoes: ["Não", "Sim"], obrigatorio: true, pontuacao: { Não: 100, Sim: 70 } },
    { id: "cobranca_descricao", label: "Descrição, valor, motivo e situação da cobrança", tipo: "textarea", obrigatorio: true, quando: ["cobranca_extra", ["Sim"]] },
    { id: "repasse_correto", label: "O relatório de repasses está correto?", tipo: "select", opcoes: ["Sim", "Não", "Pendente de conferência"], obrigatorio: true, pontuacao: { Sim: 100, Não: 10, "Pendente de conferência": 50 }, peso: 2 },
    { id: "repasse_inconsistencia", label: "Inconsistência identificada", tipo: "textarea", obrigatorio: true, quando: ["repasse_correto", ["Não"]] },
    { id: "pendencia_financeira", label: "Existe pendência financeira relacionada à unidade?", tipo: "select", opcoes: ["Não", "Sim"], obrigatorio: true, pontuacao: { Não: 100, Sim: 20 }, peso: 2 },
    { id: "pendencia_descricao", label: "Descrição, responsável, prazo e prioridade", tipo: "textarea", obrigatorio: true, quando: ["pendencia_financeira", ["Sim"]] },
  ]},
  { id: "Proprietário", departamento: "Comercial", campos: [
    { id: "ultimo_contato", label: "Data do último contato", tipo: "date", obrigatorio: true },
    { id: "novo_contato", label: "É necessário novo contato?", tipo: "select", opcoes: ["Não", "Sim"], obrigatorio: true, pontuacao: { Não: 100, Sim: 60 } },
    { id: "motivo_contato", label: "Motivo do novo contato", tipo: "textarea", obrigatorio: true, quando: ["novo_contato", ["Sim"]] },
    { id: "responsavel_contato", label: "Responsável pelo contato", tipo: "text", quando: ["novo_contato", ["Sim"]] },
    { id: "prazo_contato", label: "Prazo", tipo: "date", quando: ["novo_contato", ["Sim"]] },
    { id: "status_contato", label: "Status", tipo: "select", opcoes: ["Pendente", "Em andamento", "Realizado"], quando: ["novo_contato", ["Sim"]] },
    { id: "assuntos", label: "Assuntos que precisam ser comunicados ao proprietário", tipo: "textarea" },
  ]},
];

export function camposVisiveis(setor, respostas) {
  return setor.campos.filter((campo) => !campo.quando || campo.quando[1].includes(respostas[campo.quando[0]]));
}

export function calcularSaude(setor, respostas) {
  const avaliados = camposVisiveis(setor, respostas).filter((campo) => campo.pontuacao && respostas[campo.id] !== undefined && respostas[campo.id] !== "");
  if (!avaliados.length) return null;
  const peso = avaliados.reduce((total, campo) => total + (campo.peso || 1), 0);
  return Math.round(avaliados.reduce((total, campo) => total + (campo.pontuacao[respostas[campo.id]] ?? 0) * (campo.peso || 1), 0) / peso);
}

export function classificacaoSaude(valor) {
  if (valor == null) return "Pendente";
  if (valor >= 90) return "Excelente";
  if (valor >= 75) return "Saudável";
  if (valor >= 60) return "Atenção";
  if (valor >= 40) return "Crítico";
  return "Urgente";
}
