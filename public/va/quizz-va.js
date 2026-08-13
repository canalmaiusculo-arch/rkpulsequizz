// ============================================================
// RK PULSE DIGITAL — QUIZZ DE RECRUTAMENTO · VIRTUAL ASSISTANT
// Motor próprio (suporta single, multi, text e textarea,
// múltiplas perguntas por tela, knockout e pontuação).
// ============================================================

const state = {
  currentScreen: 1,
  answers: {},
  startedAt: null,
  enviado: false
};

const TOTAL_SCREENS = 23;   // 22 = loading · 23 = resultado
const SCREEN_LOADING = 22;
const SCREEN_RESULTADO = 23;

// ⚠️ WhatsApp do RH em Uberlândia (só números, com DDI+DDD). Ex.: 5534991234567
// Enquanto ficar VAZIO, a tela de resultado não mostra o botão nem a tarefa do
// áudio — o candidato só vê a mensagem de que o RH vai entrar em contato.
// Basta preencher aqui pra reativar o CTA (nada mais precisa mudar).
const WHATSAPP_RH = '';

// Webhook que recebe as candidaturas. Hoje: Zapier (Catch Hook).
// Também funciona com o Web App do Apps Script em
// scripts/google-apps-script-va.gs. Vazio = não envia (não quebra nada).
//
// O envio é feito como application/x-www-form-urlencoded de propósito:
// o hook do Zapier não devolve `access-control-allow-headers`, então
// application/json seria barrado no preflight do navegador. Form-encoded
// é "simple request" (sem preflight) e o Zapier parseia em campos nomeados.
const WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/25269393/46vwyd7/';

// ============================================================
// MENSAGENS DA TELA DE LOADING
// ============================================================
const LOADING_MESSAGES = [
  'Conferindo disponibilidade e localização...',
  'Avaliando as respostas do English check...',
  'Lendo suas respostas escritas em inglês...',
  'Comparando com o perfil dos VAs que mais fecham agendamento...',
  'Montando o resultado da sua candidatura...'
];

// ============================================================
// MOTIVOS DE ELIMINAÇÃO (knockout)
// ============================================================
const KNOCKOUTS = {
  moradia: 'Essa vaga é <strong class="text-white">100% presencial</strong>, na nossa sede em Uberlândia/MG — o time atende junto, na mesma sala. Como você não mora nem pretende se mudar pra cá, não dá pra seguir agora.',
  presencial: 'Essa vaga é <strong class="text-white">presencial</strong>. O time inteiro atende junto na sede, em Uberlândia, porque é assim que a gente treina e corrige o atendimento em tempo real. Não temos formato remoto pra essa função.',
  noturno: 'O turno é <strong class="text-white">das 18h às 22h, de segunda a sexta</strong> — é o horário em que o cliente americano atende o telefone. Sem essa janela, infelizmente a função não funciona.',
  ingles: 'Essa vaga exige <strong class="text-white">inglês fluente de conversação</strong>, ao telefone, com nativo. Não é uma vaga de quem está aprendendo — é uma vaga de quem já conversa.'
};

// ============================================================
// RESULTADOS (para quem passou nos requisitos)
// ============================================================
const RESULTADOS = {
  A: {
    badge: 'Perfil aprovado nesta etapa',
    titulo: 'Seu perfil bateu com o que a gente procura.',
    texto: 'Você mora na cidade certa, tem a disponibilidade certa e o seu inglês, pelo que você respondeu aqui, está no nível que a operação exige. Agora falta a parte que nenhum formulário resolve: <strong class="text-white">a gente precisa ouvir você falando</strong>.',
    mostrarProximos: true,
    rodape: 'Se o áudio confirmar o que vimos aqui, o RH te chama para uma entrevista por telefone — em inglês.'
  },
  B: {
    badge: 'Candidatura em análise',
    titulo: 'Sua candidatura está de pé — e vai pra análise humana.',
    texto: 'Você atende os requisitos principais da vaga. Alguns pontos das suas respostas a gente prefere avaliar com calma e com uma pessoa lendo, não com um formulário decidindo. <strong class="text-white">O que mais pesa a partir daqui é o seu inglês falado</strong> — e é isso que a gente quer ouvir agora.',
    mostrarProximos: true,
    rodape: 'Retornamos em até 5 dias úteis. Enviar o áudio acelera bastante a sua análise.'
  },
  C: {
    badge: 'Candidatura registrada',
    titulo: 'Recebemos sua candidatura.',
    texto: 'Você cumpre os requisitos de localização e horário, mas o conjunto das suas respostas — principalmente na parte de inglês e de experiência com atendimento — ficou abaixo do que essa vaga específica exige hoje. Vamos guardar seu cadastro no nosso <strong class="text-white">banco de talentos</strong> e chamar quando abrir uma posição mais aderente ao seu momento.',
    mostrarProximos: false,
    rodape: 'Obrigado pelo tempo que você dedicou a esse formulário. A gente lê todas as candidaturas.'
  }
};

