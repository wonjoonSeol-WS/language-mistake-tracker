(function () {
  const { EMPTY_LANGUAGE_TEXT, el, exampleNode, rowsFor, showEmpty, fmtInt, currentLang, guideFor } = window.LMT;

  function reviewItem(name, count, rule, wrong, right) {
    const li = el('li');
    const top = el('div', 'gt-rv-top');
    top.append(el('span', 'gt-rv-name', name), el('span', 'gt-rv-count', count));
    li.append(top, el('p', 'gt-rv-rule', rule || ''), exampleNode('p', wrong, right));
    return li;
  }

  function drawReviewList(boxId, source, buildItems, emptyText) {
    const box = document.getElementById(boxId);
    const rows = rowsFor(box, source, 'li');
    if (!rows) return;
    const items = buildItems(rows);
    if (items.length) box.append(...items);
    else showEmpty(box, emptyText, 'li');
  }

  function drawReview() {
    const lang = currentLang();
    drawReviewList('review-top', 'by_category', rows => rows
      .filter(r => r.language === lang && r.rank <= 3)
      .map(r => {
        const guide = guideFor(lang, r.category);
        return reviewItem(r.category, fmtInt(r.count) + ' times', guide ? guide.mnemonic : r.example_rule, r.example_original, r.example_corrected);
      }),
      EMPTY_LANGUAGE_TEXT);
    drawReviewList('review-repeats', 'repeats', rows => rows
      .filter(r => r.language === lang)
      .slice(0, 5)
      .map(r => reviewItem(r.category, '×' + fmtInt(r.times), r.rule, r.example_original, r.example_corrected)),
      'No repeated mistakes yet');
  }

  function guideCard(guide, count, showLanguage) {
    const card = el('article', 'gt-guide');
    const meta = el('div', 'gt-guide-meta');
    meta.append(
      el('span', null, guide.category + (showLanguage ? ' (' + guide.language + ')' : '')),
      el('span', null, count ? fmtInt(count) + ' corrections' : 'Flagged by you'));
    const trick = el('p', 'gt-guide-trick');
    trick.append(el('b', null, 'Memory trick: '), guide.mnemonic || '');
    const examples = el('ul', 'gt-guide-ex');
    String(guide.examples || '').split(' | ').filter(Boolean).forEach(pair => {
      const [wrong, ...right] = pair.split(' → ');
      examples.append(exampleNode('li', wrong, right.join(' → ')));
    });
    card.append(meta, el('h3', null, guide.title), el('p', 'gt-guide-rule', guide.rule), trick, examples);
    return card;
  }

  function drawGuides() {
    const box = document.getElementById('guides');
    const guides = rowsFor(box, 'guides');
    if (!guides) return;
    const lang = currentLang();
    const countOf = {};
    const c = dash.data('by_category');
    if (c.status === 'ok') (c.data || []).forEach(r => { countOf[r.language + '|' + r.category] = r.count; });
    const cards = guides
      .filter(x => lang === 'All' || x.language === lang)
      .map(x => ({ guide: x, count: countOf[x.language + '|' + x.category] || 0 }))
      .sort((a, b) => b.count - a.count || +a.guide.id - +b.guide.id);
    if (!cards.length) { showEmpty(box, 'No rules for this language yet'); return; }
    box.append(...cards.map(({ guide, count }) => guideCard(guide, count, lang === 'All')));
  }

  Object.assign(window.LMT, { drawReview, drawGuides });
})();
