// Vermittler zwischen der Web-App und Garmins Personal API.
// Garmin erlaubt keine Aufrufe direkt aus dem Browser (kein CORS). Dieser Worker reicht die Anfrage
// der App unverändert weiter und gibt die Antwort zurück. Er speichert nichts und kennt keinen Schlüssel:
// den Garmin-Schlüssel schickt die App bei jeder Anfrage selbst mit.
const GARMIN = 'https://personal.connectapi.garmin.com';
const TOKEN = '/personalapitoken-service/personal-api/personal-api-key/token';
const LESEN = [
  /^\/usersummary-service\/v2\/dailysummaries$/,
  /^\/usersummary-service\/stats\/stress\/daily\/[\d-]+\/[\d-]+$/,
  /^\/wellness-service\/wellness\/bodyBattery\/reports\/daily$/,
  /^\/sleep-service\/sleep\/(dailySleep|dailySleepSummariesByDate)$/,
  /^\/hrv-service\/hrv\/(daily\/[\d-]+\/)?[\d-]+$/,
];

export default {
  async fetch(req, env) {
    const erlaubt = (env.ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const origin = req.headers.get('Origin') || '';
    const ok = erlaubt.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': ok ? origin : erlaubt[0] || 'null',
      'Access-Control-Allow-Headers': 'authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
    };
    const antwort = (status, text) => new Response(text, { status, headers: cors });
    if (req.method === 'OPTIONS') return antwort(204, null);
    if (!ok) return antwort(403, 'Nur für die eigene App.');
    const url = new URL(req.url);
    const istToken = url.pathname === TOKEN;
    if (istToken ? req.method !== 'POST' : req.method !== 'GET' || !LESEN.some(r => r.test(url.pathname))) return antwort(404, 'Unbekannte Adresse.');
    const auth = req.headers.get('Authorization') || '';
    if (!(istToken ? /^ApiKey \S+$/ : /^Bearer \S+$/).test(auth)) return antwort(401, 'Schlüssel fehlt.');
    const r = await fetch(GARMIN + url.pathname + url.search, {
      method: req.method,
      headers: { Authorization: auth, Accept: istToken ? '*/*' : 'application/json' },
    });
    return new Response(r.body, { status: r.status, headers: { ...cors, 'Content-Type': r.headers.get('Content-Type') || 'text/plain' } });
  },
};
