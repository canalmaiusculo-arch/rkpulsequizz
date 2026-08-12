/**
 * GOOGLE APPS SCRIPT — Recrutamento de VA (Virtual Assistant)
 * ===========================================================
 * Recebe as candidaturas do quizz em /va e salva numa planilha.
 *
 * ATENÇÃO: este é um deploy SEPARADO do webhook do quizz de vendas
 * (scripts/google-apps-script.gs). Use uma planilha própria pro RH —
 * as respostas em inglês são longas e não cabem na planilha de leads.
 *
 * COMO USAR:
 * 1. Crie uma Google Sheet nova (ex: "RK · Candidatos VA")
 * 2. Menu Extensões → Apps Script
 * 3. Cole TODO este arquivo no editor (substituindo o que tiver)
 * 4. Salve (Ctrl+S)
 * 5. "Implantar" → "Nova implantação" → tipo "App da Web"
 *    - Executar como: "Eu (seu email)"
 *    - Quem pode acessar: "Qualquer pessoa"   ← IMPORTANTE
 * 6. Implantar → autorizar
 * 7. COPIE A URL (termina em /exec) e cole em public/va/quizz-va.js
 *    na constante SHEETS_WEBHOOK_URL
 * 8. Commit + push pra Vercel — pronto
 *
 * STATUS que chegam aqui:
 *  - "completo"           → candidato terminou o formulário
 *  - "desqualificado"     → bateu num knockout (cidade, presencial, horário, inglês)
 *  - "audio-solicitado"   → clicou no botão do WhatsApp pra mandar o áudio
 *                           (só atualiza a coluna de áudio da linha existente)
 */

const ABA = 'Candidatos';

const HEADERS = [
  'Data/Hora (BR)',
  'Status',
  'Tier (A/B/C)',
  'Pontuação',
  'Motivo desqualificação',
  'Nome',
  'WhatsApp',
  'E-mail',
  'Idade',
  'Mora em',
  'Presencial',
  'Noturno 18-22h',
  'Fim de semana',
  'Inglês (autoavaliação)',
  'Origem do inglês',
  'Experiência comercial',
  'Ferramentas',
  'English check (acertos)',
  'EN Q1', 'EN Q2', 'EN Q3', 'EN Q4',
  'EN · Apresentação',
  'EN · Roleplay agendamento',
  'EN · Objeção',
  'Pretensão salarial',
  'Modelo de remuneração',
  'Início',
  'Motivação (PT)',
  'LinkedIn/CV',
  'Áudio EN enviado?',
  'Minutos preenchendo',
  'Referrer',
  'User-Agent'
];

function doPost(e) {
  try {
    const sheet = pegarAba();
    const data = lerPayload(e);

    // Clique no WhatsApp: só marca a coluna de áudio da linha do candidato
    if (data.status === 'audio-solicitado') {
      marcarAudio(sheet, data.whatsapp, data.nome);
      return json({ success: true, updated: true });
    }

    sheet.appendRow([
      Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss'),
      data.status || '',
      data.tier || '',
      data.pontuacao || 0,
      data.motivo_desqualificacao || '',
      data.nome || '',
      data.whatsapp || '',
      data.email || '',
      data.idade || '',
      data.moradia || '',
      data.presencial || '',
      data.noturno || '',
      data.fimdesemana || '',
      data.ingles_nivel || '',
      lista(data.ingles_origem),
      data.experiencia || '',
      lista(data.ferramentas),
      data.acertos_ingles || '',
      data.en_q1 || '', data.en_q2 || '', data.en_q3 || '', data.en_q4 || '',
      data.en_write_intro || '',
      data.en_write_roleplay || '',
      data.en_write_objecao || '',
      data.pretensao || '',
      data.modelo_remuneracao || '',
      data.inicio || '',
      data.motivacao || '',
      data.linkedin || '',
      'não',
      data.minutos_preenchimento || '',
      data.referrer || '',
      data.userAgent || ''
    ]);

    return json({ success: true });

  } catch (err) {
    return json({ success: false, error: err.message });
  }
}

/** Procura a última linha do candidato (por WhatsApp) e marca o áudio */
function marcarAudio(sheet, whatsapp, nome) {
  const ultima = sheet.getLastRow();
  if (ultima < 2) return;

  const colWhats = HEADERS.indexOf('WhatsApp') + 1;
  const colNome = HEADERS.indexOf('Nome') + 1;
  const colAudio = HEADERS.indexOf('Áudio EN enviado?') + 1;

  const valores = sheet.getRange(2, 1, ultima - 1, HEADERS.length).getValues();

  for (let i = valores.length - 1; i >= 0; i--) {
    const linhaWhats = String(valores[i][colWhats - 1] || '');
    const linhaNome = String(valores[i][colNome - 1] || '');
    if ((whatsapp && linhaWhats === whatsapp) || (nome && linhaNome === nome)) {
      sheet.getRange(i + 2, colAudio).setValue('sim · ' +
        Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM HH:mm'));
      return;
    }
  }
}

function pegarAba() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ABA) || ss.insertSheet(ABA);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#2563eb')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(6);
  }

  return sheet;
}

/**
 * O quizz envia form-urlencoded (evita preflight CORS), mas aceitamos
 * JSON também — assim o mesmo script serve pra qualquer origem.
 */
function lerPayload(e) {
  if (e.parameter && Object.keys(e.parameter).length > 0) return e.parameter;
  return JSON.parse(e.postData.contents);
}

function lista(v) {
  return Array.isArray(v) ? v.join(', ') : (v || '');
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('RK · Webhook de recrutamento VA online · ' + new Date().toISOString());
}
