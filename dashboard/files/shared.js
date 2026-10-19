// Each <script> runs in its own scope; window.LMT is how the page's files share code.
window.LMT = (function () {
  const KNOWN_LANGUAGES = ['English', 'Japanese', 'Korean'];
  const EMPTY_LANGUAGE_TEXT = 'No corrections in this language yet';
  // The dashboard runtime reads a lone em dash as "no value" and styles it as empty.
  const PLACEHOLDER = '\u2014';

  const fmtInt = d3.format(',');
  const fmtPct = d3.format('.0%');
  const fmtDay = d3.utcFormat('%b %-d, %Y');
  const fmtDayShort = d3.utcFormat('%b %-d');
  const parseDay = s => new Date(String(s).slice(0, 10) + 'T00:00:00Z');
  const currentLang = () => dash.params().language || 'All';

  function fmtField(field, value) {
    if (value == null || value === '') return PLACEHOLDER;
    if (field === 'share') return fmtPct(+value);
    if (field === 'since') return fmtDay(parseDay(value));
    if (field === 'category') return String(value);
    return fmtInt(+value);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function exampleNode(tag, wrong, right) {
    const node = el(tag, 'gt-ex');
    node.append(el('span', 'gt-wrong', wrong == null ? '' : wrong));
    if (right != null && right !== '') node.append(el('span', 'gt-arrow', ' → '), el('span', 'gt-right', right));
    return node;
  }

  function rowsFor(box, source, noteTag) {
    const d = dash.data(source);
    if (d.status === 'loading') return null;
    box.classList.remove('dash-skeleton');
    box.replaceChildren();
    if (d.status !== 'ok') {
      if (d.status === 'error') box.append(el(noteTag || 'div', 'gt-fail', 'Failed to load'));
      return null;
    }
    return d.data || [];
  }

  function showEmpty(box, text, noteTag) {
    box.append(el(noteTag || 'div', 'gt-empty', text));
  }

  function matchRow(rows, where) {
    const pairs = Array.from(new URLSearchParams(where));
    return rows.find(r => pairs.every(([col, value]) => String(r[col]) === value));
  }

  function guideFor(lang, category) {
    const g = dash.data('guides');
    if (g.status !== 'ok') return null;
    const matches = (g.data || []).filter(x => x.category === category);
    return matches.find(x => x.language === lang) || matches.find(x => x.language === 'English') || matches[0] || null;
  }

  function topCategory(lang) {
    const d = dash.data('by_category');
    return d.status === 'ok' ? (d.data || []).find(r => r.language === lang && r.rank === 1) : null;
  }

  return {
    KNOWN_LANGUAGES, EMPTY_LANGUAGE_TEXT, PLACEHOLDER,
    fmtInt, fmtPct, fmtDay, fmtDayShort, parseDay, fmtField, currentLang,
    el, exampleNode, rowsFor, showEmpty, matchRow, guideFor, topCategory
  };
})();