// ============================================================
// INÍCIO E NAVEGAÇÃO
// ============================================================
function startQuizz() {
  state.startedAt = Date.now();
  showScreen(2);
}

function avancar() {
  const screen = document.getElementById(idDaTela(state.currentScreen));
  if (screen && !validarTela(screen)) return;
  if (state.currentScreen >= TOTAL_SCREENS) return;
  showScreen(state.currentScreen + 1);
}

function idDaTela(num) {
  return `screen-${String(num).padStart(2, '0')}`;
}

function showScreen(num) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));

  const target = document.getElementById(idDaTela(num));
  if (!target) return;
  target.classList.remove('hidden');

  const progress = ((num - 1) / (TOTAL_SCREENS - 1)) * 100;
  document.getElementById('progress-bar').style.width = `${progress}%`;
  document.getElementById('step-label').textContent = num > 1 ? `${num - 1} de ${TOTAL_SCREENS - 1}` : '';
  state.currentScreen = num;

  if (num === SCREEN_LOADING) {
    iniciarLoadingRotator();
    setTimeout(() => showScreen(SCREEN_RESULTADO), 4200);
  }

  if (num === SCREEN_RESULTADO) {
    const tier = classificar();
    renderizarResultado(tier);
    enviarParaSheet('completo', tier);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// CLIQUE NAS OPÇÕES (single / multi)
// ============================================================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;

  const grupo = btn.closest('[data-question]');
  if (!grupo) return;

  const pergunta = grupo.dataset.question;
  const tipo = grupo.dataset.type;
  const valor = btn.dataset.value;

  if (tipo === 'single') {
    state.answers[pergunta] = valor;
    grupo.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    limparErro(grupo);

    const motivo = checarKnockout(pergunta, valor);
    if (motivo) {
      setTimeout(() => mostrarBanco(motivo), 380);
      return;
    }

    const tela = btn.closest('.screen');
    if (tela && tela.dataset.auto === 'true') {
      setTimeout(() => avancar(), 380);
    }
  }

  if (tipo === 'multi') {
    const exclusivo = btn.dataset.exclusive === 'true';
    const lista = state.answers[pergunta] || [];

    if (exclusivo) {
      // "Nenhuma dessas" limpa o resto
      grupo.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.answers[pergunta] = [valor];
    } else {
      // marcar qualquer outra desmarca a exclusiva
      const exBtn = grupo.querySelector('.option-btn[data-exclusive="true"]');
      if (exBtn) exBtn.classList.remove('selected');

      btn.classList.toggle('selected');
      const semExclusiva = lista.filter(v => !exBtn || v !== exBtn.dataset.value);

      state.answers[pergunta] = btn.classList.contains('selected')
        ? [...new Set([...semExclusiva, valor])]
        : semExclusiva.filter(v => v !== valor);
    }

    limparErro(grupo);
  }
});

// ============================================================
// DIGITAÇÃO EM TEXT / TEXTAREA
// ============================================================
document.addEventListener('input', (e) => {
  const campo = e.target.closest('[data-question]');
  if (!campo) return;
  if (!['text', 'textarea'].includes(campo.dataset.type)) return;

  // Telefone ganha máscara enquanto digita — reduz cadastro torto
  if (campo.dataset.format === 'phone') {
    const noFim = e.target.selectionStart === e.target.value.length;
    e.target.value = mascararTelefone(e.target.value);
    if (noFim) {
      const fim = e.target.value.length;
      try { e.target.setSelectionRange(fim, fim); } catch (err) { /* input type=tel */ }
    }
  }

  state.answers[campo.dataset.question] = e.target.value.trim();
  atualizarContador(campo);
  limparErro(campo);
});

