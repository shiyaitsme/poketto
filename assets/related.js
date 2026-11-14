/* Poketto related tools: adds a "相关工具" block above the page footer.
   Usage: <script src="../assets/related.js" defer></script> on a tool page.
   Data: tools.json, each entry may carry "related": ["tools/other.html", ...].
   Works without poketto.js/poketto.css (it injects its own small style), so self-contained pages can use it too. */
(function () {
  var script = document.currentScript;
  if (!script || !script.src) return;
  var listUrl = new URL('../tools.json', script.src);

  // Cloudflare may serve /tools/light.html as /tools/light, so compare paths without ".html" and trailing slash.
  function key(u) { return u.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, ''); }

  function build(here, byKey, list) {
    var section = document.createElement('section');
    section.className = 'pk-related';
    section.setAttribute('aria-label', '相关工具');
    var h = document.createElement('h2');
    h.className = 'pk-h2';
    var small = document.createElement('small'); small.textContent = 'Related';
    h.appendChild(small); h.appendChild(document.createTextNode('相关工具'));
    var ul = document.createElement('ul');
    list.forEach(function (t) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'pk-br pk-veil pk-related-card';
      a.href = new URL(t.url, listUrl).href;
      var sub = document.createElement('span'); sub.className = 'pk-related-sub'; sub.textContent = t.subject || '';
      var title = document.createElement('strong'); title.textContent = t.title;
      var desc = document.createElement('span'); desc.className = 'pk-related-desc'; desc.textContent = t.description || '';
      a.appendChild(sub); a.appendChild(title); a.appendChild(desc);
      li.appendChild(a); ul.appendChild(li);
    });
    section.appendChild(h); section.appendChild(ul);
    return section;
  }

  function style() {
    var s = document.createElement('style');
    s.textContent =
      '.pk-related{display:grid;gap:12px}' +
      '.pk-related ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:18px}' +
      '.pk-related li{min-width:0}' +
      '.pk-related-card{display:grid;gap:4px;height:100%;color:var(--ink,#1d1e1b);text-decoration:none;transition:background-color .2s ease}' +
      '.pk-related-card:hover,.pk-related-card:focus-visible{background-color:rgba(185,224,76,.25);outline:none}' +
      '.pk-related-card:focus-visible{outline:2px solid var(--leaf,#5fae5a);outline-offset:3px}' +
      '.pk-related-card strong{font-weight:900;font-size:17px;line-height:1.35}' +
      '.pk-related-sub{font-family:var(--label,"Archivo",sans-serif);font-weight:650;font-size:12px;letter-spacing:.08em;color:var(--ink-2,#4a4c45)}' +
      '.pk-related-desc{font-size:13.5px;line-height:1.6;color:var(--ink-2,#4a4c45);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}';
    document.head.appendChild(s);
  }

  function run() {
    var foot = document.querySelector('.pk-foot');
    if (!foot) return;
    fetch(listUrl.href).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (all) {
      if (!Array.isArray(all)) return;
      var byKey = {};
      all.forEach(function (t) { byKey[key(new URL(t.url, listUrl))] = t; });
      var me = byKey[key(new URL(location.href))];
      if (!me || !Array.isArray(me.related)) return;
      var list = me.related.map(function (u) { return byKey[key(new URL(u, listUrl))]; }).filter(Boolean);
      if (!list.length) return;
      style();
      foot.parentNode.insertBefore(build(me, byKey, list), foot);
      if (window.Poketto && window.Poketto.repaint) window.Poketto.repaint();
    }).catch(function () { /* offline or opened as a file: just skip */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
