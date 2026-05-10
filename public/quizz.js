// ============================================
// ESTADO GLOBAL DO QUIZZ
// ============================================
const state = {
  currentScreen: 1,
  answers: {},
  startedAt: null
};

const TOTAL_SCREENS = 14;

// WhatsApp do Jackson / RK Pulse Digital — +1 (941) 870-5458
const WHATSAPP_NUMERO = '19418705458';

// URL do Web App do Google Apps Script (cola aqui depois do deploy do script).
// Veja scripts/google-apps-script.gs pro passo a passo. Se ficar vazio, o
// envio pra planilha simplesmente não acontece (não quebra nada).
const SHEETS_WEBHOOK_URL = '';

// ============================================
// PERFIS DE DIAGNÓSTICO
// Cada perfil é um espelho de uma fase da jornada do Jackson —
// o lead se reconhece, e a CTA pra call vira lógica
// ============================================
const PERFIS = {
  'quase-voltando': {
    nome: 'O Quase Voltando pro Brasil',
    descricao: 'Você tá no exato ponto em que eu estava em 2020 — o caixa minguando, gastando mais do que entra, e a cabeça começando a calcular se vale mais a pena fazer as malas. Eu te entendo na pele. A diferença é que eu tive que descobrir o protocolo sozinho, queimando US$20 mil no processo. Pra você, esse caminho não precisa ser igual: o que vai te tirar daí não é trabalhar mais — é montar a estrutura mínima certa (site sério + presença no Google + atendimento que cria valor antes do preço). É exatamente esse tipo de operação que mais responde rápido ao protocolo.',
    testemunho: '"Tava prestes a desistir e voltar. Em uma semana com o método do Jackson fechei quase US$10 mil em projetos." — Claudio Silva'
  },
  'sobrevivente-agencia': {
    nome: 'O Sobrevivente da Agência Americana',
    descricao: 'Você já passou pelo que eu passei: contratou agência americana caro, viu relatório bonito chegar todo mês, e o caixa não mexeu. Não é coincidência — 90% delas vendem entrega de tarefa (subiu campanha, ranqueou palavra), não venda. E pior: pra brasileiro service business, elas geralmente não entendem o jogo do home owner do nosso nicho. Antes de te oferecer qualquer coisa, eu vou te mostrar o que tava furado na sua estrutura. Se eu não enxergar oportunidade clara, eu te falo na call e te poupo o investimento.',
    testemunho: '"Já tinha contratado 2 agências antes. Em menos de 1 semana aplicando o método do Jackson fechei 14 casas regulares no primeiro mês." — Grazy Melo, Melo General Services'
  },
  'refem-indicacao': {
    nome: 'O Refém da Indicação',
    descricao: 'Sua companhia funciona — funciona bem. Mas funciona <em>quando</em> alguém te indica. Sem indicação, o telefone fica mudo. Esse é o ponto exato em que dá pra crescer 3x sem mexer em mais nada da operação: só plugando uma máquina simples de geração de demanda em cima do que você já entrega bem. SEO local + Google ranqueando seu nome + um funil mínimo pra capturar o home owner buscando seu serviço agora. O boca-a-boca não para — só para de ser o único.',
    testemunho: '"Eu vivia de indicação. Hoje fecho 2 trabalhos por semana de gente que nunca me viu antes." — Peixoto, Partners Pavers'
  },
  'sem-time-vendas': {
    nome: 'O Operador Sem Time de Vendas',
    descricao: 'Você gera lead. O telefone toca, o WhatsApp chega. Mas na hora de passar o estimate, fechar o trabalho, criar valor antes do preço — você perde. Seja porque o inglês trava, seja porque você tá no job suado e não tem tempo, seja porque ninguém te ensinou a vender. Esse é o gargalo mais comum no service business de brasileiro nos EUA, e é um dos pontos que o protocolo ataca direto: estrutura de atendimento que já chega com valor montado, com profissional que sabe falar inglês e gera o "yes" no telefone.',
    testemunho: '"Eu tava passando estimate certo, mas não fechava. Quando o time de vendas do Jackson entrou, fechei US$30k num projeto só de pavers." — Sebastião'
  },
  'cartao-panfleto': {
    nome: 'O Cartão e Panfleto',
    descricao: 'Você ainda tá fazendo o que <em>eu</em> fazia em 2018: cartão de visita, panfleto no bairro, talvez um Google Ads no chute. Funciona — mas é o ponto onde o crescimento trava. Você não vai pra US$30k, US$60k/mês com cartão. Não porque o cartão é ruim, mas porque ele não escala. O passo que vai te destravar é o feijão com arroz digital bem feito: site institucional simples, SEO local pra ranquear no Google, e ads cirúrgico pegando o home owner no momento que ele tá pesquisando seu serviço. Isso, sim, escala.',
    testemunho: '"Larguei o panfleto e em 90 dias triplicquei o número de estimates. O cartão virou complemento, não fonte." — Carlos, Painting'
  },
  'pronto-escalar': {
    nome: 'O Pronto pra Escalar',
    descricao: 'Você já validou. A companhia funciona, gera caixa, tem operação rodando. Agora a pergunta não é mais "se vende" — é como sair de 1-2 equipes pra 4-5, como sair de US$15-30k/mês pra US$60-100k/mês <em>sem</em> entrar em pânico operacional. Meu protocolo foi desenhado exatamente pra essa transição: previsibilidade de demanda no topo, time de vendas que feche sem você, e estrutura que aguenta o volume novo. É a fase onde a gente faz o estrago.',
    testemunho: '"Saí de US$15k pra US$78k em 6 meses. 7-8 projetos, 2 equipes, e ainda passei a dormir tranquilo." — Jackson, sobre a própria Jackson\'s Painting Florida em 2022'
  }
};

