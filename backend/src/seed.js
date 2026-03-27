require("dotenv").config();
const bcrypt = require("bcryptjs");
const { db, initDatabase } = require("./database");

initDatabase();

// ─── LIMPAR DADOS ANTERIORES ──────────────────────────────────────────────────
console.log("🗑  Limpando dados anteriores...");

// Preserva empreendimentos, proprietários, unidades e lançamentos
// pois são gerenciados pelo sistema (CRUD manual)
db.exec("PRAGMA foreign_keys = OFF");
db.exec("DELETE FROM usuarios");
try {
    db.exec("DELETE FROM indicadores");
} catch (_) {}
db.exec("PRAGMA foreign_keys = ON");

const seqNames = ["usuarios", "indicadores"];
for (const name of seqNames) {
    try {
        db.exec(`DELETE FROM sqlite_sequence WHERE name = '${name}'`);
    } catch (_) {}
}

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────
console.log("👤 Inserindo usuários...");

const hashAdmin = bcrypt.hashSync("admin123", 10);
const hashUser = bcrypt.hashSync("user123", 10);

// Pedro Henrique = gestor (admin)
const pHenriqueId = db
    .prepare(`INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento) VALUES (?, ?, ?, ?, ?)`)
    .run("Pedro Henrique", "admin@likehome.com", hashAdmin, "admin", "Comercial").lastInsertRowid;

const steffanyId = db
    .prepare(`INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento) VALUES (?, ?, ?, ?, ?)`)
    .run("Steffany Galdino", "steffany@likehome.com", hashUser, "usuario", "Comercial").lastInsertRowid;

const jessicaId = db
    .prepare(`INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento) VALUES (?, ?, ?, ?, ?)`)
    .run("Jessica Batista", "jessica@likehome.com", hashUser, "usuario", "Comercial").lastInsertRowid;

// Demais usuários departamentais
db.prepare(`INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento) VALUES (?, ?, ?, ?, ?)`).run(
    "Ana Marketing",
    "ana@likehome.com",
    hashUser,
    "usuario",
    "Marketing",
);
db.prepare(`INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento) VALUES (?, ?, ?, ?, ?)`).run(
    "Fernanda Financeiro",
    "fernanda@likehome.com",
    hashUser,
    "usuario",
    "Financeiro",
);
db.prepare(`INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento) VALUES (?, ?, ?, ?, ?)`).run(
    "Beatriz Atendimento",
    "beatriz@likehome.com",
    hashUser,
    "usuario",
    "Atendimento",
);
db.prepare(`INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento) VALUES (?, ?, ?, ?, ?)`).run(
    "Carlos Precificacao",
    "carlos@likehome.com",
    hashUser,
    "usuario",
    "Precificacao",
);

// ─── INDICADORES ─────────────────────────────────────────────────────────────
console.log("📊 Inserindo indicadores...");

const insertInd = db.prepare(`
    INSERT INTO indicadores (departamento, tipo, nome, descricao, unidade_medida, meta_padrao)
    VALUES (?, ?, ?, ?, ?, ?)
`);

// Marketing
insertInd.run("Marketing", "KRI", "Leads qualificados de proprietários por mês", "Leads de proprietários qualificados para captação", "unidade", 20);
insertInd.run("Marketing", "KRI", "Leads de hóspedes por mês", "Total de leads de hóspedes no período", "unidade", 100);
insertInd.run("Marketing", "KPI", "Custo por lead (CPL)", "Custo médio de aquisição por lead", "R$", 50);
insertInd.run("Marketing", "KPI", "Reuniões geradas para o comercial", "Nº de reuniões agendadas via Marketing", "unidade", 10);
insertInd.run("Marketing", "KPI", "Taxa de qualificação dos leads", "Lead → Reunião (%)", "%", 40);

// Comercial
insertInd.run("Comercial", "KRI", "Crescimento líquido de unidades", "Unidades captadas - unidades perdidas", "unidade", 5);
insertInd.run("Comercial", "KPI", "Número de reuniões realizadas", "Total de reuniões comerciais no período", "unidade", 15);
insertInd.run("Comercial", "KPI", "Taxa de conversão reunião → contrato", "Percentual de reuniões que geram contrato", "%", 60);
insertInd.run("Comercial", "KPI", "Tempo médio de fechamento", "Dias médios entre 1ª reunião e contrato assinado", "dias", 15);

// Atendimento
insertInd.run("Atendimento", "KRI", "Nota média nas OTAs", "Média das notas nas plataformas (Airbnb, Booking etc)", "nota", 4.7);
insertInd.run("Atendimento", "KPI", "Tempo médio de resposta ao hóspede", "Horas para 1ª resposta ao hóspede", "horas", 2);
insertInd.run("Atendimento", "KPI", "Taxa de resolução no primeiro contato", "Chamados resolvidos sem escalonamento (%)", "%", 80);
insertInd.run("Atendimento", "KPI", "Reclamações por reserva", "Reclamações / total de reservas", "unidade", 0.05);

// Precificacao
insertInd.run("Precificacao", "KRI", "Receita média por unidade", "Receita total / unidades ativas", "R$", 3500);
insertInd.run("Precificacao", "KPI", "Taxa de ocupação", "Dias ocupados / dias disponíveis (%)", "%", 70);
insertInd.run("Precificacao", "KPI", "Diária média (ADR)", "Average Daily Rate das unidades", "R$", 250);
insertInd.run("Precificacao", "KPI", "Ranking dos anúncios nas OTAs", "Posição média nos resultados das OTAs", "posição", 3);

// Financeiro
insertInd.run("Financeiro", "KRI", "Resultado operacional (EBITDA)", "EBITDA mensal da empresa", "R$", 50000);
insertInd.run("Financeiro", "KRI", "Resultado mensal consolidado (DRE)", "Resultado líquido do mês (DRE)", "R$", 30000);
insertInd.run("Financeiro", "KPI", "Receita média por unidade", "Receita total / unidades ativas", "R$", 3500);
insertInd.run("Financeiro", "KPI", "Previsibilidade de fluxo de caixa", "Realizado / projetado (%)", "%", 90);

// ─── RESUMO ───────────────────────────────────────────────────────────────────
const totalUsers = db.prepare("SELECT COUNT(*) as t FROM usuarios").get().t;
const totalInds = db.prepare("SELECT COUNT(*) as t FROM indicadores").get().t;

console.log("\n══════════════════════════════════════════════════");
console.log("  SEED CONCLUÍDO COM SUCESSO!");
console.log("══════════════════════════════════════════════════");
console.log(`  Usuários:           ${totalUsers}`);
console.log(`  Indicadores:        ${totalInds}`);
console.log("  Empreendimentos, proprietários e unidades");
console.log("  são gerenciados pelo sistema (CRUD manual).");
console.log("══════════════════════════════════════════════════\n");
console.log("Credenciais de acesso:");
console.log("  Admin     → admin@likehome.com       / admin123");
console.log("  Comercial → steffany@likehome.com    / user123");
console.log("  Comercial → jessica@likehome.com     / user123\n");
