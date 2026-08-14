const MENSAGENS_BASE = [
  "Pequenos avanços consistentes criam grandes resultados.",
  "Hoje é uma nova oportunidade para fazer acontecer.",
  "Clareza nos dados transforma decisões em resultados.",
  "O progresso começa com uma boa próxima decisão.",
  "Cada detalhe bem cuidado fortalece a operação.",
  "Foco no que importa e movimento no que depende de você.",
  "Grandes entregas nascem de rotinas bem executadas.",
  "Sua organização de hoje constrói o resultado de amanhã.",
  "Dados bem lidos abrem caminhos melhores.",
  "Consistência é a ponte entre meta e conquista.",
  "Uma decisão de cada vez, sempre na direção certa.",
  "O que é acompanhado pode ser aprimorado.",
  "Excelência é resultado de atenção contínua.",
  "Toda melhoria começa com a coragem de olhar de perto.",
  "Planeje com intenção, execute com presença.",
  "Um bom dia começa com prioridades claras.",
  "Transforme informação em ação.",
  "Resultados sustentáveis são construídos todos os dias.",
  "A operação forte é feita de escolhas simples e consistentes.",
  "Seu trabalho gera impacto real. Continue.",
  "Objetivos grandes pedem passos bem definidos.",
  "Disciplina diária supera motivação passageira.",
  "Onde há processo, há espaço para evolução.",
  "Comece pelo essencial e o restante ganha forma.",
  "Cada indicador é uma oportunidade de aprender e melhorar.",
  "A melhor estratégia é aquela que vira ação.",
  "Boas decisões ficam mais fáceis com uma visão clara.",
  "Faça do progresso o seu padrão.",
  "O ritmo certo é aquele que mantém a qualidade.",
  "Confie no processo e cuide dos detalhes.",
  "A evolução acontece quando intenção encontra execução.",
  "Seu foco de agora determina a qualidade da sua entrega.",
  "Pequenas melhorias somadas fazem uma operação extraordinária.",
  "Toda meta alcançada começou com um primeiro passo.",
  "Agir com clareza é uma forma de liderar.",
  "Organização libera tempo para o que realmente importa.",
  "Acompanhar é o primeiro passo para transformar.",
  "Mantenha o olhar no objetivo e os pés na rotina.",
  "Hoje você pode tornar o processo um pouco melhor.",
  "A excelência mora na repetição do que funciona.",
  "Bom trabalho é aquele que deixa o próximo passo mais simples.",
  "Prioridades bem definidas reduzem ruído e aumentam impacto.",
  "Resultados não acontecem por acaso: eles são construídos.",
  "Toda entrega de qualidade fortalece a confiança.",
  "Faça o importante antes do urgente.",
  "Evoluir é ajustar, aprender e seguir em frente.",
  "A melhor hora para melhorar um processo é agora.",
  "Cuide do presente para alcançar o próximo nível.",
  "O seu olhar atento transforma a experiência de cada cliente.",
  "Simplicidade bem executada é uma grande vantagem.",
  "Métrica boa é a que inspira uma ação melhor.",
  "Crescer com consistência é crescer com segurança.",
  "Trabalho em equipe transforma desafios em possibilidades.",
  "Uma rotina bem alinhada cria espaço para inovar.",
  "Progresso diário é uma vitória silenciosa e poderosa.",
  "A qualidade da jornada aparece nos detalhes.",
  "Faça com propósito, acompanhe com atenção, evolua sempre.",
  "A sua próxima boa decisão pode começar agora.",
  "Visão, foco e ação: uma combinação poderosa.",
  "Entenda o cenário antes de escolher o próximo passo.",
  "Uma agenda consciente protege o que é prioritário.",
  "Melhorar um por cento por dia muda toda a trajetória.",
  "A confiança cresce quando a entrega é consistente.",
  "Quem mede com atenção encontra oportunidades melhores.",
  "O resultado de excelência começa em uma rotina simples.",
  "Decisões calmas e bem informadas criam bons caminhos.",
  "Cada conversa bem conduzida fortalece a equipe.",
  "Seu comprometimento faz a estratégia sair do papel.",
  "O próximo passo bem feito vale mais que o plano perfeito.",
  "Resolva o que está ao alcance e avance com confiança.",
  "Liderar também é dar clareza ao trabalho de todos.",
  "O cuidado com o processo é parte do cuidado com o resultado.",
  "Uma operação alinhada transforma esforço em valor percebido.",
];

const COMPLEMENTOS = [
  " Continue com foco.",
  " Faça deste momento uma boa entrega.",
  " Um passo de cada vez já é progresso.",
  " Sua constância faz a diferença.",
  " Leve essa intenção para o restante do dia.",
];

// 73 mensagens-base x 5 complementos = 365 mensagens para variar ao longo do ano.
const FRASES = MENSAGENS_BASE.flatMap((mensagem) => COMPLEMENTOS.map((complemento) => `${mensagem}${complemento}`));

const CHAVE_SESSAO = "lh-frase-motivacional";

export function sortearFraseMotivacional() {
  const indice = Math.floor(Math.random() * FRASES.length);
  const frase = {
    texto: MENSAGENS_BASE[Math.floor(indice / COMPLEMENTOS.length)],
    complemento: COMPLEMENTOS[indice % COMPLEMENTOS.length].trim(),
  };
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(frase));
  return frase;
}

export function obterFraseMotivacional() {
  const fraseSalva = sessionStorage.getItem(CHAVE_SESSAO);
  if (!fraseSalva) return sortearFraseMotivacional();
  try {
    const frase = JSON.parse(fraseSalva);
    return frase?.texto && frase?.complemento ? frase : sortearFraseMotivacional();
  } catch {
    return sortearFraseMotivacional();
  }
}