// ============================================
// MENSAGENS ROTATIVAS NA TELA DE LOADING
// ============================================
const LOADING_MESSAGES = [
  'Cruzando suas respostas com mais de 60 companhias de brasileiros nos EUA já analisadas...',
  '"Em uma semana fechei quase US$10 mil em projetos." — Claudio Silva',
  'Identificando o gargalo principal da sua operação...',
  '"14 casas regulares fechadas no 1º mês com o método." — Grazy, Melo General Services',
  'Jackson construiu, escalou e vendeu a Jackson\'s Painting Florida — agora aplica o mesmo protocolo em parceiros',
  '"Projeto de quase US$30k fechado com o time de vendas do Jackson." — Peixoto, Partners Pavers',
  'Montando seu diagnóstico personalizado...'
];

// ============================================
// INICIA O QUIZZ (chamado pelo botão da Tela 01)
// ============================================
function startQuizz() {
  state.startedAt = Date.now();
  state.currentScreen = 2;
  showScreen(2);
  trackEvent('QuizStarted', {});
}

function nextScreen() {
  if (state.currentScreen >= TOTAL_SCREENS) return;
  showScreen(state.currentScreen + 1);
}

// ============================================
// MOSTRA UMA TELA E ATUALIZA PROGRESSO
// ============================================
function showScreen(num) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));

  const target = document.getElementById(`screen-${String(num).padStart(2, '0')}`);
  if (!target) return;
  target.classList.remove('hidden');

  const progress = ((num - 1) / (TOTAL_SCREENS - 1)) * 100;
  document.getElementById('progress-bar').style.width = `${progress}%`;
  state.currentScreen = num;

  if (num === 8) {
    trackEvent('QuizMidway', {});
  }

  if (num === 13) {
    iniciarLoadingRotator();
    setTimeout(() => showScreen(14), 4500);
  }

  if (num === 14) {
    const perfil = calcularPerfil(state.answers);
    renderizarDiagnostico(perfil);
    montarLinkWhatsApp(perfil);
    trackEvent('QuizCompleted', { perfil });
    enviarParaSheet('completed');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// LISTENER GLOBAL DE CLIQUES NAS OPÇÕES
// ============================================
document.addEventListener('click', (e) => {
  if (!e.target.matches('.option-btn')) return;

  const screen = e.target.closest('.screen');
  const container = screen.querySelector('[data-question]');
  if (!container) return;

  const question = container.dataset.question;
  const type = container.dataset.type;
  const value = e.target.dataset.value;

  if (type === 'single') {
    state.answers[question] = value;

    container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    e.target.classList.add('selected');

    // CASO ESPECIAL 1: faturamento muito baixo desvia pra waitlist
    if (question === 'faturamento' && value === 'ate-5k') {
      setTimeout(() => mostrarWaitlist('faturamento'), 350);
      return;
    }

    // CASO ESPECIAL 2: comprometimento "não cabe" desvia pra waitlist
    if (question === 'comprometimento' && value === 'nao-cabe') {
      setTimeout(() => mostrarWaitlist('comprometimento'), 350);
      return;
    }

    setTimeout(() => showScreen(state.currentScreen + 1), 350);
  }

  if (type === 'multi') {
    e.target.classList.toggle('selected');
    state.answers[question] = state.answers[question] || [];

    if (e.target.classList.contains('selected')) {
      if (!state.answers[question].includes(value)) {
        state.answers[question].push(value);
      }
    } else {
      state.answers[question] = state.answers[question].filter(v => v !== value);
    }
  }
});

// ============================================
// CASCATA DE DECISÃO DO PERFIL
// (primeira regra que casa, retorna)
// ============================================
function calcularPerfil(a) {
  const dores = a.dores || [];

  // Regra 1: Quase Voltando pro Brasil — sinais de aperto financeiro forte
  // (faturamento baixo+médio + dores graves + nunca tentou marketing OU já se queimou)
  if (
    (a.faturamento === '5k-15k' || a.faturamento === '15k-30k') &&
    (dores.includes('gasto-sem-retorno') || dores.includes('sem-previsibilidade')) &&
    (a.investimento === 'nada' || a.investimento === 'ate-500')
  ) {
    return 'quase-voltando';
  }

  // Regra 2: Sobrevivente da Agência — marca decepção com agência
  if (a.historico === 'multiplas-decepcoes' || a.historico === 'atual-insatisfeito' ||
      dores.includes('agencia-decepcao')) {
    return 'sobrevivente-agencia';
  }

  // Regra 3: Refém da Indicação — depende só de boca-a-boca
  if (a.investimento === 'nada' &&
      (dores.includes('so-indicacao') || a.gargalo === 'parar-indicacao')) {
    return 'refem-indicacao';
  }

  // Regra 4: Sem Time de Vendas — gera lead mas perde no fechamento / inglês
  if (dores.includes('ingles-estimate') || dores.includes('sem-vendas') ||
      a.gargalo === 'time-vendas') {
    return 'sem-time-vendas';
  }

  // Regra 5: Cartão e Panfleto — investimento simbólico/inexistente, sem digital
  if ((a.investimento === 'nada' || a.investimento === 'ate-500') &&
      (dores.includes('sem-google') || dores.includes('sem-site'))) {
    return 'cartao-panfleto';
  }

  // Default: Pronto pra Escalar — operação validada, quer crescer
  return 'pronto-escalar';
}

// ============================================
// RENDERIZA DIAGNÓSTICO NA TELA 14
// ============================================
function renderizarDiagnostico(perfil) {
  const p = PERFIS[perfil];
  if (!p) return;

  document.getElementById('perfil-nome').textContent = p.nome;
  // permite <em> e <strong> dentro da descrição
  document.getElementById('perfil-descricao').innerHTML = p.descricao;
  document.getElementById('perfil-testemunho').innerHTML = p.testemunho;
}

// ============================================
// MONTA LINK DO WHATSAPP COM MENSAGEM PRÉ-PREENCHIDA
// ============================================
function montarLinkWhatsApp(perfil) {
  const a = state.answers;
  const p = PERFIS[perfil];

  const SERVICO_TXT = {
    'painting': 'Painting',
    'cleaning': 'Cleaning',
    'pavers': 'Pavers',
    'roofing': 'Roofing',
    'construction': 'Construction / Remodeling',
    'landscaping': 'Landscaping',
    'hvac': 'HVAC',
    'plumbing-electric': 'Plumbing / Electrical',
    'flooring': 'Flooring',
    'pressure-washing': 'Pressure Washing',
    'auto-detailing': 'Auto Detailing',
    'moving': 'Moving / Junk Removal',
    'outro': 'outro service business'
  };

  const FATURAMENTO_TXT = {
    'ate-5k': 'até US$5k/mês',
    '5k-15k': 'US$5k a US$15k/mês',
    '15k-30k': 'US$15k a US$30k/mês',
    '30k-60k': 'US$30k a US$60k/mês',
    '60k+': 'acima de US$60k/mês',
    'prefiro-nao': 'prefiro discutir na call'
  };

  const INVESTIMENTO_TXT = {
    'nada': 'não invisto em marketing',
    'ate-500': 'até US$500/mês',
    '500-2k': 'US$500 a US$2k/mês',
    '2k-5k': 'US$2k a US$5k/mês',
    '5k+': 'acima de US$5k/mês'
  };

  const GARGALO_TXT = {
    'mais-leads': 'encher o telefone de pedidos qualificados',
    'ranquear-google': 'aparecer no topo do Google da minha região',
    'time-vendas': 'ter um time de vendas que feche por mim',
    'parar-indicacao': 'parar de depender só de indicação',
    'cobrar-mais': 'conseguir cobrar mais sem perder cliente',
    'previsibilidade': 'ter previsibilidade de faturamento',
    'escalar-equipes': 'escalar de 1-2 pra 4-5 equipes'
  };

  const COMPROMETIMENTO_TXT = {
    'cabe': 'o investimento de US$800+ cabe e quero entender o próximo passo',
    'cabe-se-roi': 'topo, mas quero entender o ROI projetado primeiro',
    'alto-pensar': 'o valor é alto pro meu momento, queria entender melhor',
    'nao-cabe': 'o investimento não cabe agora'
  };

  const mensagem =
    `Oi Jackson! Acabei de fazer a análise.\n\n` +
    `*Meu perfil:* ${p.nome}\n` +
    `*Serviço:* ${SERVICO_TXT[a.servico] || a.servico}\n` +
    `*Faturamento:* ${FATURAMENTO_TXT[a.faturamento] || a.faturamento}\n` +
    `*Marketing hoje:* ${INVESTIMENTO_TXT[a.investimento] || a.investimento}\n` +
    `*Maior gargalo:* ${GARGALO_TXT[a.gargalo] || a.gargalo}\n` +
    `*Investimento:* ${COMPROMETIMENTO_TXT[a.comprometimento] || a.comprometimento}\n\n` +
    `Quero agendar a call de análise estratégica.`;

  const link = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  document.getElementById('whatsapp-btn').href = link;
}

// ============================================
// DISPARA EVENTO LEAD AO CLICAR NO WHATSAPP
// ============================================
function trackLead(event) {
  const perfil = calcularPerfil(state.answers);

  trackEvent('Lead', {
    perfil: perfil,
    perfil_nome: PERFIS[perfil].nome,
    servico: state.answers.servico,
    faturamento: state.answers.faturamento,
    gargalo: state.answers.gargalo,
    comprometimento: state.answers.comprometimento,
    value: 800,
    currency: 'USD'
  });
}

// ============================================
// MOSTRA TELA DE WAITLIST (faturamento baixo OU não cabe $800)
// ============================================
function mostrarWaitlist(motivo) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById('screen-waitlist').classList.remove('hidden');
  document.getElementById('progress-bar').style.width = '100%';

  trackEvent('WaitlistJoined', {
    motivo: motivo,
    servico: state.answers.servico,
    faturamento: state.answers.faturamento
  });

  enviarParaSheet('waitlist');
}

