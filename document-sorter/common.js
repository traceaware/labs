// Shared by the Sort and Criteria pages: header, Labs password, API calls.
(function () {
  const API = ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:8787'
    : 'https://aware-document-sorter.rhys-michael-davies.workers.dev';
  const KEY = 'aware-labs-pw'; // same key as the other Labs pages, so one password opens them all
  const store = {
    get() { try { return sessionStorage.getItem(KEY); } catch (_) { return null; } },
    set(v) { try { sessionStorage.setItem(KEY, v); } catch (_) {} },
    del() { try { sessionStorage.removeItem(KEY); } catch (_) {} },
  };

  const MARK = '<svg viewBox="0 0 259 259" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="129.5" cy="129.5" r="129.5" fill="#FF3300"/><path d="M162.307 154.696C174.803 139.995 184.659 123.839 184.659 103.513C184.659 85.8112 173.438 67.5098 154.657 67.5098C147.096 67.5098 136.67 70.45 129.155 84.1761C121.639 70.45 111.213 67.5098 103.653 67.5098C84.8713 67.5098 73.6504 85.8112 73.6504 103.513C73.6504 123.839 83.5362 139.965 96.0171 154.651L83.4311 181.519H96.6922L104.748 164.342C107.133 166.892 109.563 169.413 111.978 171.933C116.224 176.358 120.619 180.934 124.684 185.509L129.155 190.534L133.64 185.524C137.645 181.054 141.951 176.568 146.136 172.233C148.626 169.638 151.146 167.027 153.622 164.402L161.647 181.534H174.908L162.337 154.712L162.307 154.696ZM101.658 142.636C92.2818 130.8 85.6513 118.334 85.6513 103.513C85.6513 91.7216 92.3868 79.5107 103.653 79.5107C110.313 79.5107 115.279 83.201 119.254 91.1216L122.524 98.1121L101.658 142.636ZM137.465 163.907C134.72 166.757 131.915 169.668 129.155 172.623C126.319 169.578 123.424 166.562 120.604 163.622C117.064 159.932 113.553 156.287 110.208 152.626L129.14 112.243L148.086 152.656C144.666 156.392 141.081 160.127 137.45 163.892L137.465 163.907ZM156.667 142.681L135.785 98.1121L139.055 91.1216C143.031 83.201 147.996 79.5107 154.657 79.5107C165.923 79.5107 172.658 91.7216 172.658 103.513C172.658 118.349 166.043 130.83 156.667 142.681Z" fill="#F5F5F5"/></svg>';

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pathText = path => path.join(' → ');
  const pathHtml = path => path.map(esc).join('<span class="arr" aria-hidden="true">→</span>');

  function header(page) {
    const bar = document.createElement('header');
    bar.className = 'bar';
    bar.innerHTML = `<div class="bar-in">
      <a class="brand" href="./">${MARK}<span>Document sorter</span></a>
      <nav class="nav" aria-label="Pages">
        <a href="./" ${page === 'sort' ? 'aria-current="page"' : ''}>Sort</a>
        <a href="criteria.html" ${page === 'criteria' ? 'aria-current="page"' : ''}>Criteria</a>
      </nav>
    </div>`;
    document.body.prepend(bar);
  }

  function gateEl() {
    const g = document.createElement('div');
    g.id = 'gate';
    g.innerHTML = `<form class="gcard" id="gform">
      ${MARK}
      <h1 class="display">Document sorter</h1>
      <p>Enter the Labs password to open this page.</p>
      <input id="gpw" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password" required>
      <button class="btn primary" type="submit" id="gbtn">Open</button>
      <p class="gerr" id="gerr" role="alert"></p>
    </form>`;
    document.body.append(g);
    return g;
  }

  class ApiError extends Error {
    constructor(status, code, message) { super(message); this.status = status; this.code = code; }
  }

  async function call(path, { method = 'GET', body, password } = {}) {
    const headers = { Authorization: 'Bearer ' + (password || store.get() || '') };
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    let res;
    try {
      res = await fetch(API + path, { method, headers, cache: 'no-store', body: body && !(body instanceof FormData) ? JSON.stringify(body) : body });
    } catch (_) {
      throw new ApiError(0, 'offline', 'Could not reach the sorter. Check your connection and try again.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, data.error || 'error', data.message || 'Something went wrong. Try again.');
    return data;
  }

  // Shows the password gate when needed, then runs the page with the server status.
  function start(page, run) {
    header(page);
    const g = gateEl();
    const f = g.querySelector('#gform'), pw = g.querySelector('#gpw'), b = g.querySelector('#gbtn'), e = g.querySelector('#gerr');
    const open = (password, status) => { store.set(password); g.hidden = true; run(status); };
    f.addEventListener('submit', async ev => {
      ev.preventDefault(); b.disabled = true; e.textContent = '';
      try { open(pw.value, await call('/status', { password: pw.value })); }
      catch (err) { e.textContent = err.status === 401 ? 'That password is not right.' : err.message; pw.select(); }
      b.disabled = false;
    });
    const saved = store.get();
    if (saved) call('/status').then(s => open(saved, s)).catch(() => { store.del(); pw.focus(); });
    else pw.focus();
  }

  const fmtDate = iso => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  window.Labs = { start, call, esc, pathText, pathHtml, fmtDate };
})();
