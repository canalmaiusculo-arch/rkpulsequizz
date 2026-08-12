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

---

# Quizz de recrutamento · Virtual Assistant (`/va`)

Segundo quizz, hospedado no **mesmo projeto Vercel**, na rota `/va`. Serve pra recrutar o time de
VAs (atendentes comerciais bilíngues) que trabalha presencialmente em Uberlândia/MG, das 18h às 22h,
atendendo os clientes americanos dos nossos clientes.

Arquivos: `public/va/index.html`, `public/va/quizz-va.js`, `public/va/styles-va.css`.
É **independente** do quizz de vendas — não compartilha CSS, JS nem webhook.

## Como funciona
23 telas. Requisitos inegociáveis são **knockout**: se o candidato marcar a opção eliminatória, ele
cai na tela "banco de talentos" na hora (e mesmo assim é salvo na planilha).

| Requisito | Elimina quando |
|---|---|
| Morar em Uberlândia/região | "Moro em outra cidade e não pretendo mudar" |
| Trabalhar presencial | "Só consigo trabalhar remoto" |
| Turno 18h–22h, seg a sex | "Não consigo trabalhar nesse horário" |
| Inglês fluente de conversação | "Básico — ainda estou aprendendo a conversar" |

Quem passa recebe uma pontuação (0–100) e cai em um de três tiers:

- **A (≥70)** — perfil aprovado nesta etapa → CTA de WhatsApp + tarefa do áudio em inglês
- **B (≥50)** — em análise humana → mesma CTA
- **C (<50)** — banco de talentos, sem CTA

A pontuação soma: nível de inglês (25), *English check* de múltipla escolha (28), experiência
comercial (20), fim de semana (10), moradia (10), pretensão salarial (7), início (5), turno (5).
Há uma trava: inglês "intermediário" ou 0–1 acertos no *English check* nunca chega no tier A.

## Filtro de inglês
- 4 questões de múltipla escolha (gírias reais de telefone: *swing by*, *give me a ring*, *set up an appointment*, *a little steep*). O gabarito fica no HTML, em `data-correct="true"`.
- 3 respostas escritas em inglês: apresentação, roleplay de agendamento e contorno de objeção (com mínimo de caracteres).
- Etapa final: o candidato manda um **áudio de 1 minuto em inglês** pelo WhatsApp. É o que realmente valida a fluência — texto dá pra traduzir, áudio não.

## O que trocar antes de publicar
Tudo em `public/va/quizz-va.js`, no topo do arquivo:

- `WHATSAPP_RH` — número do RH em Uberlândia (DDI+DDD, só números). **Está vazio de propósito.** Enquanto ficar vazio, a tela de resultado esconde o botão e a tarefa do áudio, e o rodapé avisa que o RH entra em contato. Basta preencher pra reativar o CTA — nada mais precisa mudar.
- `WEBHOOK_URL` — já apontando pro **Catch Hook do Zapier**. Se um dia quiser trocar por Google Sheets direto, use o Apps Script de `scripts/google-apps-script-va.gs` (deploy separado do de vendas) — ele aceita os dois formatos.

## Como as respostas chegam
Cada candidatura é um POST **`application/x-www-form-urlencoded`** com 32 campos nomeados
(`status`, `tier`, `pontuacao`, `acertos_ingles`, `nome`, `whatsapp`, `email`, `en_write_intro`,
`en_write_roleplay`, `en_write_objecao`, `pretensao`...). Arrays (`ingles_origem`, `ferramentas`)
chegam como texto separado por vírgula.

Form-encoded é proposital: o hook do Zapier responde ao preflight sem
`access-control-allow-headers`, então `application/json` seria barrado pelo navegador.
Form-encoded é *simple request* — não gera preflight — e o Zapier já parseia em campos nomeados.

O campo `status` diz em que ponto o candidato saiu:

| `status` | Significa |
|---|---|
| `completo` | terminou o formulário (veja `tier` e `pontuacao`) |
| `desqualificado` | bateu num knockout (veja `motivo_desqualificacao`) |
| `audio-solicitado` | clicou no botão do WhatsApp pra mandar o áudio |

E em `public/va/index.html`: as faixas de **pretensão salarial** (tela 20) e a jornada de 20h/semana,
se os seus números forem outros. As faixas atuais (R$1.500 a R$4.000+) são um chute de mercado.

> O quizz de recrutamento **não carrega o Meta Pixel** de propósito — tráfego de candidato
> poluiria a otimização do pixel de vendas.