// ============================================
// ENVIA LEAD PRA GOOGLE SHEET (via Apps Script Web App)
// ============================================
function enviarParaSheet(status) {
  if (!SHEETS_WEBHOOK_URL) return; // nada configurado, ignora silenciosamente

  // Calcula perfil só pra completed (na waitlist o lead nem chegou no fim)
  const perfil = status === 'completed' ? calcularPerfil(state.answers) : '';

  const payload = {
    status,
    perfil,
    servico: state.answers.servico || '',
    faturamento: state.answers.faturamento || '',
    investimento: state.answers.investimento || '',
    dores: state.answers.dores || [],
    historico: state.answers.historico || '',
    gargalo: state.answers.gargalo || '',
    decisor: state.answers.decisor || '',
    comprometimento: state.answers.comprometimento || '',
    janela: state.answers.janela || '',
    referrer: document.referrer || '',
    userAgent: navigator.userAgent || ''
  };

  // Content-Type text/plain evita preflight CORS no Apps Script
  fetch(SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(err => console.warn('Sheet webhook falhou:', err));
}

// ============================================
// ROTACIONA MENSAGENS NA TELA DE LOADING
// ============================================
function iniciarLoadingRotator() {
  const rotator = document.getElementById('loading-rotator').querySelector('p');
  let index = 0;

  const interval = setInterval(() => {
    rotator.style.opacity = '0';
    setTimeout(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      rotator.textContent = LOADING_MESSAGES[index];
      rotator.style.opacity = '1';
    }, 400);
  }, 1200);

  setTimeout(() => clearInterval(interval), 5000);
}
