// Poketto Worker: serves the static site and stores the timeline's "my events" in KV.
// GET  /api/timeline         -> { data }       public, read-only
// PUT  /api/timeline         -> saves data     edit key required
// POST /api/timeline/unlock  -> { ok: true }   checks the edit key, writes nothing
//
// Cloudflare Access used to sit in front of the whole site, which also blocked
// browsing, and Access cannot lock only /api. Access is being removed so anyone
// can read the site. Writes stay closed here: PUT and unlock must send the Worker
// secret EDIT_PASS (set with `wrangler secret put`, never stored in the repo) as
//   Authorization: Bearer <encodeURIComponent(passphrase)>
// or the same token in X-Edit-Key.
// Missing secret, missing key, or a wrong key → 401 { error: "unauthorized" }.
// An unset EDIT_PASS does not open writes.
const MAX_BYTES = 100 * 1024;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function valid(d) {
  return d && Array.isArray(d.tracks) && Array.isArray(d.events) && d.tracks.length <= 30 && d.events.length <= 1000;
}

// Token is encodeURIComponent(passphrase), so any passphrase is a legal header value.
function presentedKey(request) {
  const auth = request.headers.get('authorization');
  let token = null;
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (!m) return null;
    token = m[1].trim();
  } else {
    const x = request.headers.get('x-edit-key');
    if (!x) return null;
    token = x.trim();
  }
  if (!token || token.length > 4096) return null;
  try { return decodeURIComponent(token); } catch (_) { return null; }
}

function bytesEqual(a, b) {
  const aa = a instanceof Uint8Array ? a : new Uint8Array(a);
  const bb = b instanceof Uint8Array ? b : new Uint8Array(b);
  if (aa.length !== bb.length) return false;
  try {
    if (crypto.subtle && typeof crypto.subtle.timingSafeEqual === 'function') {
      return crypto.subtle.timingSafeEqual(aa, bb);
    }
  } catch (_) { /* runtime without a usable timingSafeEqual */ }
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

// Hash both sides first so the compare does not bail out on length.
// Empty or missing EDIT_PASS never matches, including an empty key.
async function keyOk(request, env) {
  const expected = env && typeof env.EDIT_PASS === 'string' ? env.EDIT_PASS : '';
  const given = presentedKey(request);
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given == null ? '' : given)),
    crypto.subtle.digest('SHA-256', enc.encode(expected))
  ]);
  return expected.length > 0 && given != null && given.length > 0 && bytesEqual(ha, hb);
}

function unauthorized() { return json({ error: 'unauthorized' }, 401); }

async function timeline(request, env) {
  if (request.method === 'GET') {
    const data = await env.TIMELINE_KV.get('mine', 'json');
    return json({ data: data || { tracks: [], events: [] } });
  }
  if (request.method !== 'PUT') return json({ error: 'method' }, 405);
  if (!(await keyOk(request, env))) return unauthorized();

  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: 'too-big' }, 413);
  let data;
  try { data = JSON.parse(text); } catch (_) { return json({ error: 'bad-json' }, 400); }
  if (!valid(data)) return json({ error: 'bad-data' }, 400);
  await env.TIMELINE_KV.put('mine', JSON.stringify({ tracks: data.tracks, events: data.events }));
  return json({ ok: true });
}

async function unlock(request, env) {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await keyOk(request, env))) return unauthorized();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/timeline') return timeline(request, env);
    if (url.pathname === '/api/timeline/unlock') return unlock(request, env);
    return env.ASSETS.fetch(request);
  },
};
