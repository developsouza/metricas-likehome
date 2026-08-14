const MARCADORES_MOJIBAKE = /(?:Ã[\x80-\xBF]|Â[\x80-\xBF]|â[\x80-\xBF]|ðŸ)/g;

function pontuacaoCorrupcao(texto) {
    if (typeof texto !== "string") return 0;
    return (texto.match(/\uFFFD/g) || []).length * 10 + (texto.match(MARCADORES_MOJIBAKE) || []).length * 3;
}

function normalizarTexto(valor) {
    if (typeof valor !== "string") return valor;
    let texto = valor;

    // Corrige casos recuperáveis como "AntÃ´nio" e "ManutenÃ§Ã£o".
    for (let tentativa = 0; tentativa < 2 && MARCADORES_MOJIBAKE.test(texto); tentativa++) {
        MARCADORES_MOJIBAKE.lastIndex = 0;
        const convertido = Buffer.from(texto, "latin1").toString("utf8");
        if (convertido.includes("\uFFFD") || pontuacaoCorrupcao(convertido) >= pontuacaoCorrupcao(texto)) break;
        texto = convertido;
    }
    MARCADORES_MOJIBAKE.lastIndex = 0;
    return texto.normalize("NFC");
}

function decodificarBuffer(buffer) {
    if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);
    let texto;

    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
        texto = new TextDecoder("utf-16le").decode(buffer.subarray(2));
    } else if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
        texto = new TextDecoder("utf-16be").decode(buffer.subarray(2));
    } else {
        try {
            texto = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
        } catch (_) {
            // CSVs salvos pelo Excel no Windows frequentemente usam Windows-1252.
            texto = new TextDecoder("windows-1252").decode(buffer);
        }
    }

    return normalizarTexto(texto.replace(/^\uFEFF/, ""));
}

function normalizarEstrutura(valor) {
    if (typeof valor === "string") return normalizarTexto(valor);
    if (Array.isArray(valor)) return valor.map(normalizarEstrutura);
    if (valor && typeof valor === "object" && Object.getPrototypeOf(valor) === Object.prototype) {
        return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave, normalizarEstrutura(item)]));
    }
    return valor;
}

function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function repararTextosPersistidos(db) {
    const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    let total = 0;

    for (const { name: tabela } of tabelas) {
        if (!/^[a-zA-Z0-9_]+$/.test(tabela)) continue;
        const colunas = db.prepare(`PRAGMA table_info("${tabela}")`).all().filter((coluna) => /TEXT/i.test(coluna.type));
        if (!colunas.length) continue;
        const nomesColunas = colunas.map((coluna) => `"${coluna.name}"`).join(",");
        const linhas = db.prepare(`SELECT rowid AS _rowid,${nomesColunas} FROM "${tabela}"`).all();

        for (const coluna of colunas) {
            const valoresCorretos = [...new Set(linhas.map((linha) => linha[coluna.name]).filter((valor) => typeof valor === "string" && !valor.includes("\uFFFD")))];
            const atualizar = db.prepare(`UPDATE "${tabela}" SET "${coluna.name}"=? WHERE rowid=?`);

            for (const linha of linhas) {
                const original = linha[coluna.name];
                if (typeof original !== "string") continue;
                let corrigido = normalizarTexto(original);

                // U+FFFD já perdeu o byte original. Só corrige quando há exatamente
                // um registro canônico equivalente na mesma coluna.
                if (corrigido.includes("\uFFFD")) {
                    const padrao = `^${corrigido.split("\uFFFD").map(escaparRegex).join(".")}$`;
                    const regex = new RegExp(padrao, "iu");
                    const candidatos = valoresCorretos.filter((valor) => regex.test(normalizarTexto(valor)));
                    if (candidatos.length === 1) corrigido = candidatos[0];
                }

                if (corrigido !== original) {
                    atualizar.run(corrigido, linha._rowid);
                    linha[coluna.name] = corrigido;
                    total++;
                }
            }
        }
    }

    if (total > 0) console.log(`[utf8] ${total} valor(es) de texto reparado(s) no banco.`);
    return total;
}

module.exports = { decodificarBuffer, normalizarTexto, normalizarEstrutura, repararTextosPersistidos };
