// Poketto Worker: serves the static site and stores the timeline's "my events" in KV.
// GET  /api/timeline  -> { data }
// PUT  /api/timeline  -> saves data
// There is no passphrase: the whole site sits behind Cloudflare Access, so only the owner can reach this at all.
const MAX_BYTES = 100 * 1024;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function valid(d) {
  return d && Array.isArray(d.tracks) && Array.isArray(d.events) && d.tracks.length <= 30 && d.events.length <= 1000;
}

async function timeline(request, env) {
  if (request.method === 'GET') {
    const data = await env.TIMELINE_KV.get('mine', 'json');
    return json({ data: data || { tracks: [], events: [] } });
  }
  if (request.method !== 'PUT') return json({ error: 'method' }, 405);

  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: 'too-big' }, 413);
  let data;
  try { data = JSON.parse(text); } catch (_) { return json({ error: 'bad-json' }, 400); }
  if (!valid(data)) return json({ error: 'bad-data' }, 400);
  await env.TIMELINE_KV.put('mine', JSON.stringify({ tracks: data.tracks, events: data.events }));
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/timeline') return timeline(request, env);
    return env.ASSETS.fetch(request);
  },
};
