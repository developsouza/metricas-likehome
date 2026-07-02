const { DatabaseSync } = require("node:sqlite");
const path = require("path");
require("dotenv").config();

const dbPath = process.env.DB_PATH || "./database.sqlite";
const db = new DatabaseSync(path.resolve(dbPath));

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

function initDatabase() {
    migrateUsuariosPerfil();
    db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL DEFAULT 'usuario' CHECK(perfil IN ('admin','usuario','analise_gestao')),
      departamento TEXT CHECK(departamento IN ('Marketing','Comercial','Atendimento','Precificacao','Financeiro','Geral')),
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS empreendimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      endereco TEXT,
      cidade TEXT,
      estado TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS proprietarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT,
      email TEXT,
      telefone TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS unidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empreendimento_id INTEGER NOT NULL,
      numero TEXT NOT NULL,
      tipo TEXT,
      status TEXT NOT NULL DEFAULT 'Prospeccao' CHECK(status IN ('Prospeccao','Reuniao','Fechamento','Integracao','Ativo','Baixa')),
      proprietario_id INTEGER,
      responsavel_id INTEGER,
      data_prospeccao DATE,
      data_reuniao DATE,
      data_fechamento DATE,
      data_integracao DATE,
      data_ativacao DATE,
      data_baixa DATE,
      observacoes TEXT,
      atualizado_em DATETIME,
      comissao_adm REAL,
      bpo TEXT,
      taxa_enxoval TEXT,
      nome_indicacao TEXT,
      status_pagamento_indicacao TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id),
      FOREIGN KEY (proprietario_id) REFERENCES proprietarios(id),
      FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS indicadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      departamento TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('KRI','KPI')),
      nome TEXT NOT NULL,
      descricao TEXT,
      unidade_medida TEXT NOT NULL DEFAULT 'unidade',
      meta_padrao REAL,
      ativo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS lancamentos_indicadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicador_id INTEGER NOT NULL,
      competencia TEXT NOT NULL,
      valor_realizado REAL NOT NULL,
      meta REAL,
      observacao TEXT,
      usuario_id INTEGER NOT NULL,
      lancado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (indicador_id) REFERENCES indicadores(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      UNIQUE(indicador_id, competencia)
    );

    CREATE TABLE IF NOT EXISTS historico_status_unidade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unidade_id INTEGER NOT NULL,
      status_anterior TEXT,
      status_novo TEXT NOT NULL,
      data_mudanca DATE NOT NULL,
      usuario_id INTEGER,
      observacao TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unidade_id) REFERENCES unidades(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS atividades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      departamento TEXT NOT NULL CHECK(departamento IN ('Marketing','Comercial','Atendimento','Precificacao','Financeiro')),
      titulo TEXT NOT NULL,
      descricao TEXT,
      status TEXT NOT NULL DEFAULT 'A Fazer' CHECK(status IN ('A Fazer','Em Andamento','Aguardando Validação','Concluído','Cancelado')),
      prioridade TEXT NOT NULL DEFAULT 'Média' CHECK(prioridade IN ('Baixa','Média','Alta','Urgente')),
      responsavel_id INTEGER,
      criado_por INTEGER NOT NULL,
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_por INTEGER,
      atualizado_em DATETIME,
      prazo DATETIME,
      excluida_em DATETIME,
      FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
      FOREIGN KEY (criado_por) REFERENCES usuarios(id),
      FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS atividades_comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      atividade_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (atividade_id) REFERENCES atividades(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS atividades_historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      atividade_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      acao TEXT NOT NULL,
      campo TEXT,
      valor_anterior TEXT,
      valor_novo TEXT,
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (atividade_id) REFERENCES atividades(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS notificacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      referencia_tipo TEXT,
      referencia_id INTEGER,
      lida INTEGER NOT NULL DEFAULT 0,
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE INDEX IF NOT EXISTS idx_atividades_departamento_status ON atividades(departamento, status);
    CREATE INDEX IF NOT EXISTS idx_atividades_responsavel ON atividades(responsavel_id);
    CREATE INDEX IF NOT EXISTS idx_comentarios_atividade ON atividades_comentarios(atividade_id);
    CREATE INDEX IF NOT EXISTS idx_historico_atividade ON atividades_historico(atividade_id);
    CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida, criado_em);
  `);
}

function migrateUsuariosPerfil() {
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'").get();
    if (!row || row.sql.includes("analise_gestao")) return;

    db.exec("PRAGMA foreign_keys = OFF");
    try {
        db.exec("BEGIN IMMEDIATE");
        db.exec(`
          CREATE TABLE usuarios_nova (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            perfil TEXT NOT NULL DEFAULT 'usuario' CHECK(perfil IN ('admin','usuario','analise_gestao')),
            departamento TEXT CHECK(departamento IN ('Marketing','Comercial','Atendimento','Precificacao','Financeiro','Geral')),
            ativo INTEGER NOT NULL DEFAULT 1,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO usuarios_nova (id,nome,email,senha_hash,perfil,departamento,ativo,criado_em)
          SELECT id,nome,email,senha_hash,perfil,departamento,ativo,criado_em FROM usuarios;
          DROP TABLE usuarios;
          ALTER TABLE usuarios_nova RENAME TO usuarios;
        `);
        db.exec("COMMIT");
    } catch (error) {
        try { db.exec("ROLLBACK"); } catch (_) {}
        throw error;
    } finally {
        db.exec("PRAGMA foreign_keys = ON");
    }
}

// Migrações seguras — não lançam erro se coluna já existe
const alterações = [
    `ALTER TABLE unidades ADD COLUMN atualizado_em DATETIME`,
    `ALTER TABLE unidades ADD COLUMN comissao_adm REAL`,
    `ALTER TABLE unidades ADD COLUMN bpo TEXT`,
    `ALTER TABLE unidades ADD COLUMN taxa_enxoval TEXT`,
    `ALTER TABLE unidades ADD COLUMN nome_indicacao TEXT`,
    `ALTER TABLE unidades ADD COLUMN status_pagamento_indicacao TEXT`,
];
for (const sql of alterações) {
    try {
        db.exec(sql);
    } catch (_) {}
}

module.exports = { db, initDatabase };
