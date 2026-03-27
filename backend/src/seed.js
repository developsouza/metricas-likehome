require("dotenv").config();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { db, initDatabase } = require("./database");

initDatabase();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Converte DD/MM/YYYY → YYYY-MM-DD. Retorna null para valores inválidos. */
function parseDate(s) {
    if (!s || !s.trim() || s.trim() === "-") return null;
    const parts = s.trim().split("/");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const year = parseInt(y, 10);
    if (!y || y.length < 4 || year > 2100 || year < 1900) return null;
    return `${y.substring(0, 4)}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** Mapeia status CSV → status interno */
function mapStatus(s) {
    const t = (s || "").trim();
    if (t === "Ativo") return "Ativo";
    if (t === "Inativo") return "Baixa";
    if (t === "Em Integração") return "Integracao";
    if (t.toLowerCase().startsWith("pendente")) return "Fechamento";
    return "Ativo";
}

/** Converte "20%" → 20, "15%" → 15, "" → null */
function parseComissao(s) {
    if (!s || !s.trim()) return null;
    const v = parseFloat(s.replace("%", "").trim());
    return isNaN(v) ? null : v;
}

// ─── LIMPAR DADOS ANTERIORES ──────────────────────────────────────────────────
console.log("🗑  Limpando dados anteriores...");

db.exec("DELETE FROM lancamentos_indicadores");
db.exec("DELETE FROM historico_status_unidade");
db.exec("DELETE FROM unidades");
db.exec("DELETE FROM proprietarios");
db.exec("DELETE FROM empreendimentos");
db.exec("DELETE FROM usuarios");
try {
    db.exec("DELETE FROM indicadores");
} catch (_) {}

// Reset sequences
const seqNames = ["unidades", "proprietarios", "empreendimentos", "usuarios", "lancamentos_indicadores", "historico_status_unidade", "indicadores"];
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

// Mapa responsável CSV → id
const respMap = {
    "Steffany Galdino": steffanyId,
    "Jessica Batista": jessicaId,
    Jessica: jessicaId,
    Steffany: steffanyId,
    "Pedro Henrique": pHenriqueId,
};

// ─── LER E PARSEAR CSV ────────────────────────────────────────────────────────
console.log("📄 Lendo CSV da base de dados...");

const csvPath = path.resolve(__dirname, "../../Relatorio Comercial - LikeHome v3(BaseDados).csv");
const csvText = fs.readFileSync(csvPath, "utf-8");
const csvLines = csvText.split(/\r?\n/);

// Pula as 5 primeiras linhas (3 metadados + 1 blank + 1 cabeçalho = linha índice 0 a 4)
const dataLines = csvLines.slice(5);

// Colunas (sep=;):
// [0]Empreendimento [1]Unidade  [2]Proprietario [3]DataContrato
// [4]DataAtivacao   [5]DataSaida [6]Status       [7]Comissao
// [8]BPO            [9]TaxaEnxoval [10]NomeIndicacao [11]StatusPagIndicacao
// [12]MesAtivacao   [13]AnoAtivacao [14]MesSaida  [15]AnoSaida
// [16]TempoContrato [17]Responsavel  [18]Observacao

const rows = [];
for (const line of dataLines) {
    const cols = line.split(";");
    if (cols.length < 7) continue;

    const emp = (cols[0] || "").trim();
    const unid = (cols[1] || "").trim();
    const prop = (cols[2] || "").trim();

    // Ignora linhas sem empreendimento ou sem número de unidade
    if (!emp || !unid) continue;

    rows.push({
        empreendimento: emp,
        numero: unid,
        proprietario: prop === "-" || prop === "" ? null : prop,
        data_fechamento: parseDate(cols[3]),
        data_ativacao: parseDate(cols[4]),
        data_baixa: parseDate(cols[5]),
        status: mapStatus(cols[6]),
        comissao_adm: parseComissao(cols[7]),
        bpo: (cols[8] || "").trim() || null,
        taxa_enxoval: (cols[9] || "").trim() || null,
        nome_indicacao: (cols[10] || "").trim() || null,
        status_pagamento_indicacao: (cols[11] || "").trim() || null,
        responsavel_nome: (cols[17] || "").trim() || null,
        observacoes: (cols[18] || "").trim() || null,
    });
}

console.log(`✅ ${rows.length} linhas válidas encontradas no CSV`);

// ─── EMPREENDIMENTOS ──────────────────────────────────────────────────────────
console.log("🏢 Inserindo empreendimentos...");

const empNomes = [...new Set(rows.map((r) => r.empreendimento))].sort();
const empMap = new Map();

const insertEmpStmt = db.prepare(`INSERT INTO empreendimentos (nome, cidade, estado) VALUES (?, ?, ?)`);
for (const nome of empNomes) {
    const result = insertEmpStmt.run(nome, "João Pessoa", "PB");
    empMap.set(nome, result.lastInsertRowid);
}

console.log(`✅ ${empNomes.length} empreendimentos inseridos`);

// ─── PROPRIETÁRIOS ────────────────────────────────────────────────────────────
console.log("👥 Inserindo proprietários...");

const propNomes = [...new Set(rows.map((r) => r.proprietario).filter(Boolean))].sort();
const propMap = new Map();

const insertPropStmt = db.prepare(`INSERT INTO proprietarios (nome) VALUES (?)`);
for (const nome of propNomes) {
    const result = insertPropStmt.run(nome);
    propMap.set(nome, result.lastInsertRowid);
}

console.log(`✅ ${propNomes.length} proprietários inseridos`);

// ─── UNIDADES ─────────────────────────────────────────────────────────────────
console.log("🏠 Inserindo unidades...");

const insertUnidadeStmt = db.prepare(`
    INSERT INTO unidades (
        empreendimento_id, numero, status,
        proprietario_id, responsavel_id, observacoes,
        data_fechamento, data_ativacao, data_baixa,
        comissao_adm, bpo, taxa_enxoval,
        nome_indicacao, status_pagamento_indicacao,
        atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const insertHistoricoStmt = db.prepare(`
    INSERT INTO historico_status_unidade (unidade_id, status_novo, data_mudanca)
    VALUES (?, ?, date('now'))
`);

let unidadesInseridas = 0;

db.exec("BEGIN");
try {
    for (const row of rows) {
        const empId = empMap.get(row.empreendimento);
        if (!empId) continue;

        const propId = row.proprietario ? propMap.get(row.proprietario) || null : null;
        const respId = row.responsavel_nome ? respMap[row.responsavel_nome] || null : null;

        const result = insertUnidadeStmt.run(
            empId,
            row.numero,
            row.status,
            propId,
            respId,
            row.observacoes || null,
            row.data_fechamento || null,
            row.data_ativacao || null,
            row.data_baixa || null,
            row.comissao_adm,
            row.bpo || null,
            row.taxa_enxoval || null,
            row.nome_indicacao || null,
            row.status_pagamento_indicacao || null,
        );

        insertHistoricoStmt.run(result.lastInsertRowid, row.status);
        unidadesInseridas++;
    }
    db.exec("COMMIT");
} catch (e) {
    db.exec("ROLLBACK");
    throw e;
}
console.log(`✅ ${unidadesInseridas} unidades inseridas`);

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

// ─── LANÇAMENTOS DERIVADOS DO CSV (Indicador Comercial) ──────────────────────
console.log("📈 Gerando lançamentos históricos derivados do CSV...");

// Indicador: Crescimento líquido de unidades (Comercial KRI)
const indCrescimento = db
    .prepare(`SELECT id, meta_padrao FROM indicadores WHERE nome = 'Crescimento líquido de unidades' AND departamento = 'Comercial'`)
    .get();

if (indCrescimento) {
    // Captadas por mês (data_ativacao)
    const captadasPorMes = db
        .prepare(
            `
            SELECT strftime('%Y-%m', data_ativacao) AS competencia, COUNT(*) AS total
            FROM unidades
            WHERE data_ativacao IS NOT NULL
            GROUP BY competencia
            ORDER BY competencia
        `,
        )
        .all();

    // Saídas por mês (data_baixa) — apenas Baixa (Inativo)
    const saidasPorMes = db
        .prepare(
            `
            SELECT strftime('%Y-%m', data_baixa) AS competencia, COUNT(*) AS total
            FROM unidades
            WHERE data_baixa IS NOT NULL
            GROUP BY competencia
            ORDER BY competencia
        `,
        )
        .all();

    // Mesclar em map competencia → { captadas, saidas }
    const mesesMap = new Map();
    for (const r of captadasPorMes) {
        mesesMap.set(r.competencia, { captadas: r.total, saidas: 0 });
    }
    for (const r of saidasPorMes) {
        const entry = mesesMap.get(r.competencia) || { captadas: 0, saidas: 0 };
        entry.saidas = r.total;
        mesesMap.set(r.competencia, entry);
    }

    const insertLanc = db.prepare(`
        INSERT OR IGNORE INTO lancamentos_indicadores
            (indicador_id, competencia, valor_realizado, meta, observacao, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    let lancamentosInseridos = 0;
    db.exec("BEGIN");
    try {
        for (const [competencia, data] of [...mesesMap.entries()].sort()) {
            const liquido = data.captadas - data.saidas;
            insertLanc.run(
                indCrescimento.id,
                competencia,
                liquido,
                indCrescimento.meta_padrao,
                `Captadas: ${data.captadas} | Saídas: ${data.saidas} (derivado do CSV)`,
                pHenriqueId,
            );
            lancamentosInseridos++;
        }
        db.exec("COMMIT");
    } catch (e) {
        db.exec("ROLLBACK");
        throw e;
    }
    console.log(`✅ ${lancamentosInseridos} meses de crescimento líquido inseridos`);
}

// ─── RESUMO ───────────────────────────────────────────────────────────────────
const totalUnidades = db.prepare("SELECT COUNT(*) as t FROM unidades").get().t;
const totalEmps = db.prepare("SELECT COUNT(*) as t FROM empreendimentos").get().t;
const totalProps = db.prepare("SELECT COUNT(*) as t FROM proprietarios").get().t;
const totalUsers = db.prepare("SELECT COUNT(*) as t FROM usuarios").get().t;
const ativas = db.prepare("SELECT COUNT(*) as t FROM unidades WHERE status = 'Ativo'").get().t;
const baixas = db.prepare("SELECT COUNT(*) as t FROM unidades WHERE status = 'Baixa'").get().t;
const emInteg = db.prepare("SELECT COUNT(*) as t FROM unidades WHERE status = 'Integracao'").get().t;
const fechamento = db.prepare("SELECT COUNT(*) as t FROM unidades WHERE status = 'Fechamento'").get().t;
const totalLanc = db.prepare("SELECT COUNT(*) as t FROM lancamentos_indicadores").get().t;

console.log("\n══════════════════════════════════════════════════");
console.log("  SEED CONCLUÍDO COM SUCESSO!");
console.log("══════════════════════════════════════════════════");
console.log(`  Usuários:           ${totalUsers}`);
console.log(`  Empreendimentos:    ${totalEmps}`);
console.log(`  Proprietários:      ${totalProps}`);
console.log(`  Unidades (total):   ${totalUnidades}`);
console.log(`    → Ativas:         ${ativas}`);
console.log(`    → Em Integração:  ${emInteg}`);
console.log(`    → Fechamento:     ${fechamento}`);
console.log(`    → Baixa/Inativo:  ${baixas}`);
console.log(`  Lançamentos (KRI):  ${totalLanc} meses (crescimento líquido)`);
console.log("══════════════════════════════════════════════════\n");
console.log("Credenciais de acesso:");
console.log("  Admin  → admin@likehome.com   / admin123");
console.log("  Comercial → steffany@likehome.com / user123");
console.log("  Comercial → jessica@likehome.com  / user123\n");