// (34) 99911-2233 — aceita fixo (10 dígitos) e celular (11)
function mascararTelefone(valor) {
  const d = String(valor).replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Normaliza pro formato internacional (55DDDNÚMERO), que é o que
 * automação de WhatsApp e discador precisam. Retorna '' se não der.
 */
function telefoneE164(valor) {
  let d = String(valor || '').replace(/\D/g, '');

  if (d.startsWith('0')) d = d.replace(/^0+/, '');          // 0 do DDD interurbano
  if (d.length === 10 || d.length === 11) d = '55' + d;      // DDD + número
  if (d.length === 12 || d.length === 13) {
    return d.startsWith('55') ? d : '';
  }
  return '';
}

function atualizarContador(campo) {
  const contador = campo.querySelector('.char-counter');
  if (!contador) return;

  const min = parseInt(campo.dataset.min || '0', 10);
  const len = (state.answers[campo.dataset.question] || '').length;

  if (!min) {
    contador.textContent = `${len} caracteres`;
    return;
  }

  contador.textContent = len >= min ? `${len} caracteres ✓` : `${len} / ${min} caracteres mínimos`;
  contador.classList.toggle('ok', len >= min);
}

// ============================================================
// VALIDAÇÃO DE TELA
// ============================================================
function validarTela(tela) {
  const grupos = tela.querySelectorAll('[data-question]');
  let primeiroInvalido = null;

  grupos.forEach(grupo => {
    const obrigatorio = grupo.hasAttribute('data-required');
    const tipo = grupo.dataset.type;
    const valor = state.answers[grupo.dataset.question];
    let erro = null;

    if (tipo === 'single' && obrigatorio && !valor) {
      erro = 'Selecione uma opção para continuar.';
    }

    if (tipo === 'multi' && obrigatorio && (!valor || valor.length === 0)) {
      erro = 'Marque pelo menos uma opção.';
    }

    if (tipo === 'text' || tipo === 'textarea') {
      const texto = valor || '';
      const min = parseInt(grupo.dataset.min || '0', 10);
      const formato = grupo.dataset.format;

      if (obrigatorio && !texto) {
        erro = 'Esse campo é obrigatório.';
      } else if (texto && min && texto.length < min) {
        erro = `Escreva um pouco mais — faltam ${min - texto.length} caracteres.`;
      } else if (texto && formato === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto)) {
        erro = 'Digite um e-mail válido.';
      } else if (texto && formato === 'phone' && !telefoneE164(texto)) {
        erro = 'Digite o WhatsApp com DDD — ex.: (34) 99911-2233.';
      }
    }

    if (erro) {
      mostrarErro(grupo, erro);
      if (!primeiroInvalido) primeiroInvalido = grupo;
    } else {
      limparErro(grupo);
    }
  });

  if (primeiroInvalido) {
    primeiroInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = primeiroInvalido.querySelector('input, textarea');
    if (input) input.focus({ preventScroll: true });
    return false;
  }

  return true;
}

function mostrarErro(grupo, mensagem) {
  grupo.classList.add('invalid');
  const alvo = grupo.querySelector('.field-error');
  if (alvo) {
    alvo.textContent = mensagem;
    alvo.classList.remove('hidden');
  }
}

function limparErro(grupo) {
  grupo.classList.remove('invalid');
  const alvo = grupo.querySelector('.field-error');
  if (alvo) alvo.classList.add('hidden');
}

// ============================================================
// KNOCKOUT — requisitos inegociáveis da vaga
// ============================================================
function checarKnockout(pergunta, valor) {
  if (pergunta === 'moradia' && valor === 'outra-cidade') return 'moradia';
  if (pergunta === 'presencial' && valor === 'so-remoto') return 'presencial';
  if (pergunta === 'noturno' && valor === 'nao') return 'noturno';
  if (pergunta === 'ingles_nivel' && valor === 'basico') return 'ingles';
  return null;
}

function mostrarBanco(motivo) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById('screen-banco').classList.remove('hidden');
  document.getElementById('progress-bar').style.width = '100%';
  document.getElementById('banco-motivo').innerHTML = KNOCKOUTS[motivo] || '';
  document.getElementById('step-label').textContent = '';

  enviarParaSheet('desqualificado', '-', motivo);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// PONTUAÇÃO E CLASSIFICAÇÃO
// Máx. teórico 100. A > = 70 · B >= 50 · C < 50
// ============================================================
const PONTOS = {
  ingles_nivel:  { fluente: 25, avancado: 17, intermediario: 7 },
  experiencia:   { 'vendas-ingles': 20, 'vendas-telefone': 14, atendimento: 10, 'outro-comercial': 6, nenhuma: 0 },
  fimdesemana:   { 'sab-dom': 10, sabado: 7, eventual: 4, nao: 0 },
  moradia:       { uberlandia: 10, regiao: 6, mudando: 3 },
  noturno:       { total: 5, 'total-ajuste': 4, parcial: 0 },
  pretensao:     { 'ate-1500': 5, '1500-2000': 7, '2000-2500': 7, '2500-3000': 5, '3000-4000': 2, '4000+': 0 },
  inicio:        { imediato: 5, '15-dias': 4, '30-dias': 2, 'mais-30': 0 }
};

