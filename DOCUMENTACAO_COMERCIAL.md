# Métricas LikeHome

## Documentação comercial e funcional

**Versão analisada:** agosto de 2026  
**Objetivo deste documento:** apresentar o sistema, seus benefícios, públicos, telas, funcionalidades e fluxos de uso de forma adequada a reuniões comerciais, demonstrações e propostas de implantação.

---

## 1. Visão do produto

O **Métricas LikeHome** é uma plataforma de inteligência operacional e gestão de desempenho para empresas de hospedagem, administração de imóveis e short stay. O sistema conecta, em um único ambiente:

- carteira de empreendimentos, proprietários e unidades;
- funil comercial de captação e ativação de imóveis;
- indicadores estratégicos e operacionais por departamento;
- análises consolidadas de portfólio e desempenho;
- atividades, responsáveis, prazos, comentários e notificações;
- importação e exportação de dados para apoiar a rotina de gestão.

Em vez de manter informações dispersas em planilhas, relatórios e conversas, a plataforma cria uma fonte central para acompanhar o que aconteceu, entender a situação atual e direcionar as próximas ações.

### Proposta de valor

> Transformar dados operacionais da gestão de imóveis em visibilidade executiva, responsabilização das equipes e decisões orientadas por indicadores.

### Principais ganhos para o negócio

- **Visão única da operação:** portfólio, pipeline, resultados e tarefas no mesmo workspace.
- **Decisão mais rápida:** dashboards executivos e análises históricas reduzem consolidações manuais.
- **Gestão por metas:** KRIs e KPIs são acompanhados por competência, departamento, realizado e meta.
- **Previsibilidade comercial:** o avanço de cada unidade é registrado da prospecção à ativação ou baixa.
- **Responsabilização:** unidades e atividades podem ser vinculadas a responsáveis e prazos.
- **Governança:** acessos e menus variam conforme o perfil do usuário.
- **Escalabilidade operacional:** importações CSV aceleram a carga e a atualização de grandes bases.
- **Comunicação contextual:** comentários, histórico e notificações permanecem ligados à atividade correspondente.

---

## 2. Públicos atendidos

### Direção e administração

Obtêm uma visão consolidada do portfólio, crescimento líquido, pipeline, distribuição da carteira e cumprimento das metas de cada departamento.

### Análise e gestão

Acompanham tendências, resultados comparativos e execução das atividades de todos os setores, sem alterar cadastros operacionais.

### Líderes e equipes departamentais

Visualizam os indicadores do próprio setor, registram resultados mensais e administram as atividades sob sua responsabilidade.

### Operação comercial e de implantação

Acompanham unidades desde a prospecção, passando por reunião, fechamento e integração, até a ativação ou baixa.

---

## 3. Perfis de acesso

O sistema possui autenticação individual e três perfis funcionais.

| Recurso | Administrador | Análise/Gestão | Usuário de departamento |
|---|:---:|:---:|:---:|
| Dashboard administrativo | Sim | Não | Não |
| Dashboard do próprio departamento | Não se aplica | Não | Sim |
| Análise BI | Sim | Sim | Não |
| Atividades de todos os setores | Sim | Sim, leitura e comentários | Não |
| Atividades do próprio setor | Sim | Sim, leitura e comentários | Sim, cria e edita |
| Excluir atividades | Sim | Não | Não |
| Pipeline de unidades | Gestão completa | Consulta autenticada por rota | Consulta |
| Empreendimentos, proprietários e unidades | Gestão completa | Sem menu administrativo | Sem menu administrativo |
| Lançamentos de indicadores | Todos os setores | Sem menu | Próprio setor |
| Cadastro de indicadores | Sim | Não | Não |
| Cadastro de usuários | Sim | Não | Não |
| Importação CSV | Sim | Não | Não |
| Notificações, tema e logout | Sim | Sim | Sim |

**Observação de escopo:** o menu do perfil Análise/Gestão foi desenhado para Análise BI e Acompanhamento de Setores. A rota autenticada do pipeline também pode ser acessada diretamente na versão atual, embora não apareça nesse menu.

---

## 4. Navegação e experiência geral

Após o login, o usuário acessa um workspace composto por menu lateral e barra superior.

### Menu lateral

O menu é organizado de acordo com o perfil:

- **Administrador:** Visão Geral, Operacional, Indicadores e Administração.
- **Análise/Gestão:** Análise BI e Acompanhamento de Setores.
- **Usuário:** Meu Departamento e Consulta.

