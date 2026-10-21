// Sort screen. Files stay in the browser so "Sort again" can re-send them after a criteria edit.
Labs.start('sort', status => {
  const { call, esc, pathText, pathHtml } = Labs;
  const $ = id => document.getElementById(id);
  const TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  const MAX = 5 * 1024 * 1024;
  const AT_ONCE = 3;
  const NOT_KYB = 'Not KYB';

  let items = [];
  let nextId = 1;
  let noKey = !status.ai_key;
  $('nokey').hidden = !noKey;

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  function ranges(pages) {
    const out = [];
    for (let i = 0; i < pages.length; i++) {
      let j = i;
      while (j + 1 < pages.length && pages[j + 1] === pages[j] + 1) j++;
      out.push(i === j ? `${pages[i]}` : `${pages[i]}–${pages[j]}`);
      i = j;
    }
    return out.join(', ');
  }
  const pagesLabel = pages => (pages.length === 1 ? 'Page ' : 'Pages ') + ranges(pages);
  const isUnsure = r => r.groups.some(g => g.confidence === 'low');

  // Where each page landed last time, so a changed location can show what it was.
  function wasFor(group, prev) {
    if (!prev) return [];
    const now = pathText(group.path);
    const before = new Map();
    for (const g of prev.groups) if (g.pages.some(p => group.pages.includes(p))) before.set(pathText(g.path), g.path);
    return [...before.entries()].filter(([t]) => t !== now).map(([, p]) => p);
  }

  function message(item) {
    const r = item.result;
    const lines = r.groups.map(g => {
      const where = pathText(g.path);
      const lead = r.groups.length > 1 ? `${pagesLabel(g.pages)}: ` : '';
      const place = g.path[0] === NOT_KYB ? 'This belongs outside KYB.' : `Please add ${r.groups.length > 1 && g.pages.length > 1 ? 'these pages' : 'this'} in ${where}.`;
      return `${lead}${place} ${g.summary}`.trim();
    });
    return `${item.file.name}\n${lines.join('\n')}`;
  }

  function groupHtml(g, item, many) {
    const hint = g.path[0] === NOT_KYB ? '<div class="foot">Name the producer for the full location.</div>' : '';
    const was = wasFor(g, item.prev).map(p => `<div class="row was"><span class="label">Was</span><span class="val where">${pathHtml(p)}</span></div>`).join('');
    const alt = g.confidence === 'low' && g.alternative ? `<div class="alt">
        <div class="row"><span class="label">Or</span><span class="val where">${pathHtml(g.alternative.path)}</span></div>
        <div class="val">${esc(g.alternative.separates)}</div>
      </div>` : '';
    return `<div class="group">
      ${many ? `<span class="pages">${pagesLabel(g.pages)}</span>` : ''}
      <div class="rows">
        <div class="row"><span class="label">Belongs in</span><span class="val where">${pathHtml(g.path)}</span></div>
        ${was}
        <div class="row"><span class="label">What it is</span><span class="val">${esc(g.summary)}</span></div>
        <div class="row"><span class="label">Why</span><span class="val">${esc(g.reason)}</span></div>
        ${alt}${hint}
      </div>
    </div>`;
  }

  function cardHtml(item) {
    const r = item.result;
    let state, meta, body = '';
    if (item.status === 'error') {
      state = '<span class="status"><span class="dot ring"></span>Could not sort</span>';
      meta = 'Not sorted';
      body = `<div class="error-row">${esc(item.error)}</div>`;
    } else if (item.status !== 'done') {
      state = '<span class="status"><span class="dot busy"></span>Sorting</span>';
      meta = item.prev ? 'Sorting again' : 'Sorting';
    } else {
      const many = r.groups.length > 1;
      state = isUnsure(r)
        ? '<span class="status"><span class="dot unsure"></span>Not sure</span>'
        : '<span class="status"><span class="dot"></span>Sorted</span>';
      meta = [plural(r.page_count, 'page', 'pages'), many ? plural(r.groups.length, 'page group', 'page groups') : '', `criteria version ${r.criteria_version}`].filter(Boolean).join(', ');
      body = r.groups.map(g => groupHtml(g, item, many)).join('');
    }
    const changed = item.status === 'done' && item.prev && r.groups.some(g => wasFor(g, item.prev).length) ? '<span class="tag">Changed</span>' : '';
    const copy = item.status === 'done' ? `<button class="btn small" type="button" data-copy="${item.id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg><span>Copy message</span></button>` : '';
    return `<article class="card">
      <div class="card-head">
        <div class="sheets" aria-hidden="true"><i></i><i></i></div>
        <div class="file"><b>${esc(item.file.name)}</b><span>${meta}</span></div>
        <span class="right">${changed}${state}${copy}<button class="remove" type="button" data-remove="${item.id}" aria-label="Remove ${esc(item.file.name)}" title="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span>
      </div>
      ${body}
    </article>`;
  }

  function render() {
    const has = items.length > 0;
    $('dropBig').hidden = has;
    $('dropSlim').hidden = !has;
    $('actions').hidden = !has;
    const busy = items.some(i => i.status === 'queued' || i.status === 'busy');
    $('again').disabled = busy || noKey;

    const done = items.filter(i => i.status === 'done');
    const counts = [
      [done.filter(i => !isUnsure(i.result)).length, 'sorted', 'dot'],
      [done.filter(i => isUnsure(i.result)).length, 'not sure', 'dot unsure'],
      [items.filter(i => i.status === 'queued' || i.status === 'busy').length, 'sorting', 'dot busy'],
      [items.filter(i => i.status === 'error').length, 'could not sort', 'dot ring'],
    ].filter(([n]) => n > 0);
    $('counts').innerHTML = counts.map(([n, label, cls]) => `<span class="status"><span class="${cls}"></span>${n} ${label}</span>`).join('');
    $('cards').innerHTML = items.map(cardHtml).join('');
  }

  async function sortOne(item) {
    item.status = 'busy';
    render();
    const form = new FormData();
    form.append('file', item.file);
    const producer = $('producer').value.trim();
    if (producer) form.append('producer', producer);
    try {
      item.result = await call('/classify', { method: 'POST', body: form });
      item.status = 'done';
    } catch (err) {
      if (err.code === 'no_key') { noKey = true; $('nokey').hidden = false; }
      item.status = 'error';
      item.error = err.message;
    }
    render();
  }

  // Runs queued files, a few at a time.
  async function pump() {
    const running = items.filter(i => i.status === 'busy').length;
    const queued = items.filter(i => i.status === 'queued').slice(0, AT_ONCE - running);
    await Promise.all(queued.map(async i => { await sortOne(i); pump(); }));
  }

  function check(file) {
    if (!TYPES.includes(file.type)) return 'Only PDF, JPG and PNG files can be sorted. Save a Word file as PDF first.';
    if (file.size > MAX) return 'This file is over 5 MB.';
    if (noKey) return 'The AI key is not set on the server, so nothing can be sorted.';
    return null;
  }

  function add(files) {
    for (const file of files) {
      const problem = check(file);
      items.push({ id: nextId++, file, status: problem ? 'error' : 'queued', error: problem, result: null, prev: null });
    }
    render();
    pump();
  }

  for (const zone of [$('dropBig'), $('dropSlim')]) {
    const input = zone.querySelector('input');
    input.addEventListener('change', () => { add([...input.files]); input.value = ''; });
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('over'); add([...e.dataTransfer.files]); });
  }
  // A file dropped beside the zone should not open in the tab.
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());

  $('clear').addEventListener('click', () => { items = []; render(); });
  $('again').addEventListener('click', () => {
    for (const i of items) {
      if (check(i.file)) continue;
      if (i.status === 'done') i.prev = i.result;
      i.status = 'queued';
      i.result = null;
    }
    render();
    pump();
  });

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
    const area = document.createElement('textarea'); // older route, for browsers that block the clipboard API
    area.value = text;
    area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    area.remove();
    return ok;
  }

  $('cards').addEventListener('click', async e => {
    // Removing a file that is still sorting drops it; its result is ignored when it arrives.
    const gone = e.target.closest('[data-remove]');
    if (gone) {
      items = items.filter(i => i.id !== Number(gone.dataset.remove));
      render();
      pump();
      return;
    }
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const item = items.find(i => i.id === Number(btn.dataset.copy));
    const label = btn.querySelector('span');
    label.textContent = (await copyText(message(item))) ? 'Copied' : 'Copy failed';
    setTimeout(() => { label.textContent = 'Copy message'; }, 1600);
  });

  render();
});
