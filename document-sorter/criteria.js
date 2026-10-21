// Criteria screen: read the criteria, edit with a live preview, keep the last three versions.
Labs.start('criteria', () => {
  const { call, esc, fmtDate } = Labs;
  const $ = id => document.getElementById(id);
  const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const count = n => (n < WORDS.length ? WORDS[n] : String(n));

  let latest = null;
  let versions = [];
  let editing = false;

  // Splits the text into sections, one per heading, plus anything above the first heading.
  function parse(text) {
    const stray = [];
    const sections = [];
    const stack = [];
    const warnings = [];
    for (const line of text.split('\n')) {
      const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
      if (m) {
        const level = m[1].length;
        if (level > 1 && !stack[0]) warnings.push(`"${m[2]}" has no top-level heading above it, so the sorter treats it as a top-level place.`);
        stack.length = Math.min(stack.length, level - 1);
        while (stack.length < level - 1) stack.push('');
        stack.push(m[2]);
        sections.push({ level, title: m[2], path: stack.filter(Boolean), lines: [] });
      } else if (sections.length) {
        sections[sections.length - 1].lines.push(line);
      } else if (line.trim()) {
        stray.push(line);
      }
    }

    if (stray.length) {
      const allBullets = stray.every(l => /^\s*[-*]\s/.test(l));
      const what = allBullets ? (stray.length === 1 ? 'bullet' : 'bullets') : (stray.length === 1 ? 'line' : 'lines');
      warnings.unshift(`${count(stray.length)} ${what} at the top ${stray.length === 1 ? 'has' : 'have'} no heading above ${stray.length === 1 ? 'it' : 'them'}, so the sorter can't place ${stray.length === 1 ? 'it' : 'them'}.`);
    }
    if (!sections.length) warnings.push('There are no headings, so the sorter has nowhere to put documents.');
    const seen = new Set();
    for (const s of sections) {
      const k = s.path.join(' > ').toLowerCase();
      if (seen.has(k)) warnings.push(`Two headings are both called "${s.title}" in the same place. The sorter uses the first.`);
      seen.add(k);
    }
    return { stray, sections, warnings };
  }

  const keyOf = s => s.path.join(' > ').toLowerCase();
  const bodyOf = s => s.lines.join('\n').trim();

  function bodyHtml(lines) {
    let html = '';
    let list = [];
    const flush = () => { if (list.length) html += `<ul>${list.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`; list = []; };
    for (const raw of lines) {
      const line = raw.trim();
      const bullet = line.match(/^[-*]\s+(.*)$/);
      if (bullet) { list.push(bullet[1]); continue; }
      flush();
      if (!line) continue;
      const not = line.match(/^not here if:\s*(.*)$/i);
      html += not ? `<p class="not"><b>Not here if:</b> ${esc(not[1])}</p>` : `<p>${esc(line)}</p>`;
    }
    flush();
    return html;
  }

  // Renders the document. With "against", sections that differ from the saved version get a Scarlet edge.
  function docHtml(text, against) {
    const { stray, sections } = parse(text);
    const before = against ? new Map(parse(against).sections.map(s => [keyOf(s), bodyOf(s)])) : null;
    let html = stray.length ? `<div class="stray">${bodyHtml(stray)}</div>` : '';
    for (const s of sections) {
      const changed = before && before.get(keyOf(s)) !== bodyOf(s);
      const head = s.level === 1 ? `<div class="h1 display">${esc(s.title)}</div>` : `<div class="h2">${esc(s.title)}</div>`;
      html += `<div class="sec${changed ? ' changed' : ''}">${head}${bodyHtml(s.lines)}</div>`;
    }
    return html;
  }

  function showVersions() {
    $('versions').innerHTML = versions.map((v, i) => `<div class="ver">
      <div><b>Version ${v.version}</b><span>${esc(fmtDate(v.saved_at))}</span></div>
      <span class="right">${i === 0 ? '<span class="inuse">In use</span>' : `<button class="link" type="button" data-restore="${v.version}">Restore</button>`}</span>
    </div>`).join('');
  }

  function showView() {
    editing = false;
    $('view').hidden = false;
    $('editing').hidden = true;
    $('doc').innerHTML = docHtml(latest.text);
    showVersions();
  }

  // The editor grows with its text, so it lines up with the preview beside it.
  function grow() {
    const t = $('text');
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 2 + 'px';
  }

  function refreshPreview() {
    grow();
    const text = $('text').value;
    const { warnings } = parse(text);
    $('warn').hidden = !warnings.length;
    $('warnText').textContent = warnings.length ? `${warnings.join(' ')} Saving still works.` : '';
    $('preview').innerHTML = docHtml(text, latest.text);
  }

  function showEdit() {
    editing = true;
    $('view').hidden = true;
    $('editing').hidden = false;
    $('msg').textContent = '';
    $('text').value = latest.text;
    $('save').textContent = `Save as version ${latest.version + 1}`;
    refreshPreview();
    $('text').focus();
    $('text').setSelectionRange(0, 0);
  }

  function take(data) { latest = data.latest; versions = data.versions; }

  async function load() {
    try { take(await call('/criteria')); showView(); }
    catch (err) { $('view').hidden = false; $('msg').textContent = err.message; }
  }

  $('edit').addEventListener('click', showEdit);
  $('text').addEventListener('input', refreshPreview);
  $('cancel').addEventListener('click', () => {
    if ($('text').value !== latest.text && !confirm('Discard your changes?')) return;
    showView();
  });

  $('save').addEventListener('click', async () => {
    const btn = $('save');
    btn.disabled = true;
    try {
      take(await call('/criteria', { method: 'POST', body: { text: $('text').value } }));
      showView();
      $('msg').textContent = `Saved as version ${latest.version}. The next sort uses it.`;
    } catch (err) {
      $('warn').hidden = false;
      $('warnText').textContent = err.message;
    }
    btn.disabled = false;
  });

  $('versions').addEventListener('click', async e => {
    const btn = e.target.closest('[data-restore]');
    if (!btn) return;
    const from = Number(btn.dataset.restore);
    btn.disabled = true;
    try {
      take(await call('/criteria', { method: 'POST', body: { restore: from } }));
      showView();
      $('msg').textContent = `Version ${from} restored as version ${latest.version}. The next sort uses it.`;
    } catch (err) {
      $('msg').textContent = err.message;
      btn.disabled = false;
    }
  });

  window.addEventListener('beforeunload', e => {
    if (editing && latest && $('text').value !== latest.text) e.preventDefault();
  });

  load();
});