O rodapé apresenta nome, departamento, perfil e comando de saída.

### Barra superior

- título contextual da página;
- data atual por extenso;
- alternância entre tema claro e escuro, com preferência mantida no navegador;
- sino de notificações com contador de não lidas;
- avatar com as iniciais do usuário;
- menu recolhível para telas menores.

### Notificações

As notificações são atualizadas periodicamente e incluem eventos relacionados às atividades, como criação, alteração, comentário e atraso. O usuário pode:

- ver o total de notificações não lidas;
- abrir as 20 notificações mais recentes;
- marcar todas como lidas;
- clicar em uma notificação para abrir diretamente a atividade relacionada.

---

## 5. Telas e funcionalidades

### 5.1 Login

**Finalidade:** controlar o acesso e apresentar o posicionamento do produto.

**Elementos e ações:**

- formulário com e-mail e senha;
- opção de mostrar ou ocultar a senha;
- mensagem para credenciais inválidas;
- indicador de processamento durante a autenticação;
- redirecionamento para a experiência adequada ao perfil;
- apresentação dos pilares: dashboards, pipeline, BI e metas departamentais.

**Regras:** somente usuários ativos e com credenciais válidas acessam o ambiente. A sessão usa token e é encerrada automaticamente quando a autenticação deixa de ser válida.

### 5.2 Dashboard administrativo

**Público:** administrador.  
**Finalidade:** oferecer uma leitura executiva do portfólio e dos resultados de toda a operação.

**Controles:** seleção da competência mensal.

**Resumo executivo:**

- unidades ativas e total do portfólio;
- unidades em integração;
- unidades em fechamento/pendência;
- unidades em baixa;
- crescimento líquido, com captações, saídas e comparação com a meta.

**Análises visuais:**

- captações, saídas e saldo líquido nos últimos 12 meses;
- pipeline por status em gráfico de distribuição;
- ranking dos principais empreendimentos por unidades ativas;
- distribuição do BPO nas unidades ativas;
- distribuição por percentual de administração;
- unidades ativas por responsável.

**Gestão por indicadores:**

- alertas automáticos para KRIs abaixo do esperado;
- tabela de KRIs por departamento;
- realizado, meta, percentual de atingimento e status visual.

**Detalhamento do portfólio:**

- tabela paginada por empreendimento;
- totais por status;
- números clicáveis que abrem a relação de unidades correspondente;
- detalhamento com unidade, proprietário, responsável, status, contrato e ativação.

### 5.3 Dashboard do departamento

**Público:** usuário de departamento.  
**Finalidade:** traduzir as metas do setor em acompanhamento simples e acionável.

**Funcionalidades:**

- seleção da competência;
- cards dos KRIs com realizado, meta, percentual e barra de progresso;
- status por cor: acima da meta, atenção, abaixo ou pendente;
- seleção de um KRI para abrir sua evolução dos últimos seis meses;
- tabela de KPIs com unidade de medida, realizado, meta e atingimento;
- mini-histórico visual de seis meses para cada KPI.

O indicador **Crescimento líquido de unidades** é calculado automaticamente a partir das ativações e baixas do portfólio, evitando duplicidade de lançamento desse resultado.

### 5.4 Análise BI

**Público:** administrador e Análise/Gestão.  
**Finalidade:** apoiar análises históricas, comparações entre departamentos e leitura da composição da carteira.

**Controles:** período inicial e final por competência e abas por departamento na análise detalhada de KRIs.

**Resumo do portfólio:**

- total de unidades;
- unidades ativas e participação percentual;
- unidades em integração;
- unidades em fechamento;
- baixas.

**Visualizações:**

- captações e saídas nos últimos 12 meses;
- top 15 empreendimentos por unidades ativas;
- composição de BPO para unidades ativas e em integração;
- composição por percentual de administração;
- unidades ativas por responsável;
- radar de atingimento médio dos KRIs;
- evolução mensal do atingimento médio por departamento.

**Bases analíticas:**

- portfólio completo por empreendimento e cidade, com total, ativas, integração, fechamento e baixas;
- tabela paginada de KRIs por departamento, competência, indicador, realizado, meta e atingimento.

### 5.5 Acompanhamento de setores

**Público:** todos os perfis, respeitando o escopo de cada um.  
**Finalidade:** coordenar atividades, responsáveis e prazos em um quadro de gestão visual.

**Visão Kanban:**