function calcularPontuacao() {
  const a = state.answers;
  let total = 0;

  Object.keys(PONTOS).forEach(chave => {
    total += PONTOS[chave][a[chave]] || 0;
  });

  total += acertosIngles() * 7;   // 4 questões × 7 = 28

  return Math.min(100, total);
}

// Lê o gabarito direto do HTML (data-correct="true")
function acertosIngles() {
  let acertos = 0;

  ['en_q1', 'en_q2', 'en_q3', 'en_q4'].forEach(q => {
    const grupo = document.querySelector(`[data-question="${q}"]`);
    if (!grupo) return;
    const certo = grupo.querySelector('.option-btn[data-correct="true"]');
    if (certo && state.answers[q] === certo.dataset.value) acertos++;
  });

  return acertos;
}

function classificar() {
  const pontos = calcularPontuacao();
  const acertos = acertosIngles();

  // Trava de segurança: inglês fraco não sobe pro topo por causa de outros pontos
  if (state.answers.ingles_nivel === 'intermediario' || acertos <= 1) {
    return pontos >= 55 ? 'B' : 'C';
  }

  if (pontos >= 70) return 'A';
  if (pontos >= 50) return 'B';
  return 'C';
}

// ============================================================
// RENDERIZA O RESULTADO
// ============================================================
function renderizarResultado(tier) {
  const r = RESULTADOS[tier];
  if (!r) return;

  document.getElementById('resultado-badge').textContent = r.badge;
  document.getElementById('resultado-titulo').textContent = r.titulo;
  document.getElementById('resultado-texto').innerHTML = r.texto;
  document.getElementById('resultado-rodape').textContent = r.rodape;

  const badge = document.getElementById('resultado-badge');
  badge.className = 'badge mb-4 inline-block ' +
    (tier === 'A' ? 'badge-green' : tier === 'B' ? 'badge-teal' : 'badge-amber');

  const proximos = document.getElementById('resultado-proximos');
  const btn = document.getElementById('whatsapp-btn');
  const temWhatsApp = Boolean(WHATSAPP_RH && WHATSAPP_RH.trim());

  if (r.mostrarProximos && temWhatsApp) {
    proximos.classList.remove('hidden');
    btn.href = montarLinkWhatsApp();
    btn.classList.remove('hidden');
  } else {
    proximos.classList.add('hidden');
    btn.classList.add('hidden');

    // Sem WhatsApp configurado, o áudio é pedido depois — o rodapé assume o recado
    if (r.mostrarProximos) {
      document.getElementById('resultado-rodape').textContent =
        'Nosso RH vai entrar em contato pelo WhatsApp que você cadastrou, em até 5 dias úteis. ' +
        'O próximo passo será um áudio curto em inglês — já vai se acostumando com a ideia.';
    }
  }
}

// ============================================================
// LINK DO WHATSAPP COM A CANDIDATURA PRÉ-PREENCHIDA
// ============================================================
const TXT = {
  moradia: {
    uberlandia: 'moro em Uberlândia',
    regiao: 'moro na região de Uberlândia',
    mudando: 'estou me mudando pra Uberlândia'
  },
  ingles_nivel: {
    fluente: 'fluente (atendo telefone em inglês)',
    avancado: 'avançado',
    intermediario: 'intermediário'
  },
  noturno: {
    total: 'total, 18h às 22h de seg a sex',
    'total-ajuste': 'total, com 2 a 4 semanas de ajuste',
    parcial: 'parcial (alguns dias)'
  },
  fimdesemana: {
    'sab-dom': 'sábado e domingo',
    sabado: 'sábado',
    eventual: 'eventual, combinando antes',
    nao: 'sem disponibilidade'
  },
  pretensao: {
    'ate-1500': 'até R$1.500',
    '1500-2000': 'R$1.500 a R$2.000',
    '2000-2500': 'R$2.000 a R$2.500',
    '2500-3000': 'R$2.500 a R$3.000',
    '3000-4000': 'R$3.000 a R$4.000',
    '4000+': 'acima de R$4.000'
  },
  experiencia: {
    'vendas-ingles': 'vendas/agendamento em inglês',
    'vendas-telefone': 'vendas por telefone (PT)',
    atendimento: 'atendimento ao cliente',
    'outro-comercial': 'vendas presenciais',
    nenhuma: 'sem experiência na área'
  },
  inicio: {
    imediato: 'imediato',
    '15-dias': 'até 15 dias',
    '30-dias': 'até 30 dias',
    'mais-30': 'mais de 30 dias'
  }
};

function traduzir(chave, valor) {
  return (TXT[chave] && TXT[chave][valor]) || valor || '-';
}

