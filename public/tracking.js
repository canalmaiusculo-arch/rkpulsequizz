// ============================================
// META PIXEL — base code (RK Pulse Digital)
// Trocar META_PIXEL_ID pelo Pixel real da RK antes do deploy
// ============================================

const META_PIXEL_ID = '923238036934954';

(function() {
  if (window.fbq) return;

  const n = window.fbq = function() {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };

  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];

  const t = document.createElement('script');
  t.async = true;
  t.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(t, s);
})();

fbq('init', META_PIXEL_ID);
fbq('track', 'PageView');

window.addEventListener('load', () => {
  enviarParaCAPI('PageView', generateEventId(), {});
});

// ============================================
// trackEvent — dispara Pixel + CAPI com mesmo event_id (deduplica)
// ============================================
async function trackEvent(eventName, customParams = {}) {
  const eventId = generateEventId();
  const STANDARD_EVENTS = ['PageView', 'Lead'];

  try {
    if (STANDARD_EVENTS.includes(eventName)) {
      fbq('track', eventName, customParams, { eventID: eventId });
    } else {
      fbq('trackCustom', eventName, customParams, { eventID: eventId });
    }
  } catch (err) {
    console.warn('Pixel client-side falhou:', err);
  }

  enviarParaCAPI(eventName, eventId, customParams);
}

async function enviarParaCAPI(eventName, eventId, customParams) {
  try {
    await fetch('/api/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId,
        eventTime: Math.floor(Date.now() / 1000),
        userData: {
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
          userAgent: navigator.userAgent
        },
        customData: customParams,
        sourceUrl: window.location.href
      }),
      keepalive: true
    });
  } catch (err) {
    console.warn('CAPI falhou:', err);
  }
}

function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