- A Fazer;
- Em Andamento;
- Aguardando Validação;
- Concluído;
- Cancelado.

**Resumo:** total, pendentes, em andamento, em validação, concluídas e atrasadas.

**Filtros:** status, prioridade, responsável, intervalo de criação, somente atrasadas e atividades sem atualização há 7, 15 ou 30 dias.

**Cadastro e acompanhamento:**

- título e descrição;
- status;
- prioridade Baixa, Média, Alta ou Urgente;
- responsável pertencente ao departamento;
- prazo com data e hora;
- identificação do criador e momento da criação;
- comentários em ordem cronológica;
- histórico das alterações;
- destaque visual para tarefas atrasadas;
- contador de comentários no cartão.

**Permissões:**

- administrador cria e edita em qualquer setor e pode excluir;
- usuário cria e edita atividades do próprio departamento;
- Análise/Gestão acompanha todos os setores e comenta, mas não cria nem altera;
- todos que podem visualizar uma atividade também podem comentar nela.

### 5.6 Pipeline de unidades

**Público:** administrador para gestão; demais usuários para consulta.  
**Finalidade:** acompanhar o ciclo comercial e operacional de cada imóvel.

**Etapas do pipeline:**

1. Prospecção;
2. Reunião;
3. Fechamento;
4. Integração;
5. Ativo;
6. Baixa/Inativo.

**Funcionalidades:**

- resumo com quantidade por etapa;
- busca por unidade ou empreendimento;
- filtros por status, empreendimento e responsável;
- listagem paginada;
- visualização de proprietário, responsável, tipo e todas as datas do funil;
- limpeza rápida dos filtros;
- criação, edição e exclusão pelo administrador.

**Dados da unidade no pipeline:** empreendimento, identificação, tipo, proprietário, responsável, status, datas de prospecção, reunião, fechamento, integração, ativação e baixa, além de observações.

### 5.7 Lançamento de indicadores

**Público:** administrador e usuários departamentais.  
**Finalidade:** registrar resultados de KRIs e KPIs por mês.

**Funcionalidades:**

- seleção da competência;
- filtro de departamento para o administrador;
- agrupamento dos indicadores por setor;
- progresso geral de preenchimento em quantidade e percentual;
- identificação de lançados e pendentes;
- registro de valor realizado, meta do período e observação;
- edição de lançamento existente;
- exclusão pelo administrador;
- cálculo e classificação automática do atingimento.

**Faixas visuais:**

- **Acima:** 100% ou mais da meta;
- **Atenção:** de 80% a 99,9%;
- **Abaixo:** menos de 80%;
- **Pendente:** sem lançamento ou sem base de cálculo.

Há apenas um lançamento por indicador e competência. Usuários comuns editam os lançamentos que eles próprios registraram; o administrador possui visão e gestão global.

### 5.8 Empreendimentos

**Público:** administrador.  
**Finalidade:** organizar os ativos por edifício ou empreendimento.

**Funcionalidades:**

- busca por nome ou cidade;
- cadastro e edição de nome, endereço, cidade e estado;
- contagem de unidades totais e ativas;
- status ativo/inativo;
- exclusão com validação das regras de integridade;
- paginação e ações por registro.

### 5.9 Proprietários

**Público:** administrador.  
**Finalidade:** manter os titulares vinculados às unidades.

**Funcionalidades:**

- busca por nome, CPF/CNPJ, e-mail ou telefone;
- cadastro e edição de nome, documento, e-mail e telefone;
- listagem paginada;
- exclusão protegida quando houver vínculos que impeçam a operação.

### 5.10 Unidades

**Público:** administrador.  
**Finalidade:** manter a base detalhada do portfólio e gerar recortes operacionais.

**Busca, filtros e organização:**

- pesquisa por número, empreendimento ou proprietário;
- filtro por empreendimento e status;
- intervalo de datas aplicável a prospecção, reunião, contrato, integração, ativação ou baixa;
- ordenação clicável por empreendimento, número, status, proprietário, percentual de administração, BPO, contrato, ativação ou responsável;
- paginação de 20 registros.

**Cadastro da unidade:**

- empreendimento e número/identificação;
- tipo: Studio, apartamentos de 1 a 3 quartos, casas de 2 ou 3 quartos ou cobertura;
- status do pipeline;
- proprietário e responsável;
- percentual de administração;
- BPO do proprietário ou da LikeHome;
- taxa de enxoval;
- nome de quem realizou a indicação;
- situação do pagamento da indicação;
- seis datas do ciclo da unidade;
- observações.

