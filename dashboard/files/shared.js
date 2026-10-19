// Each <script> runs in its own scope; window.LMT is how the page's files share code.
window.LMT = (function () {
  const fmtInt = d3.format(',');
  const fmtPct = d3.format('.0%');
  const fmtDay = d3.utcFormat('%b %-d, %Y');
  const parseDay = s => new Date(String(s).slice(0, 10) + 'T00:00:00Z');
  const currentScope = () => dash.params().language || 'All';

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function okRows(source) {
    const d = dash.data(source);
    return d.status === 'ok' ? d.data || [] : null;
  }

  function noteIn(box, className, text) {
    box.append(el(box.tagName === 'UL' ? 'li' : 'div', className, text));
  }

  function resetPanel(box, source) {
    const d = dash.data(source);
    if (d.status === 'loading') return null;
    box.classList.remove('dash-skeleton');
    box.replaceChildren();
    if (d.status === 'error') noteIn(box, 'gt-fail', 'Failed to load');
    return okRows(source);
  }

  function scopedRowsIn(box, source, emptyText = 'No corrections in this language yet') {
    const rows = resetPanel(box, source);
    if (!rows) return [];
    const inScope = rows.filter(r => r.scope === currentScope());
    if (!inScope.length) noteIn(box, 'gt-empty', emptyText);
    return inScope;
  }

  function guideFor(scope, category) {
    const matches = (okRows('guides') || []).filter(g => g.category === category);
    return matches.find(g => g.language === scope) || matches.find(g => g.language === 'English') || matches[0] || null;
  }

  return { fmtInt, fmtPct, fmtDay, parseDay, currentScope, el, okRows, noteIn, resetPanel, scopedRowsIn, guideFor };
})();
