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
    const t = s.trim();
    // Formato ISO: AAAA-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    // Formato DD/MM/AAAA
    const parts = t.split("/");
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
const csvText = fs.readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, ""); // remove BOM
// Detecta linha de cabeçalho real (pula linhas de metadados até encontrar "Empreendimento")
const allLines = csvText.split(/\r?\n/);
let dataStartIdx = 5; // padrão: 5 linhas de cabeçalho
for (let i = 0; i < Math.min(allLines.length, 10); i++) {
    if ((allLines[i] || "").trim().toLowerCase().startsWith("empreendimento")) {
        dataStartIdx = i + 1;
        break;
    }
}
const dataLines = allLines.slice(dataStartIdx);

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

// ─── RESOLVER DUPLICATAS DO CSV ───────────────────────────────────────────────
// Quando a mesma unidade (empreendimento + número) aparece mais de uma vez no CSV
// (ex.: unidade que saiu e voltou), mantém apenas o registro de maior prioridade:
// Ativo > Integração > Fechamento > Reunião > Prospecção > Baixa/Inativo
// Entre mesma prioridade, prefere o com data de ativação ou fechamento mais recente.
const STATUS_PRIORITY = { Ativo: 5, Integracao: 4, Fechamento: 3, Reuniao: 2, Prospeccao: 1, Baixa: 0 };

const bestRowsMap = new Map(); // "emp|numero" → row com maior prioridade
for (const row of rows) {
    const key = `${row.empreendimento}|${row.numero}`;
    if (!bestRowsMap.has(key)) {
        bestRowsMap.set(key, row);
    } else {
        const prev = bestRowsMap.get(key);
        const prevPrio = STATUS_PRIORITY[prev.status] ?? -1;
        const newPrio = STATUS_PRIORITY[row.status] ?? -1;
        if (newPrio > prevPrio) {
            bestRowsMap.set(key, row);
        } else if (newPrio === prevPrio) {
            // Prefere contrato mais recente: data_fechamento (contrato) tem prioridade sobre data_ativacao
            const prevDate = prev.data_fechamento || prev.data_ativacao || "";
            const newDate = row.data_fechamento || row.data_ativacao || "";
            if (newDate > prevDate) bestRowsMap.set(key, row);
        }
    }
}

const rowsUnicos = [...bestRowsMap.values()];
const duplicatasIgnoradas = rows.length - rowsUnicos.length;
if (duplicatasIgnoradas > 0) {
    console.log(`ℹ️  ${duplicatasIgnoradas} linha(s) duplicada(s) no CSV resolvidas (mantido contrato de maior prioridade por unidade)`);
}

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

const empNomes = [...new Set(rowsUnicos.map((r) => r.empreendimento))].sort();
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

const propNomes = [...new Set(rowsUnicos.map((r) => r.proprietario).filter(Boolean))].sort();
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
    INSERT INTO unidades (
        empreendimento_id, numero, status,
        proprietario_id, responsavel_id, observacoes,
        data_fechamento, data_ativacao, data_baixa,
        comissao_adm, bpo, taxa_enxoval,
        nome_indicacao, status_pagamento_indicacao,
        atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const checkUnidadeStmt = db.prepare(`SELECT id FROM unidades WHERE empreendimento_id = ? AND numero = ? LIMIT 1`);

const updateUnidadeStmt = db.prepare(`
    UPDATE unidades SET
        status = ?, proprietario_id = ?, responsavel_id = ?, observacoes = ?,
        data_fechamento = ?, data_ativacao = ?, data_baixa = ?,
        comissao_adm = ?, bpo = ?, taxa_enxoval = ?,
        nome_indicacao = ?, status_pagamento_indicacao = ?,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE empreendimento_id = ? AND numero = ?
`);

const insertHistoricoStmt = db.prepare(`
    INSERT INTO historico_status_unidade (unidade_id, status_novo, data_mudanca)
    VALUES (?, ?, date('now'))
`);

let unidadesInseridas = 0;
let unidadesAtualizadas = 0;

db.exec("BEGIN");
try {
    for (const row of rowsUnicos) {
        const empId = empMap.get(row.empreendimento);
        if (!empId) continue;

        const propId = row.proprietario ? propMap.get(row.proprietario) || null : null;
        const respId = row.responsavel_nome ? respMap[row.responsavel_nome] || null : null;

        // Verifica se a unidade já existe antes de inserir (evita duplicatas sem precisar de UNIQUE constraint)
        const existing = checkUnidadeStmt.get(empId, row.numero);

        if (existing) {
            // Sincroniza datas e campos com o CSV
            updateUnidadeStmt.run(
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
                empId,
                row.numero,
            );
            unidadesAtualizadas++;
        } else {
            // Insere nova unidade
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
            }
        }
    }
    db.exec("COMMIT");
} catch (e) {
    db.exec("ROLLBACK");
    throw e;
}

console.log(`✅ ${unidadesInseridas} novas unidades inseridas, ${unidadesAtualizadas} atualizadas com datas do CSV`);

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