**Exportação:**

- formatos CSV e PDF;
- escolha individual das colunas;
- atalhos para selecionar ou remover todas as colunas;
- exportação respeitando o conjunto filtrado exibido;
- proteção contra interpretação indevida de conteúdo como fórmula ao gerar CSV.

**Rastreabilidade:** alterações de status geram histórico com status anterior, novo status, data e usuário responsável.

### 5.11 Indicadores

**Público:** administrador.  
**Finalidade:** configurar o catálogo de métricas usado pelos dashboards e lançamentos.

**Funcionalidades:**

- agrupamento por departamento;
- filtro por departamento e tipo;
- criação e edição de indicador;
- definição como KRI ou KPI;
- nome e descrição;
- unidade de medida;
- meta padrão;
- ativação e desativação sem apagar o histórico;
- contagem de indicadores ativos e totais.

### 5.12 Usuários

**Público:** administrador.  
**Finalidade:** administrar identidades, perfis e vínculo organizacional.

**Funcionalidades:**

- cadastro de nome, e-mail e senha;
- escolha do perfil: Administrador, Usuário ou Análise/Gestão;
- vínculo aos departamentos Marketing, Comercial, Atendimento, Precificação, Financeiro ou Geral;
- ativação e desativação de acesso;
- alteração de dados e troca opcional de senha;
- visão de usuários ativos em relação ao total.

### 5.13 Importação CSV

**Público:** administrador.  
**Finalidade:** acelerar a implantação inicial e atualizações em massa.

O processo é dividido em **seleção, validação e importação**, reduzindo erros antes da gravação.

#### Portfólio comercial

Importa empreendimentos, proprietários e unidades.

- colunas obrigatórias: Empreendimento, Unidade e Status da unidade;
- colunas opcionais: proprietário, contrato, ativação, saída, comissão de administração, BPO, taxa de enxoval, indicação, pagamento de indicação, responsável e observação;
- cria empreendimentos e proprietários ainda inexistentes;
- cria novas unidades e atualiza unidades já localizadas pela combinação empreendimento + número;
- ignora registros sem mudança;
- trata ocorrências duplicadas do mesmo imóvel, priorizando o estágio mais avançado e, em empate, o contrato mais recente;
- apresenta totais de criados, atualizados, ignorados e erros por linha.

#### Lançamentos de indicadores

Importa resultados mensais em lote.

- colunas obrigatórias: competência, departamento, indicador e valor realizado;
- colunas opcionais: meta e observação;
- atualiza automaticamente combinações de indicador e competência já existentes;
- oferece modelo CSV preenchido com os indicadores ativos;
- valida competência no padrão `AAAA-MM`, departamento, indicador e valores numéricos;
- apresenta totais de inseridos, atualizados, ignorados e erros por linha.

#### Experiência de upload

- seleção por clique ou arrastar e soltar;
- arquivos CSV de até 10 MB;
- separador de referência `;`;
- mapeamento flexível de cabeçalhos, incluindo variações de acentuação;
- conferência visual de colunas obrigatórias e opcionais;
- importação liberada apenas após validação bem-sucedida.

---

## 6. Fluxos de negócio ponta a ponta

### 6.1 Captação e ativação de uma unidade

1. O administrador cadastra ou importa o empreendimento e o proprietário.
2. A unidade entra em Prospecção e recebe um responsável.
3. As datas de reunião, fechamento, integração e ativação são registradas conforme o avanço.
4. O pipeline atualiza a distribuição por etapa.
5. Ao atingir Ativo, a unidade passa a compor os indicadores de carteira, rankings e distribuições.
6. Se houver saída, a data de baixa é registrada e o crescimento líquido do mês é recalculado.

### 6.2 Gestão mensal de desempenho

1. O administrador configura KRIs, KPIs e metas padrão.
2. Cada departamento lança o realizado e, se necessário, ajusta a meta do período.
3. O sistema calcula o percentual de atingimento e classifica o resultado.
4. O dashboard departamental exibe os resultados e o histórico recente.
5. Administração e gestão comparam setores e competências pela Análise BI.

### 6.3 Gestão de atividades setoriais

1. Uma atividade é criada com setor, prioridade, responsável e prazo.
2. Os envolvidos recebem notificações conforme os eventos relevantes.
3. O responsável atualiza o status e registra o contexto por comentários.
4. Toda alteração fica disponível no histórico.
5. Atividades vencidas recebem destaque e podem ser filtradas pela gestão.
6. A tarefa avança até Concluído ou Cancelado.

