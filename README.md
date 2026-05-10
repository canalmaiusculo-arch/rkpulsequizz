# RK Pulse Digital — Quizz "O Protocolo"

Quizz conversacional de 14 telas que qualifica empresários brasileiros de service business nos EUA pra uma análise estratégica direta com o Jackson (founder da RK Pulse Digital). Tracking dual (Pixel + CAPI) hospedado na Vercel.

## Stack
- HTML + Tailwind (CDN) + JS vanilla no frontend
- Vercel Functions (Node.js serverless) para a CAPI
- Deploy na Vercel

## Setup local
```bash
npm install
cp .env.local.example .env.local  # preenche as variáveis
npm run dev
```

Acesse `http://localhost:3000`.

## Deploy
```bash
npm run deploy
```

## Variáveis de ambiente
- `META_PIXEL_ID` — ID do Meta Pixel da RK Pulse
- `META_ACCESS_TOKEN` — Access Token da Conversions API
- `META_TEST_EVENT_CODE` — código de teste (apenas em QA, remover em produção)

## Configuração rápida
- **WhatsApp do Jackson**: troque a const `WHATSAPP_NUMERO` em `public/quizz.js`
- **Pixel ID client-side**: troque a const `META_PIXEL_ID` em `public/tracking.js`
- **Google Sheet (leads)**: cole a URL do Web App em `SHEETS_WEBHOOK_URL` em `public/quizz.js` — passo a passo no topo de `scripts/google-apps-script.gs`

## Salvamento dos leads em Google Sheets
Cada lead vira uma linha numa Google Sheet quando ele:
- **Completa o quizz** (chega na tela de diagnóstico) — perfil + todas as respostas
- **Cai na waitlist** (faturamento muito baixo ou compromisso US$800 não cabe)

Setup completo (5 min): siga o cabeçalho do arquivo `scripts/google-apps-script.gs`.

Se a const `SHEETS_WEBHOOK_URL` ficar vazia, o quizz funciona normal — só não envia pra planilha.
