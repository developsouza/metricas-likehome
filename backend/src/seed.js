require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./database');

initDatabase();

// Seed Usuários
const senha = bcrypt.hashSync('admin123', 10);
const senhaUser = bcrypt.hashSync('user123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO usuarios (nome, email, senha_hash, perfil, departamento)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run('Administrador', 'admin@likehome.com', senha, 'admin', 'Geral');
insertUser.run('Ana Marketing', 'ana@likehome.com', senhaUser, 'usuario', 'Marketing');
insertUser.run('Carlos Comercial', 'carlos@likehome.com', senhaUser, 'usuario', 'Comercial');
insertUser.run('Beatriz Atendimento', 'beatriz@likehome.com', senhaUser, 'usuario', 'Atendimento');
insertUser.run('Pedro Precificação', 'pedro@likehome.com', senhaUser, 'usuario', 'Precificacao');
insertUser.run('Fernanda Financeiro', 'fernanda@likehome.com', senhaUser, 'usuario', 'Financeiro');

// Seed Empreendimentos
const insertEmp = db.prepare(`INSERT OR IGNORE INTO empreendimentos (nome, endereco, cidade, estado) VALUES (?, ?, ?, ?)`);
insertEmp.run('Residencial Maresias', 'Rua das Flores, 100', 'Jacumã', 'PB');
insertEmp.run('Condomínio Sunset', 'Av. Beira Mar, 500', 'Conde', 'PB');
insertEmp.run('Vila Costa', 'Rua do Sol, 22', 'Pitimbu', 'PB');

// Seed Proprietários
const insertProp = db.prepare(`INSERT OR IGNORE INTO proprietarios (nome, email, telefone) VALUES (?, ?, ?)`);
insertProp.run('João Silva', 'joao@email.com', '83999990001');
insertProp.run('Maria Santos', 'maria@email.com', '83999990002');
insertProp.run('Roberto Lima', 'roberto@email.com', '83999990003');
insertProp.run('Patricia Nunes', 'patricia@email.com', '83999990004');
insertProp.run('Marcos Ferreira', 'marcos@email.com', '83999990005');

// Seed Unidades
const insertUnidade = db.prepare(`
  INSERT OR IGNORE INTO unidades 
  (empreendimento_id, numero, tipo, status, proprietario_id, responsavel_id, data_prospeccao, data_reuniao, data_fechamento, data_integracao, data_ativacao)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUnidade.run(1, '101', 'Apartamento 1Q', 'Ativo', 1, 3, '2024-01-10', '2024-01-15', '2024-01-20', '2024-02-01', '2024-02-15', );
insertUnidade.run(1, '102', 'Apartamento 2Q', 'Ativo', 2, 3, '2024-02-01', '2024-02-08', '2024-02-14', '2024-02-20', '2024-03-01');
insertUnidade.run(1, '103', 'Studio', 'Reuniao', null, 3, '2024-03-01', '2024-03-10', null, null, null);
insertUnidade.run(2, '201', 'Casa 3Q', 'Ativo', 3, 3, '2024-01-05', '2024-01-12', '2024-01-18', '2024-01-25', '2024-02-05');
insertUnidade.run(2, '202', 'Apartamento 2Q', 'Integracao', 4, 3, '2024-03-05', '2024-03-12', '2024-03-18', '2024-03-25', null);
insertUnidade.run(3, '301', 'Casa 2Q', 'Prospeccao', null, 3, '2024-03-20', null, null, null, null);
insertUnidade.run(3, '302', 'Studio', 'Fechamento', 5, 3, '2024-02-15', '2024-02-22', '2024-03-01', null, null);
insertUnidade.run(2, '203', 'Apartamento 1Q', 'Baixa', 2, 3, '2023-06-01', '2023-06-10', '2023-06-20', '2023-07-01', '2023-07-15');

// Seed Indicadores
const insertInd = db.prepare(`
  INSERT OR IGNORE INTO indicadores (departamento, tipo, nome, descricao, unidade_medida, meta_padrao)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Marketing
insertInd.run('Marketing', 'KRI', 'Leads qualificados de proprietários por mês', 'Leads de proprietários qualificados para captação', 'unidade', 20);
insertInd.run('Marketing', 'KRI', 'Leads de hóspedes por mês', 'Total de leads de hóspedes no período', 'unidade', 100);
insertInd.run('Marketing', 'KPI', 'Custo por lead (CPL)', 'Custo médio de aquisição por lead', 'R$', 50);
insertInd.run('Marketing', 'KPI', 'Reuniões geradas para o comercial', 'Nº de reuniões agendadas via Marketing', 'unidade', 10);
insertInd.run('Marketing', 'KPI', 'Taxa de qualificação dos leads', 'Lead → Reunião (%)', '%', 40);

// Comercial
insertInd.run('Comercial', 'KRI', 'Crescimento líquido de unidades', 'Unidades captadas - unidades perdidas', 'unidade', 5);
insertInd.run('Comercial', 'KPI', 'Número de reuniões realizadas', 'Total de reuniões comerciais no período', 'unidade', 15);
insertInd.run('Comercial', 'KPI', 'Taxa de conversão reunião → contrato', 'Percentual de reuniões que geram contrato', '%', 60);
insertInd.run('Comercial', 'KPI', 'Tempo médio de fechamento', 'Dias médios entre 1ª reunião e contrato assinado', 'dias', 15);

// Atendimento
insertInd.run('Atendimento', 'KRI', 'Nota média nas OTAs', 'Média das notas nas plataformas (Airbnb, Booking etc)', 'nota', 4.7);
insertInd.run('Atendimento', 'KPI', 'Tempo médio de resposta ao hóspede', 'Horas para 1ª resposta ao hóspede', 'horas', 2);
insertInd.run('Atendimento', 'KPI', 'Taxa de resolução no primeiro contato', 'Chamados resolvidos sem escalonamento (%)', '%', 80);
insertInd.run('Atendimento', 'KPI', 'Reclamações por reserva', 'Reclamações / total de reservas', 'unidade', 0.05);

// Precificacao
insertInd.run('Precificacao', 'KRI', 'Receita média por unidade', 'Receita total / unidades ativas', 'R$', 3500);
insertInd.run('Precificacao', 'KPI', 'Taxa de ocupação', 'Dias ocupados / dias disponíveis (%)', '%', 70);
insertInd.run('Precificacao', 'KPI', 'Diária média (ADR)', 'Average Daily Rate das unidades', 'R$', 250);
insertInd.run('Precificacao', 'KPI', 'Ranking dos anúncios nas OTAs', 'Posição média nos resultados das OTAs', 'posição', 3);

// Financeiro
insertInd.run('Financeiro', 'KRI', 'Resultado operacional (EBITDA)', 'EBITDA mensal da empresa', 'R$', 50000);
insertInd.run('Financeiro', 'KRI', 'Resultado mensal consolidado (DRE)', 'Resultado líquido do mês (DRE)', 'R$', 30000);
insertInd.run('Financeiro', 'KPI', 'Receita média por unidade', 'Receita total / unidades ativas', 'R$', 3500);
insertInd.run('Financeiro', 'KPI', 'Previsibilidade de fluxo de caixa', 'Realizado / projetado (%)', '%', 90);

// Seed Lançamentos (últimos 6 meses)
const insertLanc = db.prepare(`
  INSERT OR IGNORE INTO lancamentos_indicadores (indicador_id, competencia, valor_realizado, meta, usuario_id)
  VALUES (?, ?, ?, ?, ?)
`);

const meses = ['2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03'];
const valoresMkt1 = [18, 22, 25, 19, 24, 27];
const valoresMkt2 = [85, 92, 110, 78, 95, 103];
const valoresMktCPL = [55, 48, 45, 60, 47, 42];
const valoresMktReu = [8, 11, 13, 9, 12, 14];
const valoresMktTaxa = [35, 42, 48, 38, 44, 50];

meses.forEach((mes, i) => {
  insertLanc.run(1, mes, valoresMkt1[i], 20, 2);
  insertLanc.run(2, mes, valoresMkt2[i], 100, 2);
  insertLanc.run(3, mes, valoresMktCPL[i], 50, 2);
  insertLanc.run(4, mes, valoresMktReu[i], 10, 2);
  insertLanc.run(5, mes, valoresMktTaxa[i], 40, 2);
});

const valoresCom1 = [3, 5, 6, 2, 4, 5];
const valoresCom2 = [10, 14, 16, 11, 15, 17];
const valoresCom3 = [55, 62, 68, 52, 65, 70];
const valoresCom4 = [18, 14, 12, 20, 15, 13];

meses.forEach((mes, i) => {
  insertLanc.run(6, mes, valoresCom1[i], 5, 3);
  insertLanc.run(7, mes, valoresCom2[i], 15, 3);
  insertLanc.run(8, mes, valoresCom3[i], 60, 3);
  insertLanc.run(9, mes, valoresCom4[i], 15, 3);
});

const valoresAtd1 = [4.5, 4.6, 4.7, 4.4, 4.7, 4.8];
const valoresAtd2 = [2.5, 2.1, 1.8, 2.8, 2.0, 1.6];
const valoresAtd3 = [72, 76, 80, 70, 78, 82];
const valoresAtd4 = [0.08, 0.06, 0.05, 0.09, 0.05, 0.04];

meses.forEach((mes, i) => {
  insertLanc.run(10, mes, valoresAtd1[i], 4.7, 4);
  insertLanc.run(11, mes, valoresAtd2[i], 2, 4);
  insertLanc.run(12, mes, valoresAtd3[i], 80, 4);
  insertLanc.run(13, mes, valoresAtd4[i], 0.05, 4);
});

const valoresPrec1 = [3100, 3300, 3600, 2900, 3400, 3700];
const valoresPrec2 = [62, 66, 72, 58, 68, 74];
const valoresPrec3 = [220, 235, 255, 210, 240, 260];
const valoresPrec4 = [4, 3, 3, 5, 3, 2];

meses.forEach((mes, i) => {
  insertLanc.run(14, mes, valoresPrec1[i], 3500, 5);
  insertLanc.run(15, mes, valoresPrec2[i], 70, 5);
  insertLanc.run(16, mes, valoresPrec3[i], 250, 5);
  insertLanc.run(17, mes, valoresPrec4[i], 3, 5);
});

const valoresFin1 = [42000, 47000, 55000, 38000, 50000, 58000];
const valoresFin2 = [28000, 32000, 38000, 24000, 35000, 42000];
const valoresFin3 = [3100, 3300, 3600, 2900, 3400, 3700];
const valoresFin4 = [85, 90, 94, 80, 91, 96];

meses.forEach((mes, i) => {
  insertLanc.run(18, mes, valoresFin1[i], 50000, 6);
  insertLanc.run(19, mes, valoresFin2[i], 30000, 6);
  insertLanc.run(20, mes, valoresFin3[i], 3500, 6);
  insertLanc.run(21, mes, valoresFin4[i], 90, 6);
});

console.log('✅ Seed concluído com sucesso!');
console.log('');
console.log('👤 Usuários criados:');
console.log('  admin@likehome.com / admin123 (Administrador)');
console.log('  ana@likehome.com / user123 (Marketing)');
console.log('  carlos@likehome.com / user123 (Comercial)');
console.log('  beatriz@likehome.com / user123 (Atendimento)');
console.log('  pedro@likehome.com / user123 (Precificação)');
console.log('  fernanda@likehome.com / user123 (Financeiro)');