### 6.4 Implantação ou atualização em massa

1. O administrador escolhe o tipo de importação.
2. Consulta as colunas esperadas ou baixa o modelo de indicadores.
3. Envia o CSV por clique ou arrastar e soltar.
4. O sistema valida o cabeçalho e informa inconsistências.
5. Após a confirmação, os dados são criados ou atualizados em lote.
6. Um resumo final informa o resultado e os problemas por linha.

---

## 7. Indicadores de referência

A base de demonstração contempla os seguintes exemplos, que podem ser administrados pela tela de Indicadores.

| Departamento | KRIs de referência | KPIs de referência |
|---|---|---|
| Marketing | Leads qualificados de proprietários; leads de hóspedes | Custo por lead; reuniões geradas; taxa de qualificação |
| Comercial | Crescimento líquido de unidades | Reuniões realizadas; conversão reunião → contrato; tempo médio de fechamento |
| Atendimento | Nota média nas OTAs | Tempo de resposta; resolução no primeiro contato; reclamações por reserva |
| Precificação | Receita média por unidade | Ocupação; diária média/ADR; ranking nas OTAs |
| Financeiro | EBITDA; resultado mensal consolidado/DRE | Receita média por unidade; previsibilidade de fluxo de caixa |

---

## 8. Dados, cálculos e regras principais

- **Competência:** período mensal no formato `AAAA-MM`.
- **Atingimento:** valor realizado dividido pela meta, em percentual.
- **Crescimento líquido:** unidades captadas menos unidades baixadas no mês.
- **Captação:** baseada na data de ativação da unidade.
- **Saída:** baseada na data de baixa da unidade.
- **Unicidade de lançamento:** um resultado por indicador e competência.
- **Unicidade operacional da unidade:** empreendimento e número são usados como identidade na importação.
- **Histórico de status:** registrado sempre que o estágio da unidade é alterado.
- **Indicador inativo:** deixa de participar dos fluxos ativos, mas preserva os dados históricos.

As unidades de medida exibidas nativamente incluem moeda em reais, percentual, nota, horas, dias e valores numéricos.

---

## 9. Segurança e governança

- autenticação por e-mail e senha;
- senhas armazenadas com hash;
- sessão autenticada por JWT;
- validação do usuário ativo a cada requisição protegida;
- autorização por perfil em recursos administrativos e de BI;
- redirecionamento automático quando a sessão expira;
- cabeçalhos de proteção HTTP;
- validação de tipo e tamanho de arquivo na importação;
- validação dos principais campos e estados aceitos;
- separação lógica de dados por departamento na experiência do usuário comum;
- registro do autor em lançamentos, mudanças de status, atividades e comentários.

---

## 10. Características técnicas e implantação

| Camada | Tecnologia atual |
|---|---|
| Interface | React 19 + Vite |
| API | Node.js + Express |
| Banco de dados | SQLite nativo do Node.js |
| Autenticação | JWT + bcrypt |
| Gráficos | Recharts |
| Exportação | jsPDF, AutoTable e CSV |
| Publicação prevista | Linux, NGINX e PM2 |

### Características operacionais

- interface responsiva com navegação móvel;
- tema claro e escuro;
- API REST separada da interface;
- paginação nas principais bases extensas;
- banco local de implantação simples;
- configuração de ambiente para portas, autenticação e intervalos de atualização.

---

## 11. Roteiro sugerido para demonstração comercial

### Abertura — 1 minuto

Apresente o problema: dados de carteira, captação, metas e execução normalmente ficam espalhados. Posicione o Métricas LikeHome como o ambiente que conecta operação e gestão.

### Visão executiva — 3 minutos

1. Abra o Dashboard Administrativo.
2. Mostre o tamanho e a composição do portfólio.
3. Destaque crescimento líquido, pipeline e alertas de KRI.
4. Clique em um número do portfólio por empreendimento para revelar as unidades que compõem o indicador.

### Inteligência de negócio — 3 minutos

1. Acesse a Análise BI.
2. Altere o período.
3. Compare captações e saídas.
4. Mostre o radar de KRIs e a evolução por departamento.
5. Reforce que os gráficos chegam até a base analítica detalhada.

### Operação — 3 minutos

