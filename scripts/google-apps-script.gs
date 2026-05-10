/**
 * GOOGLE APPS SCRIPT — Recebe os leads do quizz e salva em planilha
 * ================================================================
 *
 * COMO USAR:
 * 1. Crie uma Google Sheet nova (ex: "RK · Leads do Quizz")
 * 2. Menu Extensões → Apps Script
 * 3. Cole TODO esse arquivo no editor (substituindo o que tiver)
 * 4. Salve (Ctrl+S) — pode dar qualquer nome ao projeto
 * 5. Clique em "Implantar" (canto sup. direito) → "Nova implantação"
 * 6. Em "Tipo", clica na engrenagem e seleciona "App da Web"
 * 7. Configure:
 *    - Descrição: "RK Quizz Webhook"
 *    - Executar como: "Eu (seu email)"
 *    - Quem pode acessar: "Qualquer pessoa"   ← IMPORTANTE
 * 8. Clique em "Implantar" → autorize a execução
 * 9. COPIE A URL que aparece (termina em /exec) e cole em
 *    `public/quizz.js` na constante SHEETS_WEBHOOK_URL
 * 10. Faça commit + push pra Vercel — pronto
 *
 * Toda vez que mudar o código aqui, criar uma NOVA implantação
 * (a URL pode mudar — atualize no quizz.js). Pra não mudar a URL,
 * use "Gerenciar implantações" → editar a existente → versão "Nova".
 */

const HEADERS = [
  'Data/Hora (BR)',
  'Status',
  'Perfil',
  'Serviço',
  'Faturamento',
  'Investimento atual',
  'Dores',
  'Histórico c/ agência',
  'Maior gargalo',
  'Decisor',
  'Compromisso (US$800+)',
  'Janela de início',
  'Referrer',
  'User-Agent'
];

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Cria header se planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#1d4ed8').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    const data = JSON.parse(e.postData.contents);
    const dores = Array.isArray(data.dores) ? data.dores.join(', ') : (data.dores || '');

    sheet.appendRow([
      Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss'),
      data.status || '',
      data.perfil || '',
      data.servico || '',
      data.faturamento || '',
      data.investimento || '',
      dores,
      data.historico || '',
      data.gargalo || '',
      data.decisor || '',
      data.comprometimento || '',
      data.janela || '',
      data.referrer || '',
      data.userAgent || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Endpoint GET pra teste manual no navegador
function doGet() {
  return ContentService.createTextOutput('RK Quizz Webhook online · ' + new Date().toISOString());
}
