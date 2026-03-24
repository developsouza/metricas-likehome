const { DatabaseSync } = require("node:sqlite");
const path = require("path");
require("dotenv").config();

const dbPath = process.env.DB_PATH || "./database.sqlite";
const db = new DatabaseSync(path.resolve(dbPath));

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

function initDatabase() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      perfil TEXT NOT NULL DEFAULT 'usuario' CHECK(perfil IN ('admin','usuario')),
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
  `);
}

// Adiciona atualizado_em se ainda não existir (migrações seguras)
try {
    db.exec(`ALTER TABLE unidades ADD COLUMN atualizado_em DATETIME`);
} catch (_) {}

module.exports = { db, initDatabase };
