(function () {
  const { KNOWN_LANGUAGES, PLACEHOLDER, el, fmtField, currentLang, matchRow, guideFor, topCategory } = window.LMT;

  function drawLangs() {
    const t = dash.data('totals');
    const g = dash.data('guides');
    const present = new Set([
      ...(t.status === 'ok' ? t.data || [] : []).map(r => r.language),
      ...(g.status === 'ok' ? g.data || [] : []).map(r => r.language)
    ]);
    const extra = Array.from(present).filter(l => l !== 'All' && !KNOWN_LANGUAGES.includes(l)).sort();
    const lang = currentLang();
    document.getElementById('langs').replaceChildren(...['All', ...KNOWN_LANGUAGES, ...extra].map(name => {
      const b = el('button', 'gt-btn', name === 'All' ? 'All languages' : name);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(name === lang));
      if (name !== 'All' && t.status === 'ok' && !present.has(name)) { b.disabled = true; b.title = 'Nothing logged yet'; }
      b.addEventListener('click', () => { window.LMT.clearCategory(); dash.setParams({ language: name }); });
      return b;
    }));
  }

  function fillMarks() {
    const lang = currentLang();
    document.querySelectorAll('.gt [data-source][data-field][data-where]').forEach(mark => {
      const where = new URLSearchParams(mark.getAttribute('data-where'));
      where.set('language', lang);
      mark.setAttribute('data-where', where.toString());
      const d = dash.data(mark.getAttribute('data-source'));
      if (d.status === 'loading') { mark.textContent = PLACEHOLDER; return; }
      mark.classList.remove('dash-skeleton');
      const row = d.status === 'ok' ? matchRow(d.data || [], where.toString()) : null;
      const field = mark.getAttribute('data-field');
      mark.textContent = row ? fmtField(field, row[field]) : PLACEHOLDER;
    });

    const top = topCategory(lang);
    document.getElementById('takeaway').hidden = dash.data('by_category').status === 'ok' && !top;
    const guide = top ? guideFor(lang, top.category) : null;
    document.getElementById('tip').textContent = guide ? 'Memory trick: ' + guide.mnemonic : '';
  }

  Object.assign(window.LMT, { drawLangs, fillMarks });
})();
