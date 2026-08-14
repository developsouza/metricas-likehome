const PERFIS = ["admin", "usuario", "analise_gestao"];
const DEPARTAMENTOS = ["Marketing", "Comercial", "Atendimento", "Precificacao", "Financeiro"];
const DEPARTAMENTOS_ATIVIDADE = [...DEPARTAMENTOS, "Admin"];
const DEPARTAMENTOS_USUARIO = [...DEPARTAMENTOS, "Geral"];
const STATUS_ATIVIDADE = ["A Fazer", "Em Andamento", "Aguardando Validação", "Concluído", "Cancelado"];
const PRIORIDADES_ATIVIDADE = ["Baixa", "Média", "Alta", "Urgente"];

module.exports = { PERFIS, DEPARTAMENTOS, DEPARTAMENTOS_ATIVIDADE, DEPARTAMENTOS_USUARIO, STATUS_ATIVIDADE, PRIORIDADES_ATIVIDADE };