1. Abra o Pipeline de Unidades.
2. Filtre um status e um empreendimento.
3. Mostre o cadastro completo de uma unidade e suas datas.
4. Na tela Unidades, demonstre a ordenação e a exportação seletiva em CSV/PDF.

### Gestão de equipes — 3 minutos

1. Abra Acompanhamento de Setores.
2. Filtre as atividades atrasadas.
3. Entre em um cartão para mostrar responsável, prazo, comentários e histórico.
4. Mostre a notificação que leva diretamente ao item.

### Gestão por metas — 2 minutos

1. Abra Lançamento de Indicadores.
2. Mostre a barra de completude do mês.
3. Registre um realizado e uma observação.
4. Volte ao dashboard para contextualizar como o dado alimenta a gestão.

### Encerramento — 1 minuto

Conclua com os três resultados centrais: **visibilidade do portfólio, disciplina de execução e gestão baseada em metas**.

---

## 12. Mensagens comerciais recomendadas

### Pitch curto

> O Métricas LikeHome reúne portfólio, pipeline, indicadores e atividades em uma única plataforma. A direção acompanha crescimento e metas; os setores registram resultados e executam planos; e a operação mantém cada unidade rastreável da prospecção à ativação.

### Diferenciais demonstráveis

- visão executiva conectada ao detalhe de cada unidade;
- combinação de gestão de carteira, indicadores e atividades;
- dashboards específicos para direção e departamentos;
- cálculo automático do crescimento líquido a partir de dados operacionais;
- importação de carteira e indicadores com validação prévia;
- exportação configurável em CSV e PDF;
- rastreabilidade por histórico, autor e notificações;
- experiência personalizada por perfil.

### Perguntas de descoberta comercial

- Como a empresa consolida hoje as informações de portfólio e captação?
- Quanto tempo é gasto mensalmente para produzir os relatórios de gestão?
- As metas departamentais possuem responsável, realizado e histórico acessíveis?
- É possível identificar rapidamente unidades paradas em cada etapa do funil?
- Como a direção acompanha tarefas atrasadas e dependências entre setores?
- A base atual consegue explicar de quais unidades cada número do dashboard é composto?

---

## 13. Escopo atual e pontos para evolução

Para evitar promessas comerciais fora do produto entregue, os itens abaixo **não aparecem implementados na versão analisada** e devem ser tratados como evolução ou integração adicional:

- recuperação de senha por e-mail e autenticação multifator;
- integração direta com OTAs, PMS, CRM, contabilidade ou bancos;
- envio de notificações por e-mail, WhatsApp ou push;
- editor de fórmulas personalizadas para indicadores;
- metas com polaridade inversa configurável — por exemplo, quando um valor menor representa melhor desempenho;
- anexos em atividades;
- exportação nativa dos dashboards e gráficos;
- trilha de auditoria abrangente para todos os cadastros;
- operação multiempresa/multitenant;
- aplicativo móvel nativo;
- banco relacional de servidor para alta concorrência e múltiplas instâncias.

Esses pontos não impedem o uso da solução no escopo atual, mas devem ser considerados em propostas que exijam integrações, compliance avançado ou grande escala de concorrência.

---

## 14. Glossário

- **KRI (Key Result Indicator):** indicador-chave de resultado, voltado ao efeito final alcançado.
- **KPI (Key Performance Indicator):** indicador-chave de desempenho, voltado ao desempenho de processos e ações.
- **Competência:** mês de referência do resultado.
- **Pipeline:** sequência de estágios percorridos pela unidade.
- **BPO:** responsabilidade atribuída ao processo operacional/administrativo cadastrado para a unidade.
- **ADR:** diária média praticada.
- **OTA:** canal on-line de distribuição e reserva.
- **DRE:** demonstração do resultado do exercício.
- **EBITDA:** resultado operacional antes de juros, impostos, depreciação e amortização.

---

## 15. Resumo para proposta

O Métricas LikeHome entrega uma camada central de gestão para operações de hospedagem e administração de imóveis. Sua cobertura funcional vai do cadastro granular de unidades à análise executiva, passando por pipeline, metas mensais, tarefas setoriais, alertas, importação e exportação. A separação por perfis permite que direção, gestão e departamentos trabalhem no mesmo ambiente com experiências adequadas às suas responsabilidades.

O resultado esperado é uma operação com menos dependência de planilhas, maior rastreabilidade, reuniões mais objetivas e capacidade de agir rapidamente sobre desvios de meta, gargalos do funil e tarefas atrasadas.