function montarLinkWhatsApp() {
  const a = state.answers;

  const mensagem =
    `Olá! Acabei de preencher o formulário da vaga de *Virtual Assistant*.\n\n` +
    `*Nome:* ${a.nome || '-'}\n` +
    `*Cidade:* ${traduzir('moradia', a.moradia)}\n` +
    `*Inglês:* ${traduzir('ingles_nivel', a.ingles_nivel)}\n` +
    `*Disponibilidade noturna:* ${traduzir('noturno', a.noturno)}\n` +
    `*Fim de semana:* ${traduzir('fimdesemana', a.fimdesemana)}\n` +
    `*Experiência:* ${traduzir('experiencia', a.experiencia)}\n` +
    `*Pretensão salarial:* ${traduzir('pretensao', a.pretensao)}\n` +
    `*Disponibilidade de início:* ${traduzir('inicio', a.inicio)}\n\n` +
    `Estou enviando na sequência o meu áudio de 1 minuto em inglês.`;

  return `https://wa.me/${WHATSAPP_RH}?text=${encodeURIComponent(mensagem)}`;
}

function trackAplicacao() {
  enviarParaSheet('audio-solicitado', classificar());
}

// ============================================================
// ENVIO PRA GOOGLE SHEET
// ============================================================
function enviarParaSheet(status, tier, motivoKO) {
  if (!WEBHOOK_URL) return;

  // evita linha duplicada quando o candidato clica no WhatsApp
  if (status === 'audio-solicitado' && state.enviado) {
    postar({
      status,
      nome: state.answers.nome || '',
      whatsapp: state.answers.whatsapp || '',
      whatsapp_e164: telefoneE164(state.answers.whatsapp)
    });
    return;
  }

  const a = state.answers;
  const minutos = state.startedAt ? Math.round((Date.now() - state.startedAt) / 60000) : '';

  const payload = {
    status,
    tier: tier || '',
    motivo_desqualificacao: motivoKO || '',
    pontuacao: calcularPontuacao(),
    acertos_ingles: `${acertosIngles()}/4`,
    nome: a.nome || '',
    whatsapp: a.whatsapp || '',                              // como o candidato digitou
    whatsapp_e164: telefoneE164(a.whatsapp),                 // 5534999112233 — pra automação
    whatsapp_link: telefoneE164(a.whatsapp)                  // clicável direto da planilha
      ? 'https://wa.me/' + telefoneE164(a.whatsapp)
      : '',
    email: a.email || '',
    idade: a.idade || '',
    moradia: a.moradia || '',
    presencial: a.presencial || '',
    noturno: a.noturno || '',
    fimdesemana: a.fimdesemana || '',
    ingles_nivel: a.ingles_nivel || '',
    ingles_origem: a.ingles_origem || [],
    experiencia: a.experiencia || '',
    ferramentas: a.ferramentas || [],
    en_q1: a.en_q1 || '',
    en_q2: a.en_q2 || '',
    en_q3: a.en_q3 || '',
    en_q4: a.en_q4 || '',
    en_write_intro: a.en_write_intro || '',
    en_write_roleplay: a.en_write_roleplay || '',
    en_write_objecao: a.en_write_objecao || '',
    pretensao: a.pretensao || '',
    modelo_remuneracao: a.modelo_remuneracao || '',
    inicio: a.inicio || '',
    motivacao: a.motivacao || '',
    linkedin: a.linkedin || '',
    minutos_preenchimento: minutos,
    referrer: document.referrer || '',
    userAgent: navigator.userAgent || ''
  };

  state.enviado = true;
  postar(payload);
}

// Envia como form-urlencoded (simple request, sem preflight CORS).
// Arrays viram string separada por vírgula pra cair bonito na planilha.
function postar(payload) {
  const form = new URLSearchParams();

  Object.keys(payload).forEach(chave => {
    const valor = payload[chave];
    form.append(chave, Array.isArray(valor) ? valor.join(', ') : String(valor ?? ''));
  });

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: form.toString(),
    keepalive: true
  }).catch(err => console.warn('Webhook falhou:', err));
}

// ============================================================
// ROTATOR DA TELA DE LOADING
// ============================================================
function iniciarLoadingRotator() {
  const rotator = document.getElementById('loading-rotator').querySelector('p');
  let index = 0;

  const interval = setInterval(() => {
    rotator.style.opacity = '0';
    setTimeout(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      rotator.textContent = LOADING_MESSAGES[index];
      rotator.style.opacity = '1';
    }, 300);
  }, 900);

  setTimeout(() => clearInterval(interval), 4200);
}
