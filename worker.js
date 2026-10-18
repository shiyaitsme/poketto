// Poketto Worker: serves the static site and stores the timeline's "my events" in KV.
// GET  /api/timeline  -> { claimed, data }   (anyone can read)
// PUT  /api/timeline  -> saves data; needs header X-Poketto-Key.
//   The first key ever sent becomes the passphrase (only its salted hash is stored); later writes must match it.
const MAX_BYTES = 100 * 1024;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function hash(key, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + key));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function valid(d) {
  return d && Array.isArray(d.tracks) && Array.isArray(d.events) && d.tracks.length <= 30 && d.events.length <= 1000;
}

async function timeline(request, env) {
  if (request.method === 'GET') {
    const auth = await env.TIMELINE_KV.get('auth', 'json');
    const data = await env.TIMELINE_KV.get('mine', 'json');
    return json({ claimed: !!auth, data: data || { tracks: [], events: [] } });
  }
  if (request.method !== 'PUT') return json({ error: 'method' }, 405);

  const key = request.headers.get('x-poketto-key') || '';
  if (key.length < 6 || key.length > 100) return json({ error: 'short-key' }, 400);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: 'too-big' }, 413);
  let data;
  try { data = JSON.parse(text); } catch (_) { return json({ error: 'bad-json' }, 400); }
  if (!valid(data)) return json({ error: 'bad-data' }, 400);

  const auth = await env.TIMELINE_KV.get('auth', 'json');
  if (!auth) {
    const salt = crypto.randomUUID();
    await env.TIMELINE_KV.put('auth', JSON.stringify({ salt, hash: await hash(key, salt) }));
  } else if (!same(await hash(key, auth.salt), auth.hash)) {
    return json({ error: 'bad-key' }, 401);
  }
  await env.TIMELINE_KV.put('mine', JSON.stringify({ tracks: data.tracks, events: data.events }));
  return json({ ok: true, claimed: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/timeline') return timeline(request, env);
    return env.ASSETS.fetch(request);
  },
};
