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
