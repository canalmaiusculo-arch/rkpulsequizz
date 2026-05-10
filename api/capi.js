// ============================================
// VERCEL SERVERLESS FUNCTION — Conversions API
// ============================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.error('CAPI: variáveis de ambiente faltando');
    return res.status(500).json({ error: 'Server config missing' });
  }

  const {
    eventName,
    eventId,
    eventTime,
    userData = {},
    customData = {},
    sourceUrl
  } = req.body;

  const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
                || req.headers['x-real-ip']
                || req.socket?.remoteAddress
                || '';

  const payload = {
    data: [{
      event_name: eventName,
      event_time: eventTime || Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: sourceUrl,
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: userData.userAgent || req.headers['user-agent'],
        fbp: userData.fbp || undefined,
        fbc: userData.fbc || undefined
      },
      custom_data: customData
    }]
  };

  if (TEST_EVENT_CODE) {
    payload.test_event_code = TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta CAPI error:', JSON.stringify(result));
      return res.status(500).json({ error: result });
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('CAPI request failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
