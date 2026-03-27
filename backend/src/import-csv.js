/**
 * import-csv.js — Importação única dos dados do CSV para o banco
 *
 * Use apenas para migração inicial de dados existentes.
 * Após a importação, todos os dados são gerenciados pelo sistema (CRUD manual).
 *
 * Uso:
 *   node src/import-csv.js
 *   NODE_ENV=production DB_PATH=/opt/metricas-likehome/backend/data/database.sqlite node src/import-csv.js
 *
 * ATENÇÃO: Este script NÃO apaga dados já existentes.
 *          Execute apenas em banco vazio ou com cuidado.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { db, initDatabase } = require("./database");

initDatabase();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseDate(s) {
    if (!s || !s.trim() || s.trim() === "-") return null;
    const parts = s.trim().split("/");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    const year = parseInt(y, 10);
    if (!y || y.length < 4 || year > 2100 || year < 1900) return null;
    return `${y.substring(0, 4)}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function mapStatus(s) {
    const t = (s || "").trim();
    if (t === "Ativo") return "Ativo";
    if (t === "Inativo") return "Baixa";
    if (t === "Em Integração") return "Integracao";
    if (t.toLowerCase().startsWith("pendente")) return "Fechamento";
    return "Ativo";
}

function parseComissao(s) {
    if (!s || !s.trim()) return null;
    const v = parseFloat(s.replace("%", "").trim());
    return isNaN(v) ? null : v;
}

// ─── LER CSV ──────────────────────────────────────────────────────────────────

const csvPath = path.resolve(__dirname, "../../Relatorio Comercial - LikeHome v3(BaseDados).csv");

if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ CSV não encontrado em:\n   ${csvPath}\n`);
    process.exit(1);
}

console.log("📄 Lendo CSV...");
const csvText = fs.readFileSync(csvPath, "utf-8");
const dataLines = csvText.split(/\r?\n/).slice(5); // pula 5 linhas de cabeçalho

const rows = [];
for (const line of dataLines) {
    const cols = line.split(";");
    if (cols.length < 7) continue;
    const emp = (cols[0] || "").trim();
    const unid = (cols[1] || "").trim();
    const prop = (cols[2] || "").trim();
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

console.log(`✅ ${rows.length} linhas válidas no CSV`);

// ─── MAPEAR USUÁRIOS RESPONSÁVEIS ─────────────────────────────────────────────

const respMap = {};
const usuarios = db.prepare("SELECT id, nome FROM usuarios").all();
for (const u of usuarios) {
    respMap[u.nome] = u.id;
    // permite match por primeiro nome também
    const primeiro = u.nome.split(" ")[0];
    if (!respMap[primeiro]) respMap[primeiro] = u.id;
}

// ─── EMPREENDIMENTOS ──────────────────────────────────────────────────────────

console.log("🏢 Importando empreendimentos...");

const empNomes = [...new Set(rows.map((r) => r.empreendimento))].sort();
const empMap = new Map();

// Carrega empreendimentos já existentes no banco
const empsExistentes = db.prepare("SELECT id, nome FROM empreendimentos").all();
for (const e of empsExistentes) empMap.set(e.nome.trim(), e.id);

let empsInseridos = 0;
const insertEmpStmt = db.prepare(`INSERT OR IGNORE INTO empreendimentos (nome, cidade, estado) VALUES (?, ?, ?)`);
for (const nome of empNomes) {
    if (!empMap.has(nome)) {
        const result = insertEmpStmt.run(nome, "João Pessoa", "PB");
        if (result.lastInsertRowid) {
            empMap.set(nome, result.lastInsertRowid);
            empsInseridos++;
        }
    }
}

// Recarrega para pegar ids dos que já existiam
const empsAtualizados = db.prepare("SELECT id, nome FROM empreendimentos").all();
for (const e of empsAtualizados) empMap.set(e.nome.trim(), e.id);

console.log(`✅ ${empsInseridos} novos empreendimentos inseridos (total: ${empMap.size})`);

// ─── PROPRIETÁRIOS ────────────────────────────────────────────────────────────

console.log("👥 Importando proprietários...");

const propNomes = [...new Set(rows.map((r) => r.proprietario).filter(Boolean))].sort();
const propMap = new Map();

const propsExistentes = db.prepare("SELECT id, nome FROM proprietarios").all();
for (const p of propsExistentes) propMap.set(p.nome.trim(), p.id);

let propsInseridos = 0;
const insertPropStmt = db.prepare(`INSERT OR IGNORE INTO proprietarios (nome) VALUES (?)`);
for (const nome of propNomes) {
    if (!propMap.has(nome)) {
        const result = insertPropStmt.run(nome);
        if (result.lastInsertRowid) {
            propMap.set(nome, result.lastInsertRowid);
            propsInseridos++;
        }
    }
}

// Recarrega
const propsAtualizados = db.prepare("SELECT id, nome FROM proprietarios").all();
for (const p of propsAtualizados) propMap.set(p.nome.trim(), p.id);

console.log(`✅ ${propsInseridos} novos proprietários inseridos (total: ${propMap.size})`);

// ─── UNIDADES ─────────────────────────────────────────────────────────────────

console.log("🏠 Importando unidades...");

const insertUnidadeStmt = db.prepare(`
    INSERT OR IGNORE INTO unidades (
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
let unidadesIgnoradas = 0;

db.exec("BEGIN");
try {
    for (const row of rows) {
        const empId = empMap.get(row.empreendimento);
        if (!empId) {
            unidadesIgnoradas++;
            continue;
        }

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

        if (result.lastInsertRowid) {
            insertHistoricoStmt.run(result.lastInsertRowid, row.status);
            unidadesInseridas++;
        } else {
            unidadesIgnoradas++;
        }
    }
    db.exec("COMMIT");
} catch (e) {
    db.exec("ROLLBACK");
    throw e;
}

console.log(`✅ ${unidadesInseridas} unidades inseridas (${unidadesIgnoradas} ignoradas — duplicatas)`);

// ─── RESUMO ───────────────────────────────────────────────────────────────────

const totalUnidades = db.prepare("SELECT COUNT(*) as t FROM unidades").get().t;
const totalEmps = db.prepare("SELECT COUNT(*) as t FROM empreendimentos").get().t;
const totalProps = db.prepare("SELECT COUNT(*) as t FROM proprietarios").get().t;
const ativas = db.prepare("SELECT COUNT(*) as t FROM unidades WHERE status = 'Ativo'").get().t;
const baixas = db.prepare("SELECT COUNT(*) as t FROM unidades WHERE status = 'Baixa'").get().t;
const emInteg = db.prepare("SELECT COUNT(*) as t FROM unidades WHERE status = 'Integracao'").get().t;
const fechamento = db.prepare("SELECT COUNT(*) as t FROM unidades WHERE status = 'Fechamento'").get().t;

console.log("\n══════════════════════════════════════════════════");
console.log("  IMPORTAÇÃO CSV CONCLUÍDA!");
console.log("══════════════════════════════════════════════════");
console.log(`  Empreendimentos:    ${totalEmps}`);
console.log(`  Proprietários:      ${totalProps}`);
console.log(`  Unidades (total):   ${totalUnidades}`);
console.log(`    → Ativas:         ${ativas}`);
console.log(`    → Em Integração:  ${emInteg}`);
console.log(`    → Fechamento:     ${fechamento}`);
console.log(`    → Baixa/Inativo:  ${baixas}`);
console.log("══════════════════════════════════════════════════\n");
console.log("A partir de agora, gerencie os dados pelo sistema.");
console.log("O CSV não é mais necessário.\n");
