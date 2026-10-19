(function () {
  const { el, fmtInt, fmtPct, fmtDay, parseDay, currentScope, okRows, guideFor } = window.LMT;
  const KNOWN_LANGUAGES = ['English', 'Japanese', 'Korean'];
  // The dashboard runtime reads a lone em dash as "no value" and styles it as empty.
  const PLACEHOLDER = '—';

  function formatField(field, value) {
    if (value == null || value === '') return PLACEHOLDER;
    if (field === 'share') return fmtPct(value);
    if (field === 'since') return fmtDay(parseDay(value));
    if (field === 'category') return String(value);
    return fmtInt(value);
  }

  function matchRow(rows, where) {
    return rows.find(r => [...where].every(([column, value]) => String(r[column]) === value));
  }

  function drawLanguageButtons() {
    const totals = okRows('totals');
    const logged = new Set([
      ...(totals || []).map(r => r.scope),
      ...(okRows('guides') || []).map(g => g.language)
    ]);
    const others = [...logged].filter(name => name !== 'All' && !KNOWN_LANGUAGES.includes(name)).sort();
    const scope = currentScope();
    document.getElementById('langs').replaceChildren(...['All', ...KNOWN_LANGUAGES, ...others].map(name => {
      const button = el('button', 'gt-btn', name === 'All' ? 'All languages' : name);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(name === scope));
      if (totals && name !== 'All' && !logged.has(name)) {
        button.disabled = true;
        button.title = 'Nothing logged yet';
      }
      button.addEventListener('click', () => dash.setParams({ language: name, category: null }));
      return button;
    }));
  }

  function fillMarks() {
    document.querySelectorAll('.gt [data-source][data-field][data-where]').forEach(mark => {
      const where = new URLSearchParams(mark.getAttribute('data-where'));
      where.set('scope', currentScope());
      mark.setAttribute('data-where', where.toString());
      const d = dash.data(mark.getAttribute('data-source'));
      if (d.status === 'loading') return;
      mark.classList.remove('dash-skeleton');
      const row = matchRow(okRows(mark.getAttribute('data-source')) || [], where);
      const field = mark.getAttribute('data-field');
      mark.textContent = row ? formatField(field, row[field]) : PLACEHOLDER;
    });
  }

  function drawTakeaway() {
    const scope = currentScope();
    const categories = okRows('by_category');
    const top = categories && categories.find(r => r.scope === scope && r.rank === 1);
    document.getElementById('takeaway').hidden = Boolean(categories) && !top;
    const guide = top && guideFor(scope, top.category);
    document.getElementById('trick').textContent = guide ? 'Memory trick: ' + guide.mnemonic : '';
  }

  dash.onData(drawLanguageButtons);
  dash.onData(fillMarks);
  dash.onData(drawTakeaway);
})();
